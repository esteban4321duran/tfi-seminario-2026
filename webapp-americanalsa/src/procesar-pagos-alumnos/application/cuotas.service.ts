import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { cuatrimestreDeFecha, etiquetaCuatrimestre, type Cuatrimestre } from '../../core/application/cuatrimestre.js';
import {
	alumnoTable,
	cuotaTable,
	cursoTable,
	inscripcionAlumnoTable,
	pagoCuotaAlumnoTable,
	planificacionCursoTable,
} from '../../core/persistence/schema.js';
import { FormatoMonedaService } from '../../core/application/formato-moneda-service/formato-moneda-service.js';

export type EstadoCuota = 'pagada' | 'parcial' | 'pendiente';
export type OrdenCuotas = 'apellido-asc' | 'apellido-desc' | 'deuda-desc' | 'deuda-asc';

export interface FiltrosCuotas {
	buscar?: string;
	alumnoId?: number;
	cursoId?: number;
	anio?: number;
	cuatrimestre?: Cuatrimestre;
	estado?: EstadoCuota;
	mes?: string;
	soloConDeuda?: boolean;
	orden?: OrdenCuotas;
}

export interface CuotaDetalle {
	id: number;
	mes: string;
	mesKey: string;
	importeTotal: number;
	importeTotalFormato: string;
	importePagado: number;
	importePagadoFormato: string;
	importePendiente: number;
	importePendienteFormato: string;
	estado: EstadoCuota;
	estadoEtiqueta: string;
}

export interface CuentaCuotas {
	inscripcionId: number;
	alumnoId: number;
	nombre: string;
	apellido: string;
	dni: string;
	cursoId: number;
	curso: string;
	anio: number;
	cuatrimestre: Cuatrimestre;
	cuatrimestreEtiqueta: string;
	cuotasPagadas: number;
	cuotasPendientes: number;
	cuotasTotal: number;
	saldoAdeudado: number;
	saldoAdeudadoFormato: string;
	cuotas: CuotaDetalle[];
}

