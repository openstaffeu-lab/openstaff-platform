import { BadRequestException, Injectable } from '@nestjs/common';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  isPrismaConnectionOrSchemaError,
  logEndpointError,
} from '../common/api-response';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      const countries = await this.prisma.country.findMany({
        include: {
          regions: {
            include: {
              cities: {
                orderBy: {
                  name: 'asc',
                },
              },
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return buildSuccessResponse(Array.isArray(countries) ? countries : []);
    } catch (error) {
      logEndpointError('CountriesService.findAll', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildSuccessResponse([], 'placeholder');
      }

      return buildInternalErrorResponse(error);
    }
  }

  async create(data: {
    name?: string;
    code?: string;
    currency?: string;
    vatRate?: number;
  }) {
    const name = data.name?.trim();
    const code = data.code?.trim().toUpperCase();
    const currency = data.currency?.trim().toUpperCase();
    const vatRate = Number(data.vatRate);

    if (!name || !code || !currency || Number.isNaN(vatRate)) {
      throw new BadRequestException(
        'Country name, code, currency, and vatRate are required.',
      );
    }

    try {
      const country = await this.prisma.country.create({
        data: {
          name,
          code,
          currency,
          vatRate,
        },
      });

      return buildSuccessResponse(country);
    } catch (error) {
      logEndpointError('CountriesService.create', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildSuccessResponse(
          {
            id: `placeholder-country-${code.toLowerCase()}`,
            name,
            code,
            currency,
            vatRate,
            regions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          'placeholder',
        );
      }

      return buildInternalErrorResponse(error);
    }
  }
}
