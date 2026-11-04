import { Test, TestingModule } from '@nestjs/testing';
import { ProcesarPagosAlumnosService } from './procesar-pagos-alumnos.service.js';
import { FormatoMonedaService } from '../../core/application/formato-moneda-service/formato-moneda-service.js';
import { FormatoFechaService } from '../../core/application/formato-fecha-service/formato-fecha-service.js';
import { CuentaCorrienteAlumnoReader } from '../persistence/cuenta-corriente-alumno-reader/cuenta-corriente-alumno-reader.js';

describe('ProcesarPagosAlumnosService', () => {
  let service: ProcesarPagosAlumnosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcesarPagosAlumnosService,
        { provide: 'DrizzleDatabase', useValue: {} },
        { provide: CuentaCorrienteAlumnoReader, useValue: {} },
        {
          provide: FormatoMonedaService,
          useValue: {
            getFormateador: () => ({
              format: (value: number) => `$${value.toFixed(2)}`,
            }),
          },
        },
        {
          provide: FormatoFechaService,
          useValue: {
            mesEnLetras: () => 'Mes',
          },
        },
      ],
    }).compile();

    service = module.get<ProcesarPagosAlumnosService>(ProcesarPagosAlumnosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
