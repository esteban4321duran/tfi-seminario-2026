import { Test, TestingModule } from '@nestjs/testing';
import { FormatoFechaService } from './formato-fecha-service.js';

describe('FormatoFechaService', () => {
  let provider: FormatoFechaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormatoFechaService],
    }).compile();

    provider = module.get<FormatoFechaService>(FormatoFechaService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
