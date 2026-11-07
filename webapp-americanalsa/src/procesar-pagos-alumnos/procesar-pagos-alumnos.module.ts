import { Module } from '@nestjs/common';
import { CuotasService } from './application/cuotas.service.js';
import { CuotasController } from './presentation/cuotas.controller.js';
import { CoreModule } from '../core/core.module.js';

@Module({
  imports: [CoreModule],
  providers: [CuotasService],
  controllers: [CuotasController],
})
export class ProcesarPagosAlumnosModule { }
