import { Test, TestingModule } from '@nestjs/testing';
import { NaceController } from './nace.controller';

describe('NaceController', () => {
  let controller: NaceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NaceController],
    }).compile();

    controller = module.get<NaceController>(NaceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
