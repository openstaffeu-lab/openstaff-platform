import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildSuccessResponse,
  isPrismaConnectionOrSchemaError,
  logEndpointError,
} from '../common/api-response';
import {
  cloneDemoPublicPosts,
  demoPublicPostMedia,
} from '../common/public-interaction-demo';

@Injectable()
export class PublicPostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      const posts = await this.prisma.publicPost.findMany({
        include: {
          media: true,
          externalLinks: true,
          privateConversations: {
            include: {
              messages: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          comments: true,
          reviews: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return buildSuccessResponse(posts);
    } catch (error) {
      logEndpointError('PublicPostsService.findAll', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildSuccessResponse(cloneDemoPublicPosts(), 'placeholder');
      }

      throw error;
    }
  }

  async findAllForAdmin() {
    return this.findAll();
  }

  async findOne(id: string) {
    try {
      const post = await this.prisma.publicPost.findUnique({
        where: { id },
        include: {
          media: true,
          externalLinks: true,
          privateConversations: {
            include: {
              messages: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          comments: true,
          reviews: true,
        },
      });

      if (!post) {
        throw new NotFoundException('Public post not found');
      }

      return buildSuccessResponse(post);
    } catch (error) {
      if (isPrismaConnectionOrSchemaError(error)) {
        const post = cloneDemoPublicPosts().find((item: any) => item.id === id);

        if (!post) {
          throw new NotFoundException('Public post not found');
        }

        return buildSuccessResponse(post, 'placeholder');
      }

      throw error;
    }
  }

  async create(body: Record<string, unknown>) {
    const data = normalizePublicPostPayload(body);

    try {
      const post = await this.prisma.publicPost.create({
        data: {
          type: data.type as any,
          title: data.title,
          description: data.description,
          domain: data.domain,
          location: data.location,
          status: data.status,
          value: data.value,
          ownerName: data.ownerName,
          ownerType: data.ownerType,
          classificationJson: data.classificationJson as any,
          certifications: data.certifications,
          visibility: data.visibility as any,
        },
        include: {
          media: true,
          externalLinks: true,
          privateConversations: true,
          comments: true,
          reviews: true,
        },
      });

      return buildSuccessResponse(post);
    } catch (error) {
      logEndpointError('PublicPostsService.create', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildSuccessResponse(
          {
            id: `placeholder-public-post-${Date.now()}`,
            ...data,
            media: [],
            externalLinks: [],
            privateConversations: [],
            comments: [],
            reviews: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          'placeholder',
        );
      }

      throw error;
    }
  }

  async update(id: string, body: Record<string, unknown>) {
    const data = normalizePublicPostPayload(body);

    try {
      const post = await this.prisma.publicPost.update({
        where: { id },
        data: {
          type: data.type as any,
          title: data.title,
          description: data.description,
          domain: data.domain,
          location: data.location,
          status: data.status,
          value: data.value,
          ownerName: data.ownerName,
          ownerType: data.ownerType,
          classificationJson: data.classificationJson as any,
          certifications: data.certifications,
          visibility: data.visibility as any,
        },
        include: {
          media: true,
          externalLinks: true,
          privateConversations: true,
          comments: true,
          reviews: true,
        },
      });

      return buildSuccessResponse(post);
    } catch (error) {
      logEndpointError('PublicPostsService.update', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildSuccessResponse(
          {
            id,
            ...data,
            media: [],
            externalLinks: [],
            privateConversations: [],
            comments: [],
            reviews: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          'placeholder',
        );
      }

      throw error;
    }
  }

  async addMedia(postId: string, body: Record<string, unknown>) {
    const media = normalizeMediaPayload(postId, body);

    try {
      const created = await this.prisma.publicPostMedia.create({
        data: {
          postId,
          url: media.url,
          type: media.type as any,
          alt: media.alt,
          status: media.status as any,
        },
      });

      return buildSuccessResponse(created);
    } catch (error) {
      logEndpointError('PublicPostsService.addMedia', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildSuccessResponse(
          {
            id: `placeholder-media-${Date.now()}`,
            ...media,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          'placeholder',
        );
      }

      throw error;
    }
  }

  async listMediaForAdmin() {
    try {
      const media = await this.prisma.publicPostMedia.findMany({
        include: {
          post: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return buildSuccessResponse(media);
    } catch (error) {
      logEndpointError('PublicPostsService.listMediaForAdmin', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        const demo = demoPublicPostMedia.map((item: any) => ({
          ...item,
          post: cloneDemoPublicPosts().find((post: any) => post.id === item.postId) ?? null,
        }));

        return buildSuccessResponse(demo, 'placeholder');
      }

      throw error;
    }
  }

  async updateMediaStatus(id: string, status: string) {
    try {
      const media = await this.prisma.publicPostMedia.update({
        where: { id },
        data: {
          status: status as any,
        },
        include: {
          post: true,
        },
      });

      return buildSuccessResponse(media);
    } catch (error) {
      logEndpointError('PublicPostsService.updateMediaStatus', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        const media = demoPublicPostMedia.find((item: any) => item.id === id);

        if (!media) {
          throw new NotFoundException('Public post media not found');
        }

        return buildSuccessResponse(
          {
            ...media,
            status,
            post: cloneDemoPublicPosts().find((post: any) => post.id === media.postId) ?? null,
            updatedAt: new Date().toISOString(),
          },
          'placeholder',
        );
      }

      throw error;
    }
  }
}

function normalizePublicPostPayload(body: Record<string, unknown>) {
  return {
    type: typeof body.type === 'string' ? body.type : 'PROJECT',
    title: typeof body.title === 'string' ? body.title : 'Untitled public post',
    description:
      typeof body.description === 'string' ? body.description : 'No description provided.',
    domain: typeof body.domain === 'string' ? body.domain : 'General',
    location: typeof body.location === 'string' ? body.location : 'Unspecified',
    status: typeof body.status === 'string' ? body.status : 'DRAFT',
    value: typeof body.value === 'string' ? body.value : 'To be confirmed',
    ownerName: typeof body.ownerName === 'string' ? body.ownerName : 'OpenStaff owner',
    ownerType: typeof body.ownerType === 'string' ? body.ownerType : 'Platform user',
    classificationJson:
      typeof body.classificationJson === 'object' && body.classificationJson !== null
        ? body.classificationJson
        : {},
    certifications:
      typeof body.certifications === 'string' ? body.certifications : 'None specified',
    visibility: typeof body.visibility === 'string' ? body.visibility : 'PUBLIC',
  };
}

function normalizeMediaPayload(postId: string, body: Record<string, unknown>) {
  return {
    postId,
    url: typeof body.url === 'string' ? body.url : '',
    type: typeof body.type === 'string' ? body.type : 'IMAGE',
    alt: typeof body.alt === 'string' ? body.alt : '',
    status: typeof body.status === 'string' ? body.status : 'PENDING',
  };
}
