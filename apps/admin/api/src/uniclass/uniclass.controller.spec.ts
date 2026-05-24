import { UniclassController } from './uniclass.controller';
import { UniclassService } from './uniclass.service';
import { createTestingModule } from '../test/testing-module.factory';

describe('UniclassController', () => {
  let controller: UniclassController;
  const uniclassServiceMock = {
    findAll: jest.fn().mockResolvedValue({ status: 'ok', data: [] }),
    create: jest
      .fn()
      .mockResolvedValue({ id: 'uniclass-1', code: 'Ss_25_30_95' }),
  };

  beforeEach(async () => {
    const module = await createTestingModule({
      controllers: [UniclassController],
      extraProviders: [
        { provide: UniclassService, useValue: uniclassServiceMock },
      ],
    });

    controller = module.get<UniclassController>(UniclassController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate reads to the service', async () => {
    await expect(controller.findAll()).resolves.toEqual({
      status: 'ok',
      data: [],
    });
  });
});
