import { CountriesService } from './countries.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createPrismaServiceMock,
  createTestingModule,
} from '../test/testing-module.factory';

describe('CountriesService', () => {
  let service: CountriesService;
  const prismaMock = createPrismaServiceMock();

  beforeEach(async () => {
    prismaMock.country.findMany.mockResolvedValue([]);
    prismaMock.country.upsert.mockResolvedValue({
      id: 'country-1',
      code: 'RO',
    });
    prismaMock.region.findFirst.mockResolvedValue(null);
    prismaMock.region.create.mockResolvedValue({
      id: 'region-1',
      name: 'Bucharest',
    });
    prismaMock.city.findFirst.mockResolvedValue(null);
    prismaMock.city.create.mockResolvedValue({
      id: 'city-1',
      name: 'Bucharest',
    });

    const module = await createTestingModule({
      providers: [CountriesService],
      extraProviders: [{ provide: PrismaService, useValue: prismaMock }],
    });

    service = module.get<CountriesService>(CountriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a structured response', async () => {
    await expect(service.findAll()).resolves.toMatchObject({ status: 'ok' });
  });
});
