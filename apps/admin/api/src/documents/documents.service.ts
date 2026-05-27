import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Storage } from '@google-cloud/storage';
import { PrismaService } from '../prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

type UploadedDocumentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class DocumentsService {
  private readonly storageBucket = process.env.STORAGE_BUCKET ?? '';
  private readonly storage = this.storageBucket ? new Storage() : null;

  constructor(private readonly prisma: PrismaService) {}

  async upload(
    body: UploadDocumentDto,
    file: UploadedDocumentFile | undefined,
    actor: any,
  ) {
    const resolvedActor = await this.resolveActor(actor);

    if (!resolvedActor) {
      throw new ForbiddenException('Authenticated actor required');
    }

    this.validateFile(file);

    const documentType = body.documentType ?? body.type;
    if (!documentType) {
      throw new BadRequestException('documentType is required');
    }

    const extension = this.getExtension(file!.mimetype, file!.originalname);
    const fileName = `${randomUUID()}.${extension}`;
    const storageKey = `${resolvedActor.id}/${documentType}/${fileName}`;
    const fileUrl = this.storageBucket
      ? await this.uploadToCloudStorage(storageKey, file!)
      : await this.uploadToLocalStorage(storageKey, file!);

    const document = await this.prisma.document.create({
      data: {
        actorId: resolvedActor.id,
        type: documentType,
        fileUrl,
      },
    });

    return {
      id: document.id,
      actorId: document.actorId,
      verified: document.verified,
      fileUrl: document.fileUrl,
      type: document.type,
    };
  }

  async listByActor(actorId: string, currentActor: any) {
    if (!this.isAdmin(currentActor) && currentActor?.id !== actorId) {
      throw new ForbiddenException('You do not have access to these documents');
    }

    return this.prisma.document.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyDocument(documentId: string, currentActor: any) {
    if (
      !['ADMIN', 'SUPERADMIN', 'COMPLIANCE_OFFICER'].includes(
        currentActor?.role,
      )
    ) {
      throw new ForbiddenException('Compliance or admin role required');
    }

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });
  }

  private validateFile(file: UploadedDocumentFile | undefined) {
    if (!file) {
      throw new BadRequestException('A file upload is required');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only PDF, JPEG, and PNG uploads are allowed',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds the 10MB limit');
    }
  }

  private async uploadToCloudStorage(
    storageKey: string,
    file: UploadedDocumentFile,
  ) {
    if (!this.storage || !this.storageBucket) {
      throw new Error('Cloud Storage client is not initialized');
    }

    const bucket = this.storage.bucket(this.storageBucket);
    const gcsFile = bucket.file(`openstaff-documents/${storageKey}`);

    await gcsFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false,
    });

    const [signedUrl] = await gcsFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return signedUrl;
  }

  private async uploadToLocalStorage(
    storageKey: string,
    file: UploadedDocumentFile,
  ) {
    const uploadsRoot = join(process.cwd(), 'uploads', 'actors');
    const targetPath = join(uploadsRoot, storageKey);
    const targetDir = dirname(targetPath);

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetPath, file.buffer);

    const normalizedKey = storageKey.replace(/\\/g, '/');
    return `http://localhost:${process.env.PORT || 8080}/dev-files/${normalizedKey}`;
  }

  private getExtension(mimeType: string, originalName: string) {
    if (mimeType === 'application/pdf') {
      return 'pdf';
    }
    if (mimeType === 'image/jpeg') {
      return 'jpg';
    }
    if (mimeType === 'image/png') {
      return 'png';
    }

    const fallback = originalName.split('.').pop();
    return fallback || 'bin';
  }

  private isAdmin(actor: any) {
    return ['ADMIN', 'SUPERADMIN', 'COMPLIANCE_OFFICER'].includes(actor?.role);
  }

  private async resolveActor(actor: any) {
    if (!actor) {
      return null;
    }

    if (actor.id && actor.firebaseUid) {
      const record = await this.prisma.actor.findUnique({
        where: { firebaseUid: actor.firebaseUid },
      });

      if (record) {
        return record;
      }
    }

    if (actor.id) {
      return actor;
    }

    if (actor.firebaseUid) {
      return this.prisma.actor.findUnique({
        where: { firebaseUid: actor.firebaseUid },
      });
    }

    return null;
  }
}
