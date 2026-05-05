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
      const skills = await this.prisma.escoSkill.findMany({
        orderBy: {
          title: 'asc',
        },
      });

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
