import { Injectable } from '@nestjs/common';
import { cuatrimestreDeFecha, etiquetaCuatrimestre } from '../../core/application/cuatrimestre.js';
import { FormatoMonedaService } from '../../core/application/formato-moneda-service/formato-moneda-service.js';
import { CuotaRepository, type FilaListadoCuotas } from '../persistence/cuota.repository.js';
import type { CuentaCuotas, EstadoCuota, FiltrosCuotas, OrdenCuotas } from './cuotas.types.js';

const MESES = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function claveMes(fecha: Date): string {
	return fecha.toISOString().slice(0, 7);
}

function claveMesLocal(fecha: Date): string {
	const anio = fecha.getFullYear();
	const mes = String(fecha.getMonth() + 1).padStart(2, '0');
	return `${anio}-${mes}`;
}

function formatoMes(fecha: Date): string {
	return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(fecha);
}

function estadoCuota(importeTotal: number, importePagado: number): EstadoCuota {
	if (importePagado >= importeTotal) return 'pagada';
	return importePagado > 0 ? 'parcial' : 'pendiente';
}

function etiquetaEstado(estado: EstadoCuota): string {
	switch (estado) {
		case 'pagada': return 'Pagada';
		case 'parcial': return 'Parcial';
		case 'pendiente': return 'Pendiente';
	}
}

@Injectable()
export class CuotasService {
	constructor(
		private readonly repository: CuotaRepository,
		private readonly formatoMonedaService: FormatoMonedaService,
	) { }

	private agruparCuentas(filas: FilaListadoCuotas[], formatoDinero: Intl.NumberFormat, hoy: string): CuentaCuotas[] {
		const cuentasPorInscripcion = new Map<number, CuentaCuotas>();
		for (const fila of filas) {
			const anio = fila.fechaInicio.getFullYear();
			const cuatrimestre = cuatrimestreDeFecha(fila.fechaInicio);
			let cuenta = cuentasPorInscripcion.get(fila.inscripcionId);
			if (!cuenta) {
				const nuevaCuenta: CuentaCuotas = {
					inscripcionId: fila.inscripcionId,
					alumnoId: fila.alumnoId,
					nombre: fila.nombre,
					apellido: fila.apellido,
					dni: fila.dni,
					cursoId: fila.cursoId,
					curso: fila.curso,
					anio,
					cuatrimestre,
					cuatrimestreEtiqueta: `${etiquetaCuatrimestre(cuatrimestre)} cuatrimestre ${anio}`,
					cuotasPagadas: 0,
					cuotasPendientes: 0,
					cuotasTotal: 0,
					saldoAdeudado: 0,
					saldoAdeudadoFormato: '',
					cuotas: [],
				};
				cuentasPorInscripcion.set(fila.inscripcionId, nuevaCuenta);
				cuenta = nuevaCuenta;
			}
			if (!cuenta) continue;

			if (fila.cuotaId === null || fila.mes === null) continue;
			const importeTotal = Number(fila.precioCuota);
			const importePagado = Number(fila.importePagado);
			const importePendiente = Math.max(0, importeTotal - importePagado);
			const estado = estadoCuota(importeTotal, importePagado);
			const mesKey = claveMes(fila.mes);
			cuenta.cuotas.push({
				id: fila.cuotaId,
				mes: formatoMes(fila.mes),
				mesKey,
				importeTotal,
				importeTotalFormato: formatoDinero.format(importeTotal),
				importePagado,
				importePagadoFormato: formatoDinero.format(importePagado),
				importePendiente,
				importePendienteFormato: formatoDinero.format(importePendiente),
				estado,
				estadoEtiqueta: etiquetaEstado(estado),
			});
			cuenta.cuotasTotal++;
			if (estado === 'pagada') cuenta.cuotasPagadas++;
			else cuenta.cuotasPendientes++;
			if (mesKey <= hoy) cuenta.saldoAdeudado += importePendiente;
		}

		const todasLasCuentas = Array.from(cuentasPorInscripcion.values());
		for (const cuenta of todasLasCuentas) {
			cuenta.saldoAdeudadoFormato = formatoDinero.format(cuenta.saldoAdeudado);
		}
		return todasLasCuentas;
	}

	private aplicarFiltros(cuentas: CuentaCuotas[], filtros: FiltrosCuotas): CuentaCuotas[] {
		const termino = filtros.buscar?.trim().toLocaleLowerCase('es');
		return cuentas
			.filter((cuenta) => filtros.alumnoId === undefined || cuenta.alumnoId === filtros.alumnoId)
			.filter((cuenta) => filtros.cursoId === undefined || cuenta.cursoId === filtros.cursoId)
			.filter((cuenta) => filtros.anio === undefined || cuenta.anio === filtros.anio)
			.filter((cuenta) => filtros.cuatrimestre === undefined || cuenta.cuatrimestre === filtros.cuatrimestre)
			.filter((cuenta) => !termino || `${cuenta.apellido} ${cuenta.nombre} ${cuenta.dni}`.toLocaleLowerCase('es').includes(termino))
			.filter((cuenta) => !filtros.soloConDeuda || cuenta.saldoAdeudado > 0)
			.filter((cuenta) => (!filtros.mes && !filtros.estado) || cuenta.cuotas.some((cuota) =>
				(!filtros.mes || cuota.mesKey.slice(5, 7) === filtros.mes) &&
				(!filtros.estado || cuota.estado === filtros.estado),
			))
			.map((cuenta) => ({
				...cuenta,
				cuotas: cuenta.cuotas.filter((cuota) =>
					(!filtros.mes || cuota.mesKey.slice(5, 7) === filtros.mes) &&
					(!filtros.estado || cuota.estado === filtros.estado),
				),
			}));
	}

	private ordenar(cuentas: CuentaCuotas[], orden?: OrdenCuotas): CuentaCuotas[] {
		const resultado = [...cuentas];
		switch (orden) {
			case 'apellido-desc':
				return resultado.sort((a, b) => b.apellido.localeCompare(a.apellido, 'es') || b.nombre.localeCompare(a.nombre, 'es'));
			case 'deuda-desc':
				return resultado.sort((a, b) => b.saldoAdeudado - a.saldoAdeudado);
			case 'deuda-asc':
				return resultado.sort((a, b) => a.saldoAdeudado - b.saldoAdeudado);
			default:
				return resultado.sort((a, b) => a.apellido.localeCompare(b.apellido, 'es') || a.nombre.localeCompare(b.nombre, 'es'));
		}
	}

	private armarOpcionesFiltros(cuentas: CuentaCuotas[], filtros: FiltrosCuotas) {
		const cursos = Array.from(new Map(cuentas.map((c) => [c.cursoId, { id: c.cursoId, nombre: c.curso }])).values())
			.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
		const anios = [...new Set(cuentas.map((c) => c.anio))].sort((a, b) => b - a);
		const estados = [
			{ valor: '', nombre: 'Todos los estados' },
			{ valor: 'pagada', nombre: 'Pagada' },
			{ valor: 'parcial', nombre: 'Parcial' },
			{ valor: 'pendiente', nombre: 'Pendiente' },
		].map((estado) => ({ ...estado, seleccionado: (filtros.estado ?? '') === estado.valor }));

		return {
			cursos: [
				{ id: '', nombre: 'Todos los cursos', seleccionado: filtros.cursoId === undefined },
				...cursos.map((curso) => ({ ...curso, seleccionado: filtros.cursoId === curso.id })),
			],
			anios: [
				{ valor: '', etiqueta: 'Todos los años', seleccionado: filtros.anio === undefined },
				...anios.map((anio) => ({ valor: anio, etiqueta: String(anio), seleccionado: filtros.anio === anio })),
			],
			cuatrimestres: [
				{ valor: '', etiqueta: 'Todos', seleccionado: filtros.cuatrimestre === undefined },
				{ valor: 1, etiqueta: `${etiquetaCuatrimestre(1)} cuatrimestre`, seleccionado: filtros.cuatrimestre === 1 },
				{ valor: 2, etiqueta: `${etiquetaCuatrimestre(2)} cuatrimestre`, seleccionado: filtros.cuatrimestre === 2 },
			],
			estados,
			meses: [
				{ valor: '', nombre: 'Todos los meses', seleccionado: !filtros.mes },
				...MESES.map((nombre, index) => {
					const valor = String(index + 1).padStart(2, '0');
					return { valor, nombre, seleccionado: filtros.mes === valor };
				}),
			],
			ordenes: [
				{ valor: 'apellido-asc', etiqueta: 'Apellido (A-Z)' },
				{ valor: 'apellido-desc', etiqueta: 'Apellido (Z-A)' },
				{ valor: 'deuda-desc', etiqueta: 'Mayor saldo adeudado' },
				{ valor: 'deuda-asc', etiqueta: 'Menor saldo adeudado' },
			].map((orden) => ({ ...orden, seleccionado: (filtros.orden ?? 'apellido-asc') === orden.valor })),
			filtros: {
				...filtros,
				buscar: filtros.buscar ?? '',
				soloConDeuda: filtros.soloConDeuda ?? false,
			},
		};
	}

