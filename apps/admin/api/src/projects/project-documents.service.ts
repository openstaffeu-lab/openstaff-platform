import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectDocumentType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDocumentDto } from './dto/create-project-document.dto';
import { UploadProjectDocumentDto } from './dto/upload-project-document.dto';
import { ProjectAccessPolicy } from './project-access.policy';
import { ProjectResponseMapper } from './project-response.mapper';

const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require('pdf-parse');

export type UploadedProjectFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type AuthenticatedUser = {
  sub: string;
  role: string;
};

const extractionStatuses = {
  NOT_REQUESTED: 'NOT_REQUESTED',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  UNSUPPORTED: 'UNSUPPORTED',
  FAILED: 'FAILED',
} as const;

@Injectable()
export class ProjectDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: ProjectAccessPolicy,
    private readonly projectResponseMapper: ProjectResponseMapper,
  ) {}

  async findAll(projectId: string, user: AuthenticatedUser) {
    const project = await this.getProjectForRead(projectId, user);

    const documents = await this.prisma.projectDocument.findMany({
      where: { projectId: project.id },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents.map((document) =>
      this.projectResponseMapper.toDocumentResponse(document),
    );
  }

  async getExtractedText(
    projectId: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    const document = await this.getDocumentForRead(projectId, documentId, user);

    return {
      documentId: document.id,
      extractionStatus: document.extractionStatus,
      extractionError: document.extractionError,
      extractedAt: document.extractedAt,
      extractedText: document.extractedText,
    };
  }

  async findOne(projectId: string, documentId: string, user: AuthenticatedUser) {
    const document = await this.getDocumentForRead(projectId, documentId, user);

    if (document.storageProvider !== 'local') {
      throw new BadRequestException(
        'Only locally stored documents can be downloaded from this endpoint',
      );
    }

    const absolutePath = this.resolveStoragePath(document.storageKey);

    return {
      fileName: document.fileName,
      mimeType: document.mimeType,
      canPreview: this.canPreview(document.mimeType),
      stream: createReadStream(absolutePath),
    };
  }

  async create(
    projectId: string,
    body: CreateProjectDocumentDto,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForWrite(projectId, user);

    if (!body.title?.trim() || !body.fileName?.trim()) {
      throw new BadRequestException('Document title and fileName are required');
    }

    if (body.jobRequestId) {
      await this.ensureJobRequestBelongsToProject(project.id, body.jobRequestId);
    }

    const document = await this.prisma.projectDocument.create({
      data: {
        project: {
          connect: {
            id: project.id,
          },
        },
        ...(body.jobRequestId
          ? {
              jobRequest: {
                connect: {
                  id: body.jobRequestId,
                },
              },
            }
          : {}),
        uploadedBy: {
          connect: {
            id: user.sub,
          },
        },
        type: body.type ?? ProjectDocumentType.OTHER,
        title: body.title.trim(),
        description: body.description?.trim(),
        fileName: body.fileName.trim(),
        mimeType: body.mimeType?.trim() ?? 'application/octet-stream',
        sizeBytes: body.sizeBytes ?? 0,
        storageProvider: body.storageProvider?.trim() ?? 'manual',
        storageBucket: body.storageBucket?.trim(),
        storageKey:
          body.storageKey?.trim() ??
          `projects/${project.id}/${Date.now()}-${body.fileName.trim()}`,
        checksumSha256: body.checksumSha256?.trim(),
        isPublic: body.isPublic ?? false,
      },
    });

    return this.projectResponseMapper.toDocumentResponse(document);
  }

  async upload(
    projectId: string,
    body: UploadProjectDocumentDto,
    file: UploadedProjectFile | undefined,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForWrite(projectId, user);

    if (!file) {
      throw new BadRequestException('A file upload is required');
    }

    if (!body.title?.trim()) {
      throw new BadRequestException('Document title is required');
    }

    if (body.jobRequestId) {
      await this.ensureJobRequestBelongsToProject(project.id, body.jobRequestId);
    }

    const relativeStorageKey = await this.persistUploadedFile(project.id, file);

    const document = await this.prisma.projectDocument.create({
      data: {
        project: {
          connect: {
            id: project.id,
          },
        },
        ...(body.jobRequestId
          ? {
              jobRequest: {
                connect: {
                  id: body.jobRequestId,
                },
              },
            }
          : {}),
        uploadedBy: {
          connect: {
            id: user.sub,
          },
        },
        type: body.type ?? this.inferDocumentType(file),
        title: body.title.trim(),
        description: body.description?.trim(),
        fileName: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        storageProvider: 'local',
        storageKey: relativeStorageKey,
        extractionStatus: extractionStatuses.NOT_REQUESTED,
        isPublic: body.isPublic ?? false,
      },
    });

    return this.projectResponseMapper.toDocumentResponse(document);
  }

  async extract(
    projectId: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    const document = await this.getDocumentForWrite(projectId, documentId, user);

    if (document.storageProvider !== 'local') {
      throw new BadRequestException(
        'Only locally stored documents can be extracted in this phase',
      );
    }

    await this.prisma.projectDocument.update({
      where: {
        id: document.id,
      },
      data: {
        extractionStatus: extractionStatuses.PENDING,
        extractionError: null,
      },
    });

    try {
      const absolutePath = this.resolveStoragePath(document.storageKey);
      const buffer = await readFile(absolutePath);
      const extracted = await this.extractTextFromBuffer(
        document.mimeType,
        document.fileName,
        buffer,
      );

      const updatedDocument = await this.prisma.projectDocument.update({
        where: {
          id: document.id,
        },
        data: {
          extractedText: extracted.text,
          extractionStatus: extracted.status,
          extractionError: extracted.error ?? null,
          extractedAt: new Date(),
        },
      });

      return this.projectResponseMapper.toDocumentResponse(updatedDocument);
    } catch (error) {
      const updatedDocument = await this.prisma.projectDocument.update({
        where: {
          id: document.id,
        },
        data: {
          extractionStatus: extractionStatuses.FAILED,
          extractionError:
            error instanceof Error ? error.message : 'Text extraction failed',
          extractedAt: new Date(),
        },
      });

      return this.projectResponseMapper.toDocumentResponse(updatedDocument);
    }
  }

  async remove(
    projectId: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    const project = await this.getProjectForWrite(projectId, user);
    const existing = await this.prisma.projectDocument.findFirst({
      where: {
        id: documentId,
        projectId: project.id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Project document not found');
    }

    await this.prisma.projectDocument.delete({
      where: {
        id: documentId,
      },
    });

    if (existing.storageProvider === 'local') {
      const absolutePath = this.resolveStoragePath(existing.storageKey);
      await rm(absolutePath, { force: true });
    }

    return { success: true };
  }

  private async getProjectForRead(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.accessPolicy.assertCanReadProject(user, project.createdById);
    return project;
  }

  private async getProjectForWrite(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.accessPolicy.assertCanWriteProject(user, project.createdById);
    return project;
  }

  private async getDocumentForRead(
    projectId: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    await this.getProjectForRead(projectId, user);

    const document = await this.prisma.projectDocument.findFirst({
      where: {
        id: documentId,
        projectId,
      },
    });

    if (!document) {
      throw new NotFoundException('Project document not found');
    }

    return document;
  }

  private async getDocumentForWrite(
    projectId: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    await this.getProjectForWrite(projectId, user);

    const document = await this.prisma.projectDocument.findFirst({
      where: {
        id: documentId,
        projectId,
      },
    });

    if (!document) {
      throw new NotFoundException('Project document not found');
    }

    return document;
  }

  private async ensureJobRequestBelongsToProject(projectId: string, jobRequestId: string) {
    const jobRequest = await this.prisma.projectJobRequest.findFirst({
      where: {
        id: jobRequestId,
        projectId,
      },
    });

    if (!jobRequest) {
      throw new NotFoundException('Project job request not found');
    }
  }

  private async persistUploadedFile(projectId: string, file: UploadedProjectFile) {
    const uploadsRoot = this.getUploadsRoot();
    const projectFolder = join(uploadsRoot, 'projects', projectId);
    const extension = extname(file.originalname) || this.extensionFromMime(file.mimetype);
    const uniqueFileName = `${randomUUID()}${extension}`;
    const relativeStorageKey = `projects/${projectId}/${uniqueFileName}`;

    await mkdir(projectFolder, { recursive: true });
    await writeFile(join(uploadsRoot, relativeStorageKey), file.buffer);

    return relativeStorageKey;
  }

  private getUploadsRoot() {
    return join(process.cwd(), 'uploads');
  }

  private resolveStoragePath(storageKey: string) {
    return join(this.getUploadsRoot(), storageKey);
  }

  private inferDocumentType(file: UploadedProjectFile) {
    const fileName = file.originalname.toLowerCase();

    if (file.mimetype.startsWith('image/')) {
      return ProjectDocumentType.IMAGE;
    }

    if (file.mimetype === 'application/pdf' || fileName.endsWith('.pdf')) {
      return ProjectDocumentType.SPECIFICATION;
    }

    if (fileName.endsWith('.dwg') || fileName.endsWith('.dxf')) {
      return ProjectDocumentType.DRAWING;
    }

    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return ProjectDocumentType.CONTRACT;
    }

    return ProjectDocumentType.OTHER;
  }

  private extensionFromMime(mimeType: string) {
    const mimeMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '.docx',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'text/plain': '.txt',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
    };

    return mimeMap[mimeType] ?? '';
  }

  private canPreview(mimeType: string) {
    return mimeType === 'application/pdf' || mimeType.startsWith('image/');
  }

  private async extractTextFromBuffer(
    mimeType: string,
    fileName: string,
    buffer: Buffer,
  ) {
    const lowerFileName = fileName.toLowerCase();

    if (mimeType === 'text/plain' || lowerFileName.endsWith('.txt')) {
      return {
        text: buffer.toString('utf8'),
        status: extractionStatuses.COMPLETED,
      };
    }

    if (mimeType === 'application/pdf' || lowerFileName.endsWith('.pdf')) {
      const parsed = await pdfParse(buffer);
      return {
        text: parsed.text,
        status: extractionStatuses.COMPLETED,
      };
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      lowerFileName.endsWith('.docx')
    ) {
      const parsed = await mammoth.extractRawText({ buffer });
      return {
        text: parsed.value,
        status: extractionStatuses.COMPLETED,
      };
    }

    if (mimeType.startsWith('image/')) {
      return {
        text: null,
        status: extractionStatuses.UNSUPPORTED,
        error: 'OCR is not implemented yet for image documents',
      };
    }

    if (mimeType.startsWith('video/')) {
      return {
        text: null,
        status: extractionStatuses.UNSUPPORTED,
        error: 'Video parsing is not implemented yet',
      };
    }

    return {
      text: null,
      status: extractionStatuses.UNSUPPORTED,
      error: `Text extraction is not supported yet for ${mimeType || 'this file type'}`,
    };
  }
}
