import { Body, Controller, Get, Post, Query, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { FiltrosCuotas } from '../application/cuotas.types.js';
import { CuotasService } from '../application/cuotas.service.js';

function enteroPositivo(valor?: string): number | undefined {
	if (!valor) return undefined;
	const numero = Number(valor);
	return Number.isInteger(numero) && numero > 0 ? numero : undefined;
}

@Controller('cuotas')
export class CuotasController {
	constructor(private readonly service: CuotasService) { }

	@Get()
	@Render('cuotas-listado')
	async listado(@Query() query: Record<string, string | undefined>) {
		const estado = ['pagada', 'parcial', 'pendiente'].includes(query.estado ?? '')
			? query.estado as FiltrosCuotas['estado']
			: undefined;
		const cuatrimestre = query.cuatrimestre === '1' || query.cuatrimestre === '2'
			? Number(query.cuatrimestre) as FiltrosCuotas['cuatrimestre']
			: undefined;
		const mes = /^\d{2}$/.test(query.mes ?? '') && Number(query.mes) >= 1 && Number(query.mes) <= 12
			? query.mes
			: undefined;
		const orden = ['apellido-asc', 'apellido-desc', 'deuda-desc', 'deuda-asc'].includes(query.orden ?? '')
			? query.orden as FiltrosCuotas['orden']
			: 'apellido-asc';
		const anio = enteroPositivo(query.anio);
		const filtros: FiltrosCuotas = {
			buscar: query.buscar?.trim(),
			alumnoId: enteroPositivo(query.alumnoId),
			cursoId: enteroPositivo(query.cursoId),
			anio,
			cuatrimestre,
			estado,
			mes,
			soloConDeuda: query.soloConDeuda === 'on',
			orden,
		};
		return {
			esCuotas: true,
			pagoRegistrado: query.pago === 'registrado',
			...(await this.service.getListado(filtros)),
		};
	}

	@Get('registrar-pago')
	@Render('cuotas-pago-formulario')
	async formularioPago(@Query('inscripcionId') inscripcionIdTexto?: string) {
		const inscripcionId = enteroPositivo(inscripcionIdTexto);
		const opcionesPago = await this.service.getOpcionesPago(inscripcionId);
		const cuotaKey = opcionesPago[0]?.cuotaKey ?? '';
		return {
			esCuotas: true,
			opcionesPago: opcionesPago.map((opcion) => ({ ...opcion, seleccionada: opcion.cuotaKey === cuotaKey })),
			cuotaKey,
			monto: '',
			mensajeError: opcionesPago.length ? null : 'No hay cuotas pendientes para registrar.',
		};
	}

	@Post('registrar-pago')
	async registrarPago(
		@Body() body: { cuotaKey?: string; monto?: string },
		@Res() res: Response,
	) {
		const mensajeError = await this.service.registrarPago(body.cuotaKey, body.monto);
		if (!mensajeError) return res.redirect('/cuotas?pago=registrado');

		const [inscripcionIdTexto] = (body.cuotaKey ?? '').split(':');
		const opcionesPago = await this.service.getOpcionesPago(enteroPositivo(inscripcionIdTexto));
		return res.status(400).render('cuotas-pago-formulario', {
			esCuotas: true,
			opcionesPago: opcionesPago.map((opcion) => ({ ...opcion, seleccionada: opcion.cuotaKey === body.cuotaKey })),
			cuotaKey: body.cuotaKey ?? '',
			monto: body.monto ?? '',
			mensajeError,
		});
	}
}
