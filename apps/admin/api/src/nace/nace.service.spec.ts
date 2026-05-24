import { NaceService } from './nace.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createPrismaServiceMock,
  createTestingModule,
} from '../test/testing-module.factory';

describe('NaceService', () => {
  let service: NaceService;
  const prismaMock = createPrismaServiceMock();

  beforeEach(async () => {
    prismaMock.nace.findMany.mockResolvedValue([]);

    const module = await createTestingModule({
      providers: [NaceService],
      extraProviders: [{ provide: PrismaService, useValue: prismaMock }],
    });

    service = module.get<NaceService>(NaceService);
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
