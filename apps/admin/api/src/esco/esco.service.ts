import { Injectable } from '@nestjs/common';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  isPrismaConnectionOrSchemaError,
  logEndpointError,
} from '../common/api-response';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscoService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      let skills = await this.prisma.escoSkill.findMany({
        orderBy: {
          title: 'asc',
        },
      });

      if (skills.length === 0) {
        const taxonomyEntries = await this.prisma.taxonomy.findMany({
          where: {
            type: 'ESCO',
          },
          orderBy: {
            label: 'asc',
          },
          take: 200,
        });

        for (const entry of taxonomyEntries) {
          await this.prisma.escoSkill.upsert({
            where: { code: entry.code },
            update: {
              title: entry.label,
              description: entry.labelEn ?? null,
            },
            create: {
              code: entry.code,
              title: entry.label,
              description: entry.labelEn ?? null,
            },
          });
        }

        skills = await this.prisma.escoSkill.findMany({
          orderBy: {
            title: 'asc',
          },
        });
      }

      return buildSuccessResponse(Array.isArray(skills) ? skills : []);
    } catch (error) {
      logEndpointError('EscoService.findAll', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildSuccessResponse([], 'placeholder');
      }

      return buildInternalErrorResponse(error);
    }
  }

  async create(data: { code: string; title: string; description?: string }) {
    try {
      return await this.prisma.escoSkill.create({
        data,
      });
    } catch (error) {
      logEndpointError('EscoService.create', error);
      return buildInternalErrorResponse(error);
    }
  }
}
