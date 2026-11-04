import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module.js';
import { InscribirAlumnoService } from './application/inscribir-alumno.service.js';
import { InscribirAlumnoController } from './presentation/inscribir-alumno.controller.js';

@Module({
	imports: [CoreModule],
	providers: [InscribirAlumnoService],
	controllers: [InscribirAlumnoController],
})
export class InscribirAlumnoModule { }