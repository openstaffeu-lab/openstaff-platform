import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { createTestingModule } from '../test/testing-module.factory';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    findAll: jest.fn().mockResolvedValue([]),
    updateApproval: jest.fn(),
    updateAccountStatus: jest.fn(),
    updateProfileModeration: jest.fn(),
  };

  beforeEach(async () => {
    const module = await createTestingModule({
      controllers: [UsersController],
      extraProviders: [{ provide: UsersService, useValue: usersServiceMock }],
    });

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list users via the service', async () => {
    await expect(controller.findAll()).resolves.toEqual([]);
    expect(usersServiceMock.findAll).toHaveBeenCalledTimes(1);
  });
});
