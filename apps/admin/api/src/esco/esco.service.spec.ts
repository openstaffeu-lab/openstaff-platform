import { Test, TestingModule } from '@nestjs/testing';
import { EscoService } from './esco.service';

describe('EscoService', () => {
  let service: EscoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EscoService],
    }).compile();

    service = module.get<EscoService>(EscoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
