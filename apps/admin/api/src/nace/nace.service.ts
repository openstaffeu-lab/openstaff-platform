import { Injectable } from '@nestjs/common';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  isPrismaConnectionOrSchemaError,
  logEndpointError,
} from '../common/api-response';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NaceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      const naceCodes = await this.prisma.nace.findMany({
        orderBy: {
          title: 'asc',
        },
      });

      return buildSuccessResponse(Array.isArray(naceCodes) ? naceCodes : []);
    } catch (error) {
      logEndpointError('NaceService.findAll', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildSuccessResponse([], 'placeholder');
      }

      return buildInternalErrorResponse(error);
    }
  }

  async create(data: { code: string; title: string; description?: string }) {
    try {
      return await this.prisma.nace.create({
        data,
      });
    } catch (error) {
      logEndpointError('NaceService.create', error);
      return buildInternalErrorResponse(error);
    }
  }
}
