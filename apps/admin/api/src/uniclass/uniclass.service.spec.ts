import { UniclassService } from './uniclass.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createPrismaServiceMock,
  createTestingModule,
} from '../test/testing-module.factory';

describe('UniclassService', () => {
  let service: UniclassService;
  const prismaMock = createPrismaServiceMock();

  beforeEach(async () => {
    prismaMock.uniclass.findMany.mockResolvedValue([]);

    const module = await createTestingModule({
      providers: [UniclassService],
      extraProviders: [{ provide: PrismaService, useValue: prismaMock }],
    });

    service = module.get<UniclassService>(UniclassService);
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
