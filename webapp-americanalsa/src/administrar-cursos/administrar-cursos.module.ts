import { Module } from '@nestjs/common';
import { AdministrarCursosService } from './application/administrar-cursos.service.js';
import { CursoRepository } from './persistence/curso.repository.js';
import { AdministrarCursosController } from './presentation/administrar-cursos.controller.js';

@Module({
	providers: [AdministrarCursosService, CursoRepository],
	controllers: [AdministrarCursosController],
})
export class AdministrarCursosModule { }