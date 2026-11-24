import { Module } from '@nestjs/common';
import { GestionarAsistenciasService } from './application/gestionar-asistencias.service.js';
import { AsistenciaRepository } from './persistence/asistencia.repository.js';
import { GestionarAsistenciasController } from './presentation/gestionar-asistencias.controller.js';

@Module({
	providers: [GestionarAsistenciasService, AsistenciaRepository],
	controllers: [GestionarAsistenciasController],
})
export class GestionarAsistenciasModule { }
