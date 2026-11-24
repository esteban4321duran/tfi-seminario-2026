import { Body, Controller, Get, Post, Query, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import { enteroPositivo, leerTexto } from '../../core/presentation/entrada.js';
import { OPCIONES_ASISTENCIA } from '../domain/asistencia.domain.js';
import { GestionarAsistenciasService } from '../application/gestionar-asistencias.service.js';
import type { AsistenciaEntrada } from '../domain/asistencia.domain.js';
import type { GuardarAsistenciaDto } from '../application/asistencia.types.js';

const MENSAJE_DATOS_INVALIDOS = 'Revisá los datos de asistencia.';
const MENSAJE_CURSO_NO_DISPONIBLE = 'El curso no está disponible para tomar asistencia hoy.';
const MENSAJE_CONFLICTO = 'Otra persona guardó asistencia para esta fecha. Recargá la hoja e intentá nuevamente.';

function registroDeBody(body: unknown): Record<string, unknown> {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) return {};
	return body as Record<string, unknown>;
}

function leerAsistencias(valor: unknown): Array<AsistenciaEntrada | null> | null | undefined {
	if (valor === undefined) return undefined;
	if (!Array.isArray(valor)) return null;

	return valor.map((entrada) => {
		if (typeof entrada !== 'object' || entrada === null || Array.isArray(entrada)) return null;
		const registro = entrada as Record<string, unknown>;
		return {
			inscripcionId: enteroPositivo(registro.inscripcionId),
			valor: leerTexto(registro.valor),
		};
	});
}

@Controller('gestionar-asistencias')
export class GestionarAsistenciasController {
	constructor(private readonly service: GestionarAsistenciasService) { }

	@Get()
	@Render('asistencias')
	async tomarAsistencia(
		@Query('cursoId') cursoIdParam?: unknown,
		@Query('fecha') fechaParam?: unknown,
	) {
		const cursoId = enteroPositivo(cursoIdParam);
		const vista = await this.service.getHojaDeAsistencia(cursoId, leerTexto(fechaParam));
		if (!cursoId && leerTexto(cursoIdParam)?.trim()) {
			vista.mensajeAviso = 'El curso indicado no es válido. Seleccioná un curso disponible.';
		}
		return {
			...vista,
			esAsistencias: true,
			esHistorial: false,
			opcionesAsistencia: OPCIONES_ASISTENCIA,
		};
	}

	@Get('historial')
	@Render('asistencias')
	async historial(
		@Query('cursoId') cursoIdParam?: unknown,
		@Query('guardada') guardadaParam?: unknown,
	) {
		const cursoId = enteroPositivo(cursoIdParam);
		const vista = await this.service.getHistorial(cursoId, enteroPositivo(guardadaParam));
		if (!cursoId && leerTexto(cursoIdParam)?.trim()) {
			vista.mensajeAviso = 'El curso indicado no es válido para consultar el historial.';
		}
		return {
			...vista,
			esAsistencias: true,
			esHistorial: true,
			opcionesAsistencia: OPCIONES_ASISTENCIA,
		};
	}

	@Post()
	async guardar(@Body() body: unknown, @Res() res: Response) {
		const registro = registroDeBody(body);
		const dto: GuardarAsistenciaDto = {
			cursoId: enteroPositivo(registro.cursoId),
			fecha: leerTexto(registro.fecha),
			asistencias: leerAsistencias(registro.asistencias),
		};
		const resultado = await this.service.guardarAsistencia(dto);

		if (resultado.ok) return res.status(200).json({ id: resultado.claseId });
		if (resultado.tipo === 'datos_invalidos') {
			return res.status(400).json({ mensajeError: MENSAJE_DATOS_INVALIDOS, errores: resultado.errores });
		}
		if (resultado.tipo === 'curso_no_disponible') {
			return res.status(400).json({
				mensajeError: MENSAJE_CURSO_NO_DISPONIBLE,
				errores: [{ campo: 'cursoId', mensaje: MENSAJE_CURSO_NO_DISPONIBLE }],
			});
		}
		return res.status(409).json({
			mensajeError: MENSAJE_CONFLICTO,
			errores: [{ campo: 'asistencias', mensaje: MENSAJE_CONFLICTO }],
		});
	}
}
