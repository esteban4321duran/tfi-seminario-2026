import { Test, TestingModule } from '@nestjs/testing';
import { FormatoMonedaService } from './formato-moneda-service.js';

describe('FormatoMonedaService', () => {
  let provider: FormatoMonedaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormatoMonedaService],
    }).compile();

    provider = module.get<FormatoMonedaService>(FormatoMonedaService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
