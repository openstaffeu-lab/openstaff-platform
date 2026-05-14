import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildSuccessResponse } from '../common/api-response';

@Injectable()
export class ExternalLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async listForAdmin() {
    const items = await this.prisma.externalLinkSubmission.findMany({
      include: {
        sourcePost: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return buildSuccessResponse(items);
  }

  async updateStatus(id: string, securityStatus: string) {
    const item = await this.prisma.externalLinkSubmission.update({
      where: { id },
      data: {
        securityStatus: securityStatus as any,
      },
      include: {
        sourcePost: true,
      },
    });

    return buildSuccessResponse(item);
  }
}
