import { EscoService } from './esco.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createPrismaServiceMock,
  createTestingModule,
} from '../test/testing-module.factory';

describe('EscoService', () => {
  let service: EscoService;
  const prismaMock = createPrismaServiceMock();

  beforeEach(async () => {
    prismaMock.escoSkill.findMany.mockResolvedValue([]);
    prismaMock.taxonomy.findMany.mockResolvedValue([]);

    const module = await createTestingModule({
      providers: [EscoService],
      extraProviders: [{ provide: PrismaService, useValue: prismaMock }],
    });

    service = module.get<EscoService>(EscoService);
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
