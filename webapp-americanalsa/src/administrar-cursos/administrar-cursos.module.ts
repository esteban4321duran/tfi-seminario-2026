import { Module } from '@nestjs/common';
import { AdministrarCursosService } from './application/administrar-cursos.service.js';
import { AdministrarCursosController } from './presentation/administrar-cursos.controller.js';

@Module({
	providers: [AdministrarCursosService],
	controllers: [AdministrarCursosController],
})
export class AdministrarCursosModule { }