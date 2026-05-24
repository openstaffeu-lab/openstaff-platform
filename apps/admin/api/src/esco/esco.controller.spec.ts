import { EscoController } from './esco.controller';
import { EscoService } from './esco.service';
import { createTestingModule } from '../test/testing-module.factory';

describe('EscoController', () => {
  let controller: EscoController;
  const escoServiceMock = {
    findAll: jest.fn().mockResolvedValue({ status: 'ok', data: [] }),
    create: jest.fn().mockResolvedValue({ id: 'esco-1', code: '7411.1' }),
  };

  beforeEach(async () => {
    const module = await createTestingModule({
      controllers: [EscoController],
      extraProviders: [{ provide: EscoService, useValue: escoServiceMock }],
    });

    controller = module.get<EscoController>(EscoController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the service response', async () => {
    await expect(controller.findAll()).resolves.toEqual({
      status: 'ok',
      data: [],
    });
    expect(escoServiceMock.findAll).toHaveBeenCalledTimes(1);
  });
});
