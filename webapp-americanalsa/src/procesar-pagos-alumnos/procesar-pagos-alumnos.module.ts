import { Module } from '@nestjs/common';
import { ProcesarPagosAlumnosService } from './application/procesar-pagos-alumnos.service.js';
import { ProcesarPagosAlumnosController } from './presentation/procesar-pagos-alumnos.controller.js'
import { CoreModule } from '../core/core.module.js';

//generar un módulo para un caso de uso, caso de uso o funcionalidad del sistema
//https://docs.nestjs.com/modules
//https://docs.nestjs.com/cli/overview#command-overview

@Module({
  imports: [CoreModule],
  providers: [ProcesarPagosAlumnosService],
  controllers: [ProcesarPagosAlumnosController]
})
export class ProcesarPagosAlumnosModule { }
