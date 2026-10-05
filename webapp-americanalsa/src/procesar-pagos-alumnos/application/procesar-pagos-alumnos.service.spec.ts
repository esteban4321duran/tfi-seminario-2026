import { Test, TestingModule } from '@nestjs/testing';
import { ProcesarPagosAlumnosService } from './procesar-pagos-alumnos.service.js';

describe('ProcesarPagosAlumnosService', () => {
  let service: ProcesarPagosAlumnosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcesarPagosAlumnosService],
    }).compile();

    service = module.get<ProcesarPagosAlumnosService>(ProcesarPagosAlumnosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
