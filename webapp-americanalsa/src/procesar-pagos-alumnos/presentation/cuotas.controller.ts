import { BadRequestException, Body, Controller, Get, Post, Query, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { FiltrosCuotas } from '../application/cuotas.types.js';
import { CuotasService } from '../application/cuotas.service.js';
import { enteroPositivo, leerTexto } from '../../core/presentation/entrada.js';


@Controller('cuotas')
export class CuotasController {
	constructor(private readonly service: CuotasService) { }

	@Get()
	@Render('cuotas-listado')
	async listado(@Query() query: Record<string, unknown>) {
		const estadoTexto = leerTexto(query.estado) ?? '';
		const estado = ['pagada', 'parcial', 'pendiente'].includes(estadoTexto)
			? estadoTexto as FiltrosCuotas['estado']
			: undefined;

		const cuatrimestreTexto = leerTexto(query.cuatrimestre);
		const cuatrimestre = cuatrimestreTexto === '1' || cuatrimestreTexto === '2'
			? Number(cuatrimestreTexto) as FiltrosCuotas['cuatrimestre']
			: undefined;

		const mesTexto = leerTexto(query.mes) ?? '';
		const mes = /^\d{2}$/.test(mesTexto) && Number(mesTexto) >= 1 && Number(mesTexto) <= 12
			? mesTexto
			: undefined;

		const ordenTexto = leerTexto(query.orden) ?? '';
		const orden = ['apellido-asc', 'apellido-desc', 'deuda-desc', 'deuda-asc'].includes(ordenTexto)
			? ordenTexto as FiltrosCuotas['orden']
			: 'apellido-asc';
		const anio = enteroPositivo(query.anio);
		const filtros: FiltrosCuotas = {
			buscar: leerTexto(query.buscar)?.trim(),
			alumnoId: enteroPositivo(query.alumnoId),
			cursoId: enteroPositivo(query.cursoId),
			anio: enteroPositivo(query.anio),
			cuatrimestre,
			estado,
			mes,
			soloConDeuda: leerTexto(query.soloConDeuda) === 'on',
			orden,
		};
		return {
			esCuotas: true,
			pagoRegistrado: leerTexto(query.pago) === 'registrado',
			...(await this.service.getListado(filtros)),
		};
	}

	@Get('opciones-pago')
	async opcionesPago(@Query('inscripcionId') inscripcionIdParam?: unknown) {
		const inscripcionId = enteroPositivo(inscripcionIdParam);
		if (inscripcionId === undefined) {
			throw new BadRequestException('La inscripción indicada no es válida.');
		}
		return this.service.getOpcionesPago(inscripcionId);
	}

	@Post('registrar-pago')
	async registrarPago(
		@Body() body: { cuotaKey?: string; monto?: string },
		@Res() res: Response,
	) {
		const mensajeError = await this.service.registrarPago(body.cuotaKey, body.monto);
		if (mensajeError) return res.status(400).json({ mensajeError });
		return res.json({ ok: true });
	}
}