const MESES = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function claveMes(fecha: Date): string {
	return fecha.toISOString().slice(0, 7);
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
		@InjectDrizzle()
		private readonly db: NodePgDatabase,
		private readonly formatoMonedaService: FormatoMonedaService,
	) { }

	async getListado(filtros: FiltrosCuotas) {
		const formatoDinero = this.formatoMonedaService.getFormateador();
		const filas = await this.db.select({
			inscripcionId: inscripcionAlumnoTable.id,
			alumnoId: alumnoTable.id,
			nombre: alumnoTable.nombre,
			apellido: alumnoTable.apellido,
			dni: alumnoTable.dni,
			cursoId: cursoTable.id,
			curso: cursoTable.nombre,
			fechaInicio: planificacionCursoTable.fechaInicio,
			precioCuota: planificacionCursoTable.precioCuota,
			cuotaId: cuotaTable.id,
			mes: cuotaTable.mes,
			importePagado: sql<number>`coalesce(sum(${pagoCuotaAlumnoTable.monto}), 0)`,
		})
			.from(inscripcionAlumnoTable)
			.innerJoin(alumnoTable, eq(alumnoTable.id, inscripcionAlumnoTable.alumnoId))
			.innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId))
			.innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.leftJoin(cuotaTable, and(
				eq(cuotaTable.planificacionCursoId, planificacionCursoTable.id),
				isNull(cuotaTable.borradoEn),
			))
			.leftJoin(pagoCuotaAlumnoTable, and(
				eq(pagoCuotaAlumnoTable.cuotaId, cuotaTable.id),
				eq(pagoCuotaAlumnoTable.inscripcionAlumnoId, inscripcionAlumnoTable.id),
				isNull(pagoCuotaAlumnoTable.borradoEn),
			))
			.where(and(
				isNull(inscripcionAlumnoTable.borradoEn),
				isNull(alumnoTable.borradoEn),
				isNull(planificacionCursoTable.borradoEn),
				isNull(cursoTable.borradoEn),
			))
			.groupBy(
				inscripcionAlumnoTable.id,
				alumnoTable.id,
				alumnoTable.nombre,
				alumnoTable.apellido,
				alumnoTable.dni,
				cursoTable.id,
				cursoTable.nombre,
				planificacionCursoTable.fechaInicio,
				planificacionCursoTable.precioCuota,
				cuotaTable.id,
				cuotaTable.mes,
			)
			.orderBy(asc(alumnoTable.apellido), asc(alumnoTable.nombre), asc(cuotaTable.mes));

		const cuentasPorInscripcion = new Map<number, CuentaCuotas>();
		const hoy = new Date().toISOString().slice(0, 7);

		for (const fila of filas) {
			const anio = fila.fechaInicio.getUTCFullYear();
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
		const cursos = Array.from(new Map(todasLasCuentas.map((c) => [c.cursoId, { id: c.cursoId, nombre: c.curso }])).values())
			.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
		const anios = [...new Set(todasLasCuentas.map((c) => c.anio))].sort((a, b) => b - a);
		const termino = filtros.buscar?.trim().toLocaleLowerCase('es');
		const cuentasFiltradas = todasLasCuentas
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

		switch (filtros.orden) {
			case 'apellido-desc':
				cuentasFiltradas.sort((a, b) => b.apellido.localeCompare(a.apellido, 'es') || b.nombre.localeCompare(a.nombre, 'es'));
				break;
			case 'deuda-desc':
				cuentasFiltradas.sort((a, b) => b.saldoAdeudado - a.saldoAdeudado);
				break;
			case 'deuda-asc':
				cuentasFiltradas.sort((a, b) => a.saldoAdeudado - b.saldoAdeudado);
				break;
			default:
				cuentasFiltradas.sort((a, b) => a.apellido.localeCompare(b.apellido, 'es') || a.nombre.localeCompare(b.nombre, 'es'));
		}

		const meses = MESES.map((nombre, index) => {
			const valor = String(index + 1).padStart(2, '0');
			return { valor, nombre, seleccionado: filtros.mes === valor };
		});
		const estados = [
			{ valor: '', nombre: 'Todos los estados' },
			{ valor: 'pagada', nombre: 'Pagada' },
			{ valor: 'parcial', nombre: 'Parcial' },
			{ valor: 'pendiente', nombre: 'Pendiente' },
		].map((estado) => ({ ...estado, seleccionado: (filtros.estado ?? '') === estado.valor }));

		return {
			cuentas: cuentasFiltradas,
			cantidadResultados: cuentasFiltradas.length,
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
				{ valor: 1, etiqueta: '1er cuatrimestre', seleccionado: filtros.cuatrimestre === 1 },
				{ valor: 2, etiqueta: '2do cuatrimestre', seleccionado: filtros.cuatrimestre === 2 },
			],
			estados,
			meses: [{ valor: '', nombre: 'Todos los meses', seleccionado: !filtros.mes }, ...meses],
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

	async getOpcionesPago(inscripcionId?: number) {
		const { cuentas } = await this.getListado({});
		return cuentas
			.filter((cuenta) => inscripcionId === undefined || cuenta.inscripcionId === inscripcionId)
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

		return this.db.transaction(async (tx) => {
			const [cuota] = await tx.select({
				id: cuotaTable.id,
				inscripcionId: inscripcionAlumnoTable.id,
				precioCuota: planificacionCursoTable.precioCuota,
			})
				.from(cuotaTable)
				.innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, cuotaTable.planificacionCursoId))
				.innerJoin(inscripcionAlumnoTable, eq(inscripcionAlumnoTable.planificacionCursoId, planificacionCursoTable.id))
				.where(and(
					eq(cuotaTable.id, cuotaId),
					eq(inscripcionAlumnoTable.id, inscripcionId),
					isNull(cuotaTable.borradoEn),
					isNull(planificacionCursoTable.borradoEn),
					isNull(inscripcionAlumnoTable.borradoEn),
				))
				.limit(1)
				.for('update', { of: cuotaTable });
			if (!cuota) return 'La cuota seleccionada ya no está disponible.';

			const [pagos] = await tx.select({
				total: sql<number>`coalesce(sum(${pagoCuotaAlumnoTable.monto}), 0)`,
			})
				.from(pagoCuotaAlumnoTable)
				.where(and(
					eq(pagoCuotaAlumnoTable.cuotaId, cuotaId),
					eq(pagoCuotaAlumnoTable.inscripcionAlumnoId, cuota.inscripcionId),
					isNull(pagoCuotaAlumnoTable.borradoEn),
				));
			const saldo = Math.max(0, Number(cuota.precioCuota) - Number(pagos.total));
			const montoEnCentavos = Math.round(monto * 100);
			if (saldo <= 0) return 'La cuota seleccionada ya está pagada.';
			if (montoEnCentavos > Math.round(saldo * 100)) {
				return 'El importe no puede superar el saldo pendiente de la cuota.';
			}

			await tx.insert(pagoCuotaAlumnoTable).values({
				monto: montoEnCentavos / 100,
				inscripcionAlumnoId: cuota.inscripcionId,
				cuotaId,
			});
			return undefined;
		});
	}
}