	async getListado(filtros: FiltrosCuotas, inscripcionId?: number) {
		const filas = await this.repository.getListado(inscripcionId);
		const cuentas = this.agruparCuentas(
			filas,
			this.formatoMonedaService.getFormateador(),
			claveMesLocal(new Date()),
		);
		const cuentasFiltradas = this.ordenar(this.aplicarFiltros(cuentas, filtros), filtros.orden);

		return {
			cuentas: cuentasFiltradas,
			cantidadResultados: cuentasFiltradas.length,
			...this.armarOpcionesFiltros(cuentas, filtros),
		};
	}

	async getOpcionesPago(inscripcionId?: number) {
		const { cuentas } = await this.getListado({}, inscripcionId);
		return cuentas
			.flatMap((cuenta) => cuenta.cuotas
				.filter((cuota) => cuota.importePendiente > 0)
				.map((cuota) => ({
					cuotaKey: `${cuenta.inscripcionId}:${cuota.id}`,
					inscripcionId: cuenta.inscripcionId,
					etiqueta: `${cuenta.apellido}, ${cuenta.nombre} - ${cuenta.curso} - ${cuota.mes} - saldo ${cuota.importePendienteFormato}`,
				})));
	}

	async registrarPago(cuotaKey?: string, montoTexto?: string): Promise<string | undefined> {
		const [inscripcionIdTexto, cuotaIdTexto] = (cuotaKey ?? '').split(':');
		const inscripcionId = Number(inscripcionIdTexto);
		const cuotaId = Number(cuotaIdTexto);
		const monto = Number((montoTexto ?? '').trim().replace(',', '.'));
		if (!Number.isInteger(inscripcionId) || inscripcionId <= 0 || !Number.isInteger(cuotaId) || cuotaId <= 0) {
			return 'Seleccioná una cuota válida.';
		}
		if (!Number.isFinite(monto) || monto <= 0 || Math.abs(monto * 100 - Math.round(monto * 100)) > 0.0001) {
			return 'Ingresá un importe válido mayor a cero, con hasta dos decimales.';
		}

		const montoEnCentavos = Math.round(monto * 100);
		const resultado = await this.repository.registrarPagoConSaldoValido({
			inscripcionId,
			cuotaId,
			monto: montoEnCentavos / 100,
		});
		if (resultado.ok) return undefined;

		switch (resultado.motivo) {
			case 'cuota_no_disponible':
				return 'La cuota seleccionada ya no está disponible.';
			case 'cuota_pagada':
				return 'La cuota seleccionada ya está pagada.';
			case 'saldo_insuficiente':
				return 'El importe no puede superar el saldo pendiente de la cuota.';
		}
	}
}
