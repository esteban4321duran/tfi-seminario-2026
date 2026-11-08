import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import {
	alumnoTable,
	cuotaTable,
	cursoTable,
	inscripcionAlumnoTable,
	pagoCuotaAlumnoTable,
	planificacionCursoTable,
} from '../../core/persistence/schema.js';

export interface FilaListadoCuotas {
	inscripcionId: number;
	alumnoId: number;
	nombre: string;
	apellido: string;
	dni: string;
	cursoId: number;
	curso: string;
	fechaInicio: Date;
	precioCuota: number;
	cuotaId: number | null;
	mes: Date | null;
	importePagado: number;
}

export type ResultadoPago =
	| { ok: true }
	| { ok: false; motivo: 'cuota_no_disponible' }
	| { ok: false; motivo: 'cuota_pagada' }
	| { ok: false; motivo: 'saldo_insuficiente'; saldo: number };

@Injectable()
export class CuotaRepository {
	constructor(
		@InjectDrizzle()
		private readonly db: NodePgDatabase,
	) { }

	async getListado(inscripcionId?: number): Promise<FilaListadoCuotas[]> {
		return this.db.select({
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
				...(inscripcionId === undefined
					? []
					: [eq(inscripcionAlumnoTable.id, inscripcionId)]),
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
	}

	async registrarPagoConSaldoValido(params: {
		inscripcionId: number;
		cuotaId: number;
		monto: number;
	}): Promise<ResultadoPago> {
		const { inscripcionId, cuotaId, monto } = params;
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
			if (!cuota) return { ok: false, motivo: 'cuota_no_disponible' };

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
			if (saldo <= 0) return { ok: false, motivo: 'cuota_pagada' };
			if (Math.round(monto * 100) > Math.round(saldo * 100)) {
				return { ok: false, motivo: 'saldo_insuficiente', saldo };
			}

			await tx.insert(pagoCuotaAlumnoTable).values({
				monto,
				inscripcionAlumnoId: cuota.inscripcionId,
				cuotaId,
			});
			return { ok: true };
		});
	}
}
