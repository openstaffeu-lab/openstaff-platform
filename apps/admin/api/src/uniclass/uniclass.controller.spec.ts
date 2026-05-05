import { Test, TestingModule } from '@nestjs/testing';
import { UniclassController } from './uniclass.controller';

describe('UniclassController', () => {
  let controller: UniclassController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UniclassController],
    }).compile();

    controller = module.get<UniclassController>(UniclassController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
