import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PublicModerationStatus,
  PublicPostType,
  PublicPostVisibility,
  ReluAccessMode,
  ReluTaskStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { buildSuccessResponse } from '../common/api-response';
import { AuditService } from '../audit/audit.service';

export type UploadedMarketplaceFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type AuthenticatedUser = {
  sub: string;
  role: string;
};

type PublicPostFilters = {
  type?: string;
  status?: string;
  visibility?: string;
  q?: string;
};

type NormalizedPublicPostPayload = Prisma.PublicPostUncheckedCreateInput & {
  externalLinkUrl?: string;
};


@Injectable()
export class PublicPostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(filters: PublicPostFilters = {}) {
    const posts = await this.prisma.publicPost.findMany({
      where: this.buildWhere(filters, false),
      include: this.adminPostInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return buildSuccessResponse(posts.map((post) => this.toPublicPostResponse(post, false)));
  }

  async findAllForAdmin(filters: PublicPostFilters = {}) {
    const posts = await this.prisma.publicPost.findMany({
      where: this.buildWhere(filters, true),
      include: this.adminPostInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return buildSuccessResponse(posts.map((post) => this.toPublicPostResponse(post, true)));
  }

  async findMine(user: AuthenticatedUser) {
    const posts = await this.prisma.publicPost.findMany({
      where: {
        authorUserId: user.sub,
      },
      include: this.adminPostInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return buildSuccessResponse(posts.map((post) => this.toPublicPostResponse(post, true)));
  }

  async findOne(id: string, user?: AuthenticatedUser | null) {
    const post = await this.prisma.publicPost.findUnique({
      where: { id },
      include: this.adminPostInclude,
    });

    if (!post) {
      throw new NotFoundException('Public post not found');
    }

    if (!this.canReadPost(post, user)) {
      throw new ForbiddenException('This marketplace post is not public');
    }

    return buildSuccessResponse(this.toPublicPostResponse(post, this.canManagePost(post, user)));
  }

  async create(body: Record<string, unknown>, user: AuthenticatedUser) {
    const normalized = await this.normalizePublicPostPayload(body, user);
    const { externalLinkUrl, ...data } = normalized;

    const post = await this.prisma.publicPost.create({
      data,
      include: this.adminPostInclude,
    });

    if (externalLinkUrl) {
      await this.prisma.externalLinkSubmission.create({
        data: this.buildExternalLinkData(post.id, externalLinkUrl, data.ownerName),
      });
      await this.createModerationTask('PUBLIC_POST_EXTERNAL_LINK', post.id, user.sub, {
        postId: post.id,
        url: externalLinkUrl,
      });
    }

    await this.createModerationTask('PUBLIC_POST', post.id, user.sub, {
      type: post.type,
      title: post.title,
    });
    await this.createReluIngestionTask(post.id, user.sub, {
      trigger: 'CREATE',
      slug: post.slug,
      moderationStatus: post.moderationStatus,
    });

    const withRelations = await this.prisma.publicPost.findUnique({
      where: { id: post.id },
      include: this.adminPostInclude,
    });

    return buildSuccessResponse(this.toPublicPostResponse(withRelations ?? post, true));
  }

  async update(id: string, body: Record<string, unknown>, user: AuthenticatedUser) {
    const existing = await this.prisma.publicPost.findUnique({
      where: { id },
      include: {
        externalLinks: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Public post not found');
    }

    this.assertCanManagePost(existing, user);

    const normalized = await this.normalizePublicPostPayload(body, user, existing);
    const { externalLinkUrl, ...data } = normalized;

    const post = await this.prisma.publicPost.update({
      where: { id },
      data,
      include: this.adminPostInclude,
    });

    if (typeof externalLinkUrl === 'string' && externalLinkUrl.trim()) {
      const existingLink = existing.externalLinks[0] ?? null;

      if (existingLink) {
        await this.prisma.externalLinkSubmission.update({
          where: { id: existingLink.id },
          data: this.buildExternalLinkUpdateData(externalLinkUrl, data.ownerName),
        });
      } else {
        await this.prisma.externalLinkSubmission.create({
          data: this.buildExternalLinkData(post.id, externalLinkUrl, data.ownerName),
        });
      }

      await this.createModerationTask('PUBLIC_POST_EXTERNAL_LINK', post.id, user.sub, {
        postId: post.id,
        url: externalLinkUrl,
      });
    }

    await this.createModerationTask('PUBLIC_POST', post.id, user.sub, {
      type: post.type,
      title: post.title,
      operation: 'update',
    });
    await this.createReluIngestionTask(post.id, user.sub, {
      trigger: 'UPDATE',
      slug: post.slug,
      moderationStatus: post.moderationStatus,
    });

    const withRelations = await this.prisma.publicPost.findUnique({
      where: { id },
      include: this.adminPostInclude,
    });

    return buildSuccessResponse(this.toPublicPostResponse(withRelations ?? post, true));
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.publicPost.findUnique({
      where: { id },
      include: {
        media: true,
        documents: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Public post not found');
    }

    this.assertCanManagePost(existing, user);

    await this.prisma.publicPost.delete({
      where: { id },
    });

    for (const media of existing.media) {
      await rm(this.resolveStoragePath(media.url), { force: true }).catch(() => undefined);
    }

    for (const document of existing.documents) {
      await rm(this.resolveStoragePath(document.storageKey), { force: true }).catch(() => undefined);
    }

    return buildSuccessResponse({ success: true });
  }

  async addMedia(
    postId: string,
    body: Record<string, unknown>,
    file: UploadedMarketplaceFile | undefined,
    user: AuthenticatedUser,
  ) {
    const post = await this.prisma.publicPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Public post not found');
    }

    this.assertCanManagePost(post, user);

    if (!file) {
      throw new BadRequestException('Media file is required');
    }

    const storageKey = await this.persistUploadedFile(postId, 'media', file);
    const role = typeof body.role === 'string' && body.role.trim() ? body.role.trim() : 'GALLERY';
    const type = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';

    const created = await this.prisma.publicPostMedia.create({
      data: {
        postId,
        url: storageKey,
        type: type as never,
        role,
        alt: typeof body.alt === 'string' ? body.alt.trim() : null,
        status: PublicModerationStatus.PENDING,
      },
    });

    if (role === 'BANNER') {
      await this.prisma.publicPost.update({
        where: { id: postId },
        data: {
          bannerUrl: storageKey,
        },
      });
    }

    await this.createModerationTask('PUBLIC_POST_MEDIA', created.id, user.sub, {
      postId,
      role,
      type,
      url: storageKey,
    });

    return buildSuccessResponse(created);
  }

  async addDocument(
    postId: string,
    body: Record<string, unknown>,
    file: UploadedMarketplaceFile | undefined,
    user: AuthenticatedUser,
  ) {
    const post = await this.prisma.publicPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Public post not found');
    }

    this.assertCanManagePost(post, user);

    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    const storageKey = await this.persistUploadedFile(postId, 'documents', file);

    const document = await this.prisma.publicPostDocument.create({
      data: {
        postId,
        title:
          typeof body.title === 'string' && body.title.trim()
            ? body.title.trim()
            : file.originalname,
        description:
          typeof body.description === 'string' && body.description.trim()
            ? body.description.trim()
            : null,
        fileName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        storageProvider: 'local',
        storageKey,
        status: PublicModerationStatus.PENDING,
      },
    });

    await this.createModerationTask('PUBLIC_POST_DOCUMENT', document.id, user.sub, {
      postId,
      title: document.title,
      mimeType: document.mimeType,
    });

    return buildSuccessResponse(document);
  }

  async addExternalLink(postId: string, body: Record<string, unknown>, user: AuthenticatedUser) {
    const post = await this.prisma.publicPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Public post not found');
    }

    this.assertCanManagePost(post, user);

    const url = typeof body.url === 'string' ? body.url.trim() : '';

    if (!url) {
      throw new BadRequestException('External link URL is required');
    }

    const created = await this.prisma.externalLinkSubmission.create({
      data: this.buildExternalLinkData(postId, url, post.ownerName),
    });

    await this.createModerationTask('PUBLIC_POST_EXTERNAL_LINK', created.id, user.sub, {
      postId,
      url,
    });

    return buildSuccessResponse(created);
  }

  async getMediaAsset(mediaId: string, user?: AuthenticatedUser | null) {
    const media = await this.prisma.publicPostMedia.findUnique({
      where: { id: mediaId },
      include: {
        post: true,
      },
    });

    if (!media || !media.post) {
      throw new NotFoundException('Public post media not found');
    }

    if (
      media.status !== PublicModerationStatus.APPROVED &&
      !(user && (user.role === "ADMIN" || user.role === 'SUPERADMIN' || media.post.authorUserId === user.sub))
    ) {
      throw new ForbiddenException('Media is not available');
    }

    if (!this.canReadPost(media.post, user)) {
      throw new ForbiddenException('Media is not available');
    }

    return {
      fileName: media.url.split('/').pop() ?? 'media-file',
      mimeType: media.type === 'VIDEO' ? 'video/mp4' : 'image/jpeg',
      canPreview: true,
      stream: createReadStream(this.resolveStoragePath(media.url)),
    };
  }

  async getDocumentAsset(documentId: string, user?: AuthenticatedUser | null) {
    const document = await this.prisma.publicPostDocument.findUnique({
      where: { id: documentId },
      include: {
        post: true,
      },
    });

    if (!document || !document.post) {
      throw new NotFoundException('Public post document not found');
    }

    if (
      document.status !== PublicModerationStatus.APPROVED &&
      !(user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || document.post.authorUserId === user.sub))
    ) {
      throw new ForbiddenException('Document is not available');
    }

    if (!this.canReadPost(document.post, user)) {
      throw new ForbiddenException('Document is not available');
    }

    return {
      fileName: document.fileName,
      mimeType: document.mimeType,
      canPreview:
        document.mimeType === 'application/pdf' || document.mimeType.startsWith('image/'),
      stream: createReadStream(this.resolveStoragePath(document.storageKey)),
    };
  }

  async updatePostStatus(
    id: string,
    body: { status?: string; moderationStatus?: string; visibility?: string },
  ) {
    const nextModerationStatus =
      typeof body.moderationStatus === 'string'
        ? body.moderationStatus
        : undefined;
    const nextStatus =
      typeof body.status === 'string' && body.status.trim()
        ? body.status.trim()
        : nextModerationStatus === PublicModerationStatus.APPROVED
          ? 'LIVE'
          : nextModerationStatus === PublicModerationStatus.REJECTED
            ? 'REJECTED'
            : nextModerationStatus === PublicModerationStatus.PENDING
              ? 'PENDING_MODERATION'
              : undefined;

    const post = await this.prisma.publicPost.update({
      where: { id },
      data: {
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(nextModerationStatus
          ? { moderationStatus: nextModerationStatus as never }
          : {}),
        ...(typeof body.visibility === 'string'
          ? { visibility: body.visibility as never }
          : {}),
      },
      include: this.adminPostInclude,
    });

    return buildSuccessResponse(this.toPublicPostResponse(post, true));
  }

  async listMediaForAdmin() {
    const media = await this.prisma.publicPostMedia.findMany({
      include: {
        post: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return buildSuccessResponse(media);
  }

  async listDocumentsForAdmin() {
    const documents = await this.prisma.publicPostDocument.findMany({
      include: {
        post: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return buildSuccessResponse(documents);
  }

  async updateMediaStatus(id: string, status: string) {
    const media = await this.prisma.publicPostMedia.update({
      where: { id },
      data: {
        status: status as never,
      },
      include: {
        post: true,
      },
    });

    return buildSuccessResponse(media);
  }

  async updateDocumentStatus(id: string, status: string) {
    const document = await this.prisma.publicPostDocument.update({
      where: { id },
      data: {
        status: status as never,
      },
      include: {
        post: true,
      },
    });

    return buildSuccessResponse(document);
  }

  private async normalizePublicPostPayload(
    body: Record<string, unknown>,
    user: AuthenticatedUser,
    existing?: any,
  ): Promise<NormalizedPublicPostPayload> {
    const author = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: { profile: true },
    });

    if (!author) {
      throw new NotFoundException('Authenticated user not found');
    }

    const title = this.stringValue(body.title, existing?.title, 'Untitled marketplace post');
    const slug = await this.resolveUniqueSlug(
      this.stringValue(body.slug, existing?.slug, title),
      existing?.id ?? null,
    );

    return {
      slug,
      authorUserId: author.id,
      authorProfileId: author.profile?.id ?? null,
      type: this.normalizePostType(body.type, existing?.type),
      title,
      description: this.stringValue(body.description, existing?.description, 'No description provided.'),
      summary: this.nullableStringValue(body.summary, existing?.summary ?? null),
      domain: this.stringValue(body.domain, existing?.domain, 'General'),
      location: this.stringValue(body.location, existing?.location, 'Unspecified'),
      status:
        user.role === 'ADMIN' || user.role === 'SUPERADMIN'
          ? this.stringValue(body.status, existing?.status, 'PENDING_MODERATION')
          : 'PENDING_MODERATION',
      moderationStatus:
        user.role === 'ADMIN' || user.role === 'SUPERADMIN'
          ? existing?.moderationStatus ?? PublicModerationStatus.PENDING
          : PublicModerationStatus.PENDING,
      bannerUrl: this.nullableStringValue(body.bannerUrl, existing?.bannerUrl ?? null),
      experienceLabel: this.nullableStringValue(body.experienceLabel, existing?.experienceLabel ?? null),
      value: this.stringValue(body.value, existing?.value, 'To be confirmed'),
      currencyCode: this.nullableStringValue(body.currencyCode, existing?.currencyCode ?? null),
      vatRate: this.numberValue(body.vatRate, existing?.vatRate ?? null),
      fiscalMetadataJson: this.objectValue(body.fiscalMetadataJson, existing?.fiscalMetadataJson ?? {}),
      budgetMin: this.numberValue(body.budgetMin, existing?.budgetMin ?? null),
      budgetMax: this.numberValue(body.budgetMax, existing?.budgetMax ?? null),
      salaryMin: this.numberValue(body.salaryMin, existing?.salaryMin ?? null),
      salaryMax: this.numberValue(body.salaryMax, existing?.salaryMax ?? null),
      ownerName: this.stringValue(
        body.ownerName,
        existing?.ownerName,
        author.profile?.displayName ?? author.email,
      ),
      ownerType: this.stringValue(
        body.ownerType,
        existing?.ownerType,
        author.profile?.profileType ?? author.role,
      ),
      classificationJson: this.objectValue(body.classificationJson, existing?.classificationJson ?? {}),
      certifications: this.stringValue(body.certifications, existing?.certifications, ''),
      certificationsOffered: this.stringValue(
        body.certificationsOffered,
        existing?.certificationsOffered ?? '',
        '',
      ),
      visibility: this.normalizeVisibility(body.visibility, existing?.visibility),
      escoCodesJson: JSON.stringify(this.arrayOfStrings(body.escoCodesJson, existing?.escoCodesJson)),
      naceCodesJson: JSON.stringify(this.arrayOfStrings(body.naceCodesJson, existing?.naceCodesJson)),
      uniclassCodesJson: JSON.stringify(this.arrayOfStrings(body.uniclassCodesJson, existing?.uniclassCodesJson)),
      languageCodesJson: JSON.stringify(this.arrayOfStrings(body.languageCodesJson, existing?.languageCodesJson)),
      documentsJson: JSON.stringify(this.arrayOfObjects(body.documentsJson, existing?.documentsJson)),
      countryId: this.nullableStringValue(body.countryId, existing?.countryId ?? null),
      regionId: this.nullableStringValue(body.regionId, existing?.regionId ?? null),
      cityId: this.nullableStringValue(body.cityId, existing?.cityId ?? null),
      externalLinkUrl:
        typeof body.externalLinkUrl === 'string' && body.externalLinkUrl.trim()
          ? body.externalLinkUrl.trim()
          : undefined,
    };
  }

  private buildWhere(filters: PublicPostFilters, admin: boolean) {
    const where: Prisma.PublicPostWhereInput = {};

    if (!admin) {
      where.visibility = PublicPostVisibility.PUBLIC;
      where.moderationStatus = PublicModerationStatus.APPROVED;
      where.status =
        typeof filters.status === 'string' && filters.status ? filters.status : 'LIVE';
    } else if (typeof filters.status === 'string' && filters.status) {
      where.status = filters.status;
    }

    if (typeof filters.type === 'string' && filters.type) {
      where.type = filters.type as PublicPostType;
    }

    if (admin && typeof filters.visibility === 'string' && filters.visibility) {
      where.visibility = filters.visibility as PublicPostVisibility;
    }

    if (typeof filters.q === 'string' && filters.q.trim()) {
      where.OR = [
        {
          title: {
            contains: filters.q.trim(),
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filters.q.trim(),
            mode: 'insensitive',
          },
        },
        {
          ownerName: {
            contains: filters.q.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    return where;
  }

  private canReadPost(post: { visibility: PublicPostVisibility; moderationStatus: PublicModerationStatus; status: string; authorUserId?: string | null }, user?: AuthenticatedUser | null) {
    if (
      post.visibility === PublicPostVisibility.PUBLIC &&
      post.moderationStatus === PublicModerationStatus.APPROVED &&
      post.status === 'LIVE'
    ) {
      return true;
    }

    if (!user) {
      return false;
    }

    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      return true;
    }

    return post.authorUserId === user.sub;
  }

  private assertCanManagePost(post: { authorUserId?: string | null }, user: AuthenticatedUser) {
    if (this.canManagePost(post, user)) {
      return;
    }

    throw new ForbiddenException('You cannot manage this marketplace post');
  }

  private canManagePost(
    post: { authorUserId?: string | null },
    user?: AuthenticatedUser | null,
  ) {
    if (!user) {
      return false;
    }

    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      return true;
    }

    return post.authorUserId === user.sub;
  }

  private toPublicPostResponse(post: Record<string, unknown>, includePrivateRelations = false) {
    const typedPost = includePrivateRelations
      ? (post as Record<string, unknown>)
      : this.filterPublicRelations(post as Record<string, unknown>);

    return {
      ...typedPost,
      escoCodes: this.parseStringArray((typedPost as { escoCodesJson?: string | null }).escoCodesJson),
      naceCodes: this.parseStringArray((typedPost as { naceCodesJson?: string | null }).naceCodesJson),
      uniclassCodes: this.parseStringArray((typedPost as { uniclassCodesJson?: string | null }).uniclassCodesJson),
      languageCodes: this.parseStringArray((typedPost as { languageCodesJson?: string | null }).languageCodesJson),
      documentRefs: this.parseJsonArray((typedPost as { documentsJson?: string | null }).documentsJson),
      externalLinks: Array.isArray((typedPost as { externalLinks?: unknown[] }).externalLinks)
        ? (typedPost as { externalLinks: unknown[] }).externalLinks
        : [],
      media: Array.isArray((typedPost as { media?: unknown[] }).media)
        ? (typedPost as { media: unknown[] }).media
        : [],
      mediaAssets: Array.isArray((typedPost as { media?: Array<Record<string, unknown>> }).media)
        ? (typedPost as { media: Array<Record<string, unknown>> }).media.map((item) => ({
            ...item,
            assetUrl: `/public-posts/media/${item.id}`,
          }))
        : [],
      country: (typedPost as { country?: unknown }).country ?? null,
      region: (typedPost as { region?: unknown }).region ?? null,
      city: (typedPost as { city?: unknown }).city ?? null,
      documents: Array.isArray((typedPost as { documents?: Array<Record<string, unknown>> }).documents)
        ? (typedPost as { documents: Array<Record<string, unknown>> }).documents.map((item) => ({
            ...item,
            downloadUrl: `/public-posts/documents/${item.id}`,
          }))
        : [],
    };
  }

  private filterPublicRelations(post: Record<string, unknown>) {
    return {
      ...post,
      media: Array.isArray(post.media)
        ? post.media.filter(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              (item as { status?: unknown }).status === PublicModerationStatus.APPROVED,
          )
        : [],
      documents: Array.isArray(post.documents)
        ? post.documents.filter(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              (item as { status?: unknown }).status === PublicModerationStatus.APPROVED,
          )
        : [],
      externalLinks: Array.isArray(post.externalLinks)
        ? post.externalLinks.filter(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              (item as { securityStatus?: unknown }).securityStatus === 'APPROVED',
          )
        : [],
    };
  }

  private async createModerationTask(
    contextEntityType: string,
    contextEntityId: string,
    requestedByUserId: string,
    inputSummary: Record<string, unknown>,
  ) {
    const task = await this.prisma.reluTask.create({
      data: {
        capability: 'public-feed-moderation-placeholder',
        accessMode: ReluAccessMode.ADMIN_SECURED,
        status: ReluTaskStatus.PENDING,
        requestedByUserId,
        contextEntityType,
        contextEntityId,
        title: `Relu moderation placeholder: ${contextEntityType}`,
        inputSummaryJson: inputSummary as Prisma.InputJsonValue,
      },
    });

    await this.auditService.log({
      actorUserId: requestedByUserId,
      projectId: null,
      entityType: 'RELU_TASK',
      entityId: task.id,
      action: 'QUEUE_PUBLIC_MODERATION_PLACEHOLDER',
      before: null,
      after: {
        taskId: task.id,
        contextEntityType,
        contextEntityId,
      },
      metadata: inputSummary,
    });
  }

  private async createReluIngestionTask(
    postId: string,
    requestedByUserId: string,
    inputSummary: Record<string, unknown>,
  ) {
    const task = await this.prisma.reluTask.create({
      data: {
        capability: 'public-post-ingestion-queued',
        accessMode: ReluAccessMode.ADMIN_SECURED,
        status: ReluTaskStatus.PENDING,
        requestedByUserId,
        contextEntityType: 'PUBLIC_POST',
        contextEntityId: postId,
        title: 'Relu ingestion queue: PUBLIC_POST',
        inputSummaryJson: inputSummary as Prisma.InputJsonValue,
      },
    });

    await this.auditService.log({
      actorUserId: requestedByUserId,
      projectId: null,
      entityType: 'RELU_TASK',
      entityId: task.id,
      action: 'QUEUE_PUBLIC_POST_INGESTION',
      before: null,
      after: {
        taskId: task.id,
        postId,
      },
      metadata: inputSummary,
    });
  }

  private buildExternalLinkData(postId: string, url: string, submittedBy: string) {
    return {
      url,
      normalizedUrl: this.normalizeUrl(url),
      sourcePostId: postId,
      submittedBy,
      securityStatus: 'PENDING' as never,
      reasonsJson: JSON.stringify(this.linkReasons(url)),
    };
  }

  private buildExternalLinkUpdateData(url: string, submittedBy: string) {
    return {
      url,
      normalizedUrl: this.normalizeUrl(url),
      submittedBy,
      securityStatus: 'PENDING' as never,
      reasonsJson: JSON.stringify(this.linkReasons(url)),
    };
  }

  private linkReasons(url: string) {
    const reasons: string[] = [];

    reasons.push(url.startsWith('https://') ? 'HTTPS detected' : 'HTTP link detected');

    if (/\.(exe|bat|cmd|msi)(\?|$)/i.test(url)) {
      reasons.push('Executable extension detected');
    } else {
      reasons.push('No blocked extension detected');
    }

    return reasons;
  }

  private normalizeUrl(url: string) {
    return url.trim();
  }

  private normalizePostType(value: unknown, fallback?: PublicPostType) {
    if (
      value === PublicPostType.PROJECT ||
      value === PublicPostType.PROFESSIONAL ||
      value === PublicPostType.SUBCONTRACTOR_POOL
    ) {
      return value;
    }

    if (
      fallback === PublicPostType.PROJECT ||
      fallback === PublicPostType.PROFESSIONAL ||
      fallback === PublicPostType.SUBCONTRACTOR_POOL
    ) {
      return fallback;
    }

    return PublicPostType.PROJECT;
  }

  private normalizeVisibility(value: unknown, fallback?: PublicPostVisibility) {
    if (value === PublicPostVisibility.PUBLIC || value === PublicPostVisibility.PRIVATE) {
      return value;
    }

    if (fallback === PublicPostVisibility.PUBLIC || fallback === PublicPostVisibility.PRIVATE) {
      return fallback;
    }

    return PublicPostVisibility.PUBLIC;
  }

  private stringValue(value: unknown, fallback: string | undefined, defaultValue: string) {
    return typeof value === 'string' && value.trim()
      ? value.trim()
      : fallback && fallback.trim()
        ? fallback.trim()
        : defaultValue;
  }

  private nullableStringValue(value: unknown, fallback: string | null) {
    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized ? normalized : null;
    }

    return fallback ?? null;
  }

  private numberValue(value: unknown, fallback: number | null) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
  }

  private objectValue(value: unknown, fallback: any) {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Prisma.InputJsonValue)
      : fallback;
  }

  private arrayOfStrings(value: unknown, fallback: string | null | undefined) {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
          : [];
      } catch {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    if (typeof fallback === 'string' && fallback) {
      return this.parseStringArray(fallback);
    }

    return [];
  }

  private arrayOfObjects(value: unknown, fallback: string | null | undefined) {
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === 'object' && item !== null);
    }

    if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    if (typeof fallback === 'string' && fallback) {
      return this.parseJsonArray(fallback);
    }

    return [];
  }

  private parseStringArray(value: string | null | undefined) {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }

  private parseJsonArray(value: string | null | undefined) {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async resolveUniqueSlug(value: string, currentId: string | null) {
    const baseSlug = this.slugify(value);
    let slug = baseSlug;
    let index = 2;

    while (true) {
      const existing = await this.prisma.publicPost.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === currentId) {
        return slug;
      }

      slug = `${baseSlug}-${index}`;
      index += 1;
    }
  }

  private slugify(value: string) {
    return (
      value
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `market-${Date.now()}`
    );
  }

  private async persistUploadedFile(
    postId: string,
    folder: 'media' | 'documents',
    file: UploadedMarketplaceFile,
  ) {
    const targetFolder = join(this.getUploadsRoot(), folder, postId);
    const extension = extname(file.originalname) || this.extensionFromMime(file.mimetype);
    const uniqueFileName = `${randomUUID()}${extension}`;
    const relativeStorageKey = `public-posts/${folder}/${postId}/${uniqueFileName}`;

    await mkdir(targetFolder, { recursive: true });
    await writeFile(join(this.getBaseUploadsPath(), relativeStorageKey), file.buffer);

    return relativeStorageKey;
  }

  private getBaseUploadsPath() {
    return join(process.cwd(), 'uploads');
  }

  private getUploadsRoot() {
    return join(this.getBaseUploadsPath(), 'public-posts');
  }

  private resolveStoragePath(storageKey: string) {
    return join(this.getBaseUploadsPath(), storageKey);
  }

  private extensionFromMime(mimeType: string) {
    const mimeMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
    };

    return mimeMap[mimeType] ?? '';
  }

  private readonly adminPostInclude = {
    country: true,
    region: true,
    city: true,
    media: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    documents: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    externalLinks: true,
    privateConversations: {
      include: {
        messages: true,
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    comments: true,
    reviews: true,
  } as const;
}
