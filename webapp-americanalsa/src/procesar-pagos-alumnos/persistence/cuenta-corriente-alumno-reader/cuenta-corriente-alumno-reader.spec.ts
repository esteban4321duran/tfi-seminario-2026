import { Test, TestingModule } from '@nestjs/testing';
import { CuentaCorrienteAlumnoReader } from './cuenta-corriente-alumno-reader.js';

describe('CuentaCorrienteAlumnoReader', () => {
  let provider: CuentaCorrienteAlumnoReader;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CuentaCorrienteAlumnoReader],
    }).compile();

    provider = module.get<CuentaCorrienteAlumnoReader>(CuentaCorrienteAlumnoReader);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
