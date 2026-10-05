import { Test, TestingModule } from '@nestjs/testing';
import { ProcesarPagosAlumnosController } from './procesar-pagos-alumnos.controller';

describe('ProcesarPagosAlumnosController', () => {
  let controller: ProcesarPagosAlumnosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcesarPagosAlumnosController],
    }).compile();

    controller = module.get<ProcesarPagosAlumnosController>(ProcesarPagosAlumnosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
