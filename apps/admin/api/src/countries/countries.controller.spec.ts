import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';
import { createTestingModule } from '../test/testing-module.factory';

describe('CountriesController', () => {
  let controller: CountriesController;
  const countriesServiceMock = {
    findAll: jest.fn().mockResolvedValue({ status: 'ok', data: [] }),
    create: jest.fn().mockResolvedValue({ status: 'ok', data: { code: 'RO' } }),
  };

  beforeEach(async () => {
    const module = await createTestingModule({
      controllers: [CountriesController],
      extraProviders: [
        { provide: CountriesService, useValue: countriesServiceMock },
      ],
    });

    controller = module.get<CountriesController>(CountriesController);
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
    expect(countriesServiceMock.findAll).toHaveBeenCalledTimes(1);
  });
});
