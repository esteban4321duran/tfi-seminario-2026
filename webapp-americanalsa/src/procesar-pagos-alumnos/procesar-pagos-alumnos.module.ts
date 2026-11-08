import { Module } from '@nestjs/common';
import { CuotasService } from './application/cuotas.service.js';
import { CuotasController } from './presentation/cuotas.controller.js';
import { CoreModule } from '../core/core.module.js';
import { CuotaRepository } from './persistence/cuota.repository.js';

@Module({
  imports: [CoreModule],
  providers: [CuotasService, CuotaRepository],
  controllers: [CuotasController],
})
export class ProcesarPagosAlumnosModule { }
