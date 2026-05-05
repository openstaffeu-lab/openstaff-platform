import { Injectable } from '@nestjs/common';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  isPrismaConnectionOrSchemaError,
  logEndpointError,
} from '../common/api-response';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UniclassService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      const items = await this.prisma.uniclass.findMany({
        orderBy: {
          title: 'asc',
        },
      });

      return buildSuccessResponse(Array.isArray(items) ? items : []);
    } catch (error) {
      logEndpointError('UniclassService.findAll', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildSuccessResponse([], 'placeholder');
      }

      return buildInternalErrorResponse(error);
    }
  }

  async create(data: { code: string; title: string; description?: string }) {
    try {
      return await this.prisma.uniclass.create({
        data,
      });
    } catch (error) {
      logEndpointError('UniclassService.create', error);
      return buildInternalErrorResponse(error);
    }
  }
}
