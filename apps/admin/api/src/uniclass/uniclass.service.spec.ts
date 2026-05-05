import { Test, TestingModule } from '@nestjs/testing';
import { UniclassService } from './uniclass.service';

describe('UniclassService', () => {
  let service: UniclassService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UniclassService],
    }).compile();

    service = module.get<UniclassService>(UniclassService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
