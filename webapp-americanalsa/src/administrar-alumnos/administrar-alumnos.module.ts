import { Module } from '@nestjs/common';
import { AdministrarAlumnosService } from './application/administrar-alumnos.service.js';
import { AlumnoRepository } from './persistence/alumno.repository.js';
import { AdministrarAlumnosController } from './presentation/administrar-alumnos.controller.js';

@Module({
	providers: [AdministrarAlumnosService, AlumnoRepository],
	controllers: [AdministrarAlumnosController],
})
export class AdministrarAlumnosModule { }
