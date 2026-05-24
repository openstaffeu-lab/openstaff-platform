import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createTestingModule } from './test/testing-module.factory';

describe('AppController', () => {
  let appController: AppController;
  const appServiceMock = {
    getRoot: jest.fn().mockReturnValue({
      status: 'ok',
      service: 'openstaff-api',
      endpoints: ['/health', '/status'],
    }),
    getHealth: jest.fn().mockReturnValue({
      status: 'ok',
      service: 'openstaff-api',
    }),
    getStatus: jest.fn().mockResolvedValue({
      status: 'ok',
      api: 'healthy',
    }),
  };

  beforeEach(async () => {
    const app = await createTestingModule({
      controllers: [AppController],
      extraProviders: [{ provide: AppService, useValue: appServiceMock }],
    });

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return API root metadata', () => {
      expect(appController.getHello()).toEqual({
        status: 'ok',
        service: 'openstaff-api',
        endpoints: ['/health', '/status'],
      });
      expect(appServiceMock.getRoot).toHaveBeenCalledTimes(1);
    });

    it('should proxy health and status methods', async () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'openstaff-api',
      });
      await expect(appController.getStatus()).resolves.toEqual({
        status: 'ok',
        api: 'healthy',
      });
    });
  });
});
