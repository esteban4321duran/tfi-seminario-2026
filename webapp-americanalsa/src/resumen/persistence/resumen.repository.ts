import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { VALOR_ASISTENCIA_AUSENTE } from '../../core/application/asistencias.js';
import {
	alumnoTable, asistenciaAlumnoTable, claseDictadaTable, cuotaTable, cursoTable,
	inscripcionAlumnoTable, pagoCuotaAlumnoTable, planificacionCursoTable,
} from '../../core/persistence/schema.js';

export interface ResumenCuotas { alumnosConCuotaPendiente: number; montoPendiente: number; alumnosConCuotaVencida: number }
export interface ResumenInasistenciaRow { planificacionId: number; apellido: string; nombre: string; curso: string; fechaInicio: Date; ausencias: number }
export interface InscripcionRecienteRow { apellido: string; nombre: string; curso: string; creadoEn: Date }

@Injectable()
export class ResumenRepository {
	constructor(@InjectDrizzle() private readonly db: NodePgDatabase) { }

	private saldosPorCuota() {
		return this.db.select({
			alumnoId: alumnoTable.id, mes: cuotaTable.mes,
			saldo: sql<number>`greatest(${planificacionCursoTable.precioCuota} - coalesce(sum(${pagoCuotaAlumnoTable.monto}), 0), 0)`.mapWith(Number).as('saldo'),
		}).from(inscripcionAlumnoTable)
			.innerJoin(alumnoTable, eq(alumnoTable.id, inscripcionAlumnoTable.alumnoId))
			.innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId))
			.innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.innerJoin(cuotaTable, and(eq(cuotaTable.planificacionCursoId, planificacionCursoTable.id), isNull(cuotaTable.borradoEn)))
			.leftJoin(pagoCuotaAlumnoTable, and(eq(pagoCuotaAlumnoTable.cuotaId, cuotaTable.id), eq(pagoCuotaAlumnoTable.inscripcionAlumnoId, inscripcionAlumnoTable.id), isNull(pagoCuotaAlumnoTable.borradoEn)))
			.where(and(isNull(alumnoTable.borradoEn), isNull(inscripcionAlumnoTable.borradoEn), isNull(planificacionCursoTable.borradoEn), isNull(cursoTable.borradoEn)))
			.groupBy(alumnoTable.id, cuotaTable.id, cuotaTable.mes, planificacionCursoTable.precioCuota)
			.as('saldo_por_cuota');
	}

	async getCuotas(inicioMes: Date): Promise<ResumenCuotas> {
		const saldos = this.saldosPorCuota();
		const inicioMesCalendario = sql`(${inicioMes}::timestamptz at time zone 'UTC')::date`;
		const [fila] = await this.db.select({
			alumnosConCuotaPendiente: sql<number>`count(distinct case when ${saldos.mes} = ${inicioMesCalendario} and ${saldos.saldo} > 0 then ${saldos.alumnoId} end)`.mapWith(Number),
			montoPendiente: sql<number>`coalesce(sum(case when ${saldos.mes} = ${inicioMesCalendario} then ${saldos.saldo} else 0 end), 0)`.mapWith(Number),
			alumnosConCuotaVencida: sql<number>`count(distinct case when ${saldos.mes} < ${inicioMesCalendario} and ${saldos.saldo} > 0 then ${saldos.alumnoId} end)`.mapWith(Number),
		}).from(saldos);
		return fila;
	}

	async getCursosEnCurso(desde: Date, hasta: Date): Promise<number> {
		const [fila] = await this.db.select({ cantidad: sql<number>`count(*)`.mapWith(Number) }).from(planificacionCursoTable)
			.innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.where(and(isNull(planificacionCursoTable.borradoEn), isNull(cursoTable.borradoEn), lt(planificacionCursoTable.fechaInicio, hasta), gte(planificacionCursoTable.fechaFin, desde)));
		return fila.cantidad;
	}

	async getInasistencias(desde: Date, hasta: Date, limite: number): Promise<ResumenInasistenciaRow[]> {
		const ausencias = sql<number>`count(${asistenciaAlumnoTable.id}) filter (where ${asistenciaAlumnoTable.valor} = ${VALOR_ASISTENCIA_AUSENTE})`;
		return this.db.select({ planificacionId: planificacionCursoTable.id, apellido: alumnoTable.apellido, nombre: alumnoTable.nombre, curso: cursoTable.nombre, fechaInicio: planificacionCursoTable.fechaInicio, ausencias: ausencias.mapWith(Number) })
			.from(inscripcionAlumnoTable).innerJoin(alumnoTable, eq(alumnoTable.id, inscripcionAlumnoTable.alumnoId)).innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId)).innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.innerJoin(claseDictadaTable, and(eq(claseDictadaTable.planificacionCursoId, planificacionCursoTable.id), isNull(claseDictadaTable.borradoEn)))
			.leftJoin(asistenciaAlumnoTable, and(eq(asistenciaAlumnoTable.claseDictadaId, claseDictadaTable.id), eq(asistenciaAlumnoTable.inscripcionAlumnoId, inscripcionAlumnoTable.id), isNull(asistenciaAlumnoTable.borradoEn)))
			.where(and(isNull(alumnoTable.borradoEn), isNull(inscripcionAlumnoTable.borradoEn), isNull(planificacionCursoTable.borradoEn), isNull(cursoTable.borradoEn), lt(planificacionCursoTable.fechaInicio, hasta), gte(planificacionCursoTable.fechaFin, desde)))
			.groupBy(planificacionCursoTable.id, alumnoTable.id, alumnoTable.apellido, alumnoTable.nombre, cursoTable.id, cursoTable.nombre, planificacionCursoTable.fechaInicio)
			.having(sql`${ausencias} >= ${limite}`)
			.orderBy(desc(ausencias), asc(alumnoTable.apellido), asc(alumnoTable.nombre));
	}

	async getTotalInasistencias(desde: Date, hasta: Date, limite: number): Promise<number> {
		const ausencias = sql<number>`count(${asistenciaAlumnoTable.id}) filter (where ${asistenciaAlumnoTable.valor} = ${VALOR_ASISTENCIA_AUSENTE})`;
		const agrupadas = this.db.select({ inscripcionId: inscripcionAlumnoTable.id, ausencias }).from(inscripcionAlumnoTable)
			.innerJoin(alumnoTable, eq(alumnoTable.id, inscripcionAlumnoTable.alumnoId)).innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId)).innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.innerJoin(claseDictadaTable, and(eq(claseDictadaTable.planificacionCursoId, planificacionCursoTable.id), isNull(claseDictadaTable.borradoEn)))
			.leftJoin(asistenciaAlumnoTable, and(eq(asistenciaAlumnoTable.claseDictadaId, claseDictadaTable.id), eq(asistenciaAlumnoTable.inscripcionAlumnoId, inscripcionAlumnoTable.id), isNull(asistenciaAlumnoTable.borradoEn)))
			.where(and(isNull(alumnoTable.borradoEn), isNull(inscripcionAlumnoTable.borradoEn), isNull(planificacionCursoTable.borradoEn), isNull(cursoTable.borradoEn), lt(planificacionCursoTable.fechaInicio, hasta), gte(planificacionCursoTable.fechaFin, desde)))
			.groupBy(inscripcionAlumnoTable.id)
			.having(sql`${ausencias} >= ${limite}`)
			.as('inasistencias_con_limite');
		const [fila] = await this.db.select({ cantidad: sql<number>`count(*)`.mapWith(Number) }).from(agrupadas);
		return fila.cantidad;
	}

	async getInscripcionesRecientes(): Promise<InscripcionRecienteRow[]> {
		return this.db.select({ apellido: alumnoTable.apellido, nombre: alumnoTable.nombre, curso: cursoTable.nombre, creadoEn: inscripcionAlumnoTable.creadoEn }).from(inscripcionAlumnoTable)
			.innerJoin(alumnoTable, eq(alumnoTable.id, inscripcionAlumnoTable.alumnoId)).innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId)).innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.where(and(isNull(inscripcionAlumnoTable.borradoEn), isNull(alumnoTable.borradoEn), isNull(planificacionCursoTable.borradoEn), isNull(cursoTable.borradoEn)))
			.orderBy(desc(inscripcionAlumnoTable.creadoEn), desc(inscripcionAlumnoTable.id)).limit(5);
	}
}
