import type { Cuatrimestre } from '../../core/application/cuatrimestre.js';

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
