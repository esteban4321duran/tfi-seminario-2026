import { Body, Controller, Get, Post, Query, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import dayjs from 'dayjs';
import {
	AdministrarCursosService, DIAS_SEMANA, normalizarDias,
	type ResultadoCrearCurso,
} from '../application/administrar-cursos.service.js';
import type { CrearCursoDto } from '../application/administrar-cursos.service.js';

@Controller('administrar-cursos')
export class AdministrarCursosController {
	constructor(private readonly service: AdministrarCursosService) { }

	@Get()
	@Render('cursos-listado')
	async listado(@Query('creado') creado?: string) {
		const cursos = await this.service.listar();
		return {
			creado: creado !== undefined,
			cursos: cursos.map((c) => ({ ...c, esNuevo: String(c.id) === creado })),
		};
	}

	@Get('nuevo')
	@Render('curso-formulario')
	async nuevo() {
		return this.vistaFormulario({});
	}

	@Post()
	async crear(@Body() body: CrearCursoDto, @Res() res: Response) {
		const resultado = await this.service.crear(body);
		if (resultado.ok) {
			return res.redirect(`/administrar-cursos?creado=${resultado.planificacionId}`);
		}
		return res.status(400).render('curso-formulario', await this.vistaFormulario(body, resultado));
	}

	private async vistaFormulario(valores: CrearCursoDto, resultado?: ResultadoCrearCurso) {
		const instructoras = await this.service.getInstructoras();
		const diasElegidos = normalizarDias(valores.dias);
		const anioActual = dayjs().year();
		return {
			instructoras: instructoras.map((i) => ({ ...i, seleccionada: String(i.id) === valores.instructoraId })),
			dias: DIAS_SEMANA.map((d) => ({ ...d, marcado: diasElegidos.includes(d.valor) })),
			cuatrimestres: [
				{ valor: 1, etiqueta: '1er cuatrimestre (marzo - junio)', seleccionado: valores.cuatrimestre === '1' },
				{ valor: 2, etiqueta: '2do cuatrimestre (agosto - noviembre)', seleccionado: valores.cuatrimestre === '2' },
			],
			valores: {
				nombre: valores.nombre ?? '',
				anio: valores.anio ?? anioActual,
				horaInicio: valores.horaInicio ?? '09:00',
				duracionMinutos: valores.duracionMinutos ?? 120,
				cantidadClases: valores.cantidadClases ?? 16,
				precioCuota: valores.precioCuota ?? '',
				precioMatricula: valores.precioMatricula ?? '',
			},
			faltantes: resultado && !resultado.ok && resultado.tipo === 'faltan_datos' ? resultado.faltantes : [],
			mensajeError: resultado && !resultado.ok && resultado.tipo === 'curso_existente' ? resultado.mensaje : null,
		};
	}
}