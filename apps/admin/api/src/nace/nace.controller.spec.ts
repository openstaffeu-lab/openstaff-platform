import { NaceController } from './nace.controller';
import { NaceService } from './nace.service';
import { createTestingModule } from '../test/testing-module.factory';

describe('NaceController', () => {
  let controller: NaceController;
  const naceServiceMock = {
    findAll: jest.fn().mockResolvedValue({ status: 'ok', data: [] }),
    create: jest.fn().mockResolvedValue({ id: 'nace-1', code: '41.20' }),
  };

  beforeEach(async () => {
    const module = await createTestingModule({
      controllers: [NaceController],
      extraProviders: [{ provide: NaceService, useValue: naceServiceMock }],
    });

    controller = module.get<NaceController>(NaceController);
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
