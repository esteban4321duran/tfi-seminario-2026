import { Body, Controller, Get, Post, Query, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import dayjs from 'dayjs';
import { InscribirAlumnoService } from '../application/inscribir-alumno.service.js';
import type { InscribirAlumnoDto, ResultadoInscripcion } from '../application/inscribir-alumno.service.js';

@Controller('inscribir-alumno')
export class InscribirAlumnoController {
	constructor(private readonly service: InscribirAlumnoService) { }

	@Get()
	@Render('inscripcion-formulario')
	async formulario(@Query('buscar') buscar?: string, @Query('alumnoId') alumnoId?: string) {
		const valores: InscribirAlumnoDto = {};
		if (alumnoId) {
			const alumno = await this.service.getAlumno(Number(alumnoId));
			if (alumno) {
				valores.alumnoId = String(alumno.id);
				valores.apellido = alumno.apellido;
				valores.nombre = alumno.nombre;
			}
		}
		return this.vista(valores, undefined, buscar);
	}

	@Post()
	async inscribir(@Body() body: InscribirAlumnoDto, @Res() res: Response) {
		const resultado = await this.service.inscribir(body);
		if (resultado.ok) {
			return res.redirect(`/cuotas?anio=${resultado.anio}&alumnoId=${resultado.alumnoId}`);
		}
		return res.status(400).render('inscripcion-formulario', await this.vista(body, resultado));
	}

	private async vista(valores: InscribirAlumnoDto, resultado?: ResultadoInscripcion, buscar?: string) {
		const cursos = await this.service.getCursosDisponibles();
		const encontrados = buscar?.trim() ? await this.service.buscarAlumnos(buscar) : [];
		const inscripciones = await this.service.listarInscripciones();
		const error = resultado && !resultado.ok ? resultado : undefined;
		return {
			esInscripciones: true,
			fechaActual: dayjs().format('DD/MM/YYYY'),
			buscar: buscar ?? '',
			encontrados: encontrados.map((alumno) => ({
				...alumno,
				seleccionado: String(alumno.id) === valores.alumnoId,
			})),
			hayBusqueda: !!buscar?.trim(),
			inscripciones: inscripciones.map((i) => ({
				...i,
				alumno: `${i.nombre} ${i.apellido}`,
				fecha: dayjs(i.creadoEn).format('DD/MM/YYYY'),
			})),
			alumnoElegido: !!valores.alumnoId,
			valores: { alumnoId: valores.alumnoId ?? '', apellido: valores.apellido ?? '', nombre: valores.nombre ?? '' },
			cursos: cursos.map((c) => ({ ...c, seleccionado: String(c.id) === valores.planificacionCursoId })),
			faltantes: error?.tipo === 'faltan_datos' ? error.faltantes : [],
			mensajeError: error && error.tipo !== 'faltan_datos' ? error.mensaje : null,
			cuotasAdeudadas: error?.tipo === 'adeuda_cuotas' ? error.cuotas : [],
		};
	}
}