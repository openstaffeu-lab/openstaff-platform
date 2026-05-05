import { Test, TestingModule } from '@nestjs/testing';
import { NaceService } from './nace.service';

describe('NaceService', () => {
  let service: NaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NaceService],
    }).compile();

    service = module.get<NaceService>(NaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
