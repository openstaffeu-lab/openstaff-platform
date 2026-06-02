import { BadRequestException, Injectable } from '@nestjs/common';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  isPrismaConnectionOrSchemaError,
  logEndpointError,
} from '../common/api-response';
import { PrismaService } from '../prisma/prisma.service';

const BASELINE_COUNTRY_SEED = [
  {
    code: 'RO',
    name: 'Romania',
    currency: 'RON',
    vatRate: 19,
    regions: [
      {
        name: 'Bucuresti-Ilfov',
        cities: ['Bucharest'],
      },
      {
        name: 'Cluj',
        cities: ['Cluj-Napoca'],
      },
    ],
  },
  {
    code: 'IE',
    name: 'Ireland',
    currency: 'EUR',
    vatRate: 23,
    regions: [{ name: 'Leinster', cities: ['Dublin'] }],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    vatRate: 20,
    regions: [
      { name: 'England', cities: ['London', 'Manchester'] },
      { name: 'Scotland', cities: ['Edinburgh'] },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    vatRate: 19,
    regions: [
      { name: 'Berlin', cities: ['Berlin'] },
      { name: 'Hesse', cities: ['Frankfurt am Main'] },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    vatRate: 20,
    regions: [{ name: 'Ile-de-France', cities: ['Paris'] }],
  },
  {
    code: 'IT',
    name: 'Italy',
    currency: 'EUR',
    vatRate: 22,
    regions: [
      { name: 'Lazio', cities: ['Rome'] },
      { name: 'Lombardy', cities: ['Milan'] },
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    currency: 'EUR',
    vatRate: 21,
    regions: [
      { name: 'Community of Madrid', cities: ['Madrid'] },
      { name: 'Catalonia', cities: ['Barcelona'] },
    ],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    currency: 'EUR',
    vatRate: 21,
    regions: [{ name: 'North Holland', cities: ['Amsterdam'] }],
  },
  {
    code: 'BE',
    name: 'Belgium',
    currency: 'EUR',
    vatRate: 21,
    regions: [{ name: 'Brussels-Capital', cities: ['Brussels'] }],
  },
  {
    code: 'DK',
    name: 'Denmark',
    currency: 'DKK',
    vatRate: 25,
    regions: [{ name: 'Capital Region', cities: ['Copenhagen'] }],
  },
  {
    code: 'SE',
    name: 'Sweden',
    currency: 'SEK',
    vatRate: 25,
    regions: [{ name: 'Stockholm County', cities: ['Stockholm'] }],
  },
  {
    code: 'NO',
    name: 'Norway',
    currency: 'NOK',
    vatRate: 25,
    regions: [{ name: 'Oslo', cities: ['Oslo'] }],
  },
  {
    code: 'FI',
    name: 'Finland',
    currency: 'EUR',
    vatRate: 24,
    regions: [{ name: 'Uusimaa', cities: ['Helsinki'] }],
  },
  {
    code: 'GR',
    name: 'Greece',
    currency: 'EUR',
    vatRate: 24,
    regions: [{ name: 'Attica', cities: ['Athens'] }],
  },
];

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      await this.ensureBaselineCountries();
      const countries = await this.loadCountries();

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

  private async loadCountries() {
    return this.prisma.country.findMany({
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
  }

  private async ensureBaselineCountries() {
    for (const countrySeed of BASELINE_COUNTRY_SEED) {
      const country = await this.prisma.country.upsert({
        where: { code: countrySeed.code },
        update: {
          name: countrySeed.name,
          currency: countrySeed.currency,
          vatRate: countrySeed.vatRate,
        },
        create: {
          code: countrySeed.code,
          name: countrySeed.name,
          currency: countrySeed.currency,
          vatRate: countrySeed.vatRate,
        },
      });

      for (const regionSeed of countrySeed.regions) {
        let region = await this.prisma.region.findFirst({
          where: {
            countryId: country.id,
            name: regionSeed.name,
          },
        });

        if (!region) {
          region = await this.prisma.region.create({
            data: {
              countryId: country.id,
              name: regionSeed.name,
            },
          });
        }

        for (const cityName of regionSeed.cities) {
          const existingCity = await this.prisma.city.findFirst({
            where: {
              regionId: region.id,
              name: cityName,
            },
          });

          if (!existingCity) {
            await this.prisma.city.create({
              data: {
                regionId: region.id,
                name: cityName,
              },
            });
          }
        }
      }
    }
  }
}
