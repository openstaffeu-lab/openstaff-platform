import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildSuccessResponse,
  isPrismaConnectionOrSchemaError,
  logEndpointError,
} from '../common/api-response';
import { cloneDemoExternalLinks } from '../common/public-interaction-demo';

@Injectable()
export class ExternalLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async listForAdmin() {
    try {
      const items = await this.prisma.externalLinkSubmission.findMany({
        include: {
          sourcePost: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return buildSuccessResponse(items);
    } catch (error) {
      logEndpointError('ExternalLinksService.listForAdmin', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        const demo = cloneDemoExternalLinks().map((item: any) => ({
          ...item,
          sourcePost: {
            id: item.sourcePostId,
            title:
              item.sourcePostId === 'post-project-data-center-cabling'
                ? 'Data center cabling package'
                : 'Data center cabling team',
          },
        }));

        return buildSuccessResponse(demo, 'placeholder');
      }

      throw error;
    }
  }

  async updateStatus(id: string, securityStatus: string) {
    try {
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
    } catch (error) {
      logEndpointError('ExternalLinksService.updateStatus', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        const existing = cloneDemoExternalLinks().find((item: any) => item.id === id);

        if (!existing) {
          throw new NotFoundException('External link submission not found');
        }

        return buildSuccessResponse(
          {
            ...existing,
            securityStatus,
            updatedAt: new Date().toISOString(),
          },
          'placeholder',
        );
      }

      throw error;
    }
  }
}
