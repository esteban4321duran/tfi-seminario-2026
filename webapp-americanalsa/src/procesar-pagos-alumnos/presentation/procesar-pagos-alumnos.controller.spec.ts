import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { ProcesarPagosAlumnosController } from './procesar-pagos-alumnos.controller.js';
import { ProcesarPagosAlumnosService } from '../application/procesar-pagos-alumnos.service.js';

describe('ProcesarPagosAlumnosController', () => {
  let controller: ProcesarPagosAlumnosController;

  beforeEach(async () => {
    const mockService = {
      getInformeDeudaAlumno: vi.fn(),
      getInformeDeudaTodos: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcesarPagosAlumnosController],
      providers: [{ provide: ProcesarPagosAlumnosService, useValue: mockService }],
    }).compile();

    controller = module.get<ProcesarPagosAlumnosController>(ProcesarPagosAlumnosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
