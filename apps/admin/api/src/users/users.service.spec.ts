import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createPrismaServiceMock,
  createTestingModule,
} from '../test/testing-module.factory';

describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = createPrismaServiceMock();

  beforeEach(async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    const module = await createTestingModule({
      providers: [UsersService],
      extraProviders: [{ provide: PrismaService, useValue: prismaMock }],
    });

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a list of admin users', async () => {
    await expect(service.findAll()).resolves.toEqual([]);
  });
});
