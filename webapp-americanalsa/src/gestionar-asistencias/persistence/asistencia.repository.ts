import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { alumnoTable, asignacionCursoTable, asistenciaAlumnoTable, claseDictadaTable, cursoTable, empleadoTable, inscripcionAlumnoTable, planificacionCursoTable } from '../../core/persistence/schema.js';
import { ROL_INSTRUCTOR } from '../../core/application/roles.js';
import { VALORES_ASISTENCIA, type AsistenciaValidada } from '../domain/asistencia.domain.js';

const INDICES_UNICOS_ASISTENCIA = new Set([
	'clase_dictada_planificacion_fecha_activa_unique_idx',
	'asistencia_alumno_clase_inscripcion_activa_unique_idx',
]);

export type ResultadoGuardarEnRepositorio =
	| { guardada: true; claseId: number }
	| { guardada: false; motivo: 'conflicto' };

function esConflictoUnico(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) return false;
	if ('code' in error && error.code === '23505') {
		if (!('constraint' in error) || error.constraint === undefined) return true;
		return typeof error.constraint === 'string' && INDICES_UNICOS_ASISTENCIA.has(error.constraint);
	}
	return 'cause' in error && esConflictoUnico(error.cause);
}

@Injectable()
export class AsistenciaRepository {
	constructor(
		@InjectDrizzle()
		private readonly db: NodePgDatabase,
	) { }

	async getCursosEnCurso(desde: Date, hasta: Date) {
		return this.db.select({
			id: planificacionCursoTable.id,
			nombre: cursoTable.nombre,
			fechaInicio: planificacionCursoTable.fechaInicio,
			fechaFin: planificacionCursoTable.fechaFin,
			cantidadClases: planificacionCursoTable.cantidadClases,
			docenteNombre: empleadoTable.nombre,
			docenteApellido: empleadoTable.apellido,
		})
			.from(planificacionCursoTable)
			.innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.leftJoin(asignacionCursoTable, and(
				eq(asignacionCursoTable.planificacionCursoId, planificacionCursoTable.id),
				eq(asignacionCursoTable.rol, ROL_INSTRUCTOR),
				isNull(asignacionCursoTable.borradoEn),
			))
			.leftJoin(empleadoTable, eq(empleadoTable.id, asignacionCursoTable.empleadoId))
			.where(and(
				isNull(planificacionCursoTable.borradoEn),
				isNull(cursoTable.borradoEn),
				lt(planificacionCursoTable.fechaInicio, hasta),
				gte(planificacionCursoTable.fechaFin, desde),
			))
			.orderBy(desc(planificacionCursoTable.fechaInicio), asc(cursoTable.nombre));
	}

	async getPlanificacion(id: number) {
		const [planificacion] = await this.db.select({
			id: planificacionCursoTable.id,
			nombre: cursoTable.nombre,
			fechaInicio: planificacionCursoTable.fechaInicio,
			fechaFin: planificacionCursoTable.fechaFin,
			cantidadClases: planificacionCursoTable.cantidadClases,
		})
			.from(planificacionCursoTable)
			.innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.where(and(
				eq(planificacionCursoTable.id, id),
				isNull(planificacionCursoTable.borradoEn),
				isNull(cursoTable.borradoEn),
			))
			.limit(1);
		return planificacion;
	}

	async getAlumnosInscriptos(planificacionId: number) {
		return this.db.select({
			inscripcionId: inscripcionAlumnoTable.id,
			apellido: alumnoTable.apellido,
			nombre: alumnoTable.nombre,
			dni: alumnoTable.dni,
		})
			.from(inscripcionAlumnoTable)
			.innerJoin(alumnoTable, eq(alumnoTable.id, inscripcionAlumnoTable.alumnoId))
			.where(and(
				eq(inscripcionAlumnoTable.planificacionCursoId, planificacionId),
				isNull(inscripcionAlumnoTable.borradoEn),
				isNull(alumnoTable.borradoEn),
			))
			.orderBy(asc(alumnoTable.apellido), asc(alumnoTable.nombre), asc(inscripcionAlumnoTable.id));
	}

	async getClasePorFecha(planificacionId: number, fecha: Date) {
		return this.db.select({
			claseId: claseDictadaTable.id,
			docenteNombre: empleadoTable.nombre,
			docenteApellido: empleadoTable.apellido,
			inscripcionId: asistenciaAlumnoTable.inscripcionAlumnoId,
			valor: asistenciaAlumnoTable.valor,
		})
			.from(claseDictadaTable)
			.leftJoin(empleadoTable, eq(empleadoTable.id, claseDictadaTable.empleadoId))
			.leftJoin(asistenciaAlumnoTable, and(
				eq(asistenciaAlumnoTable.claseDictadaId, claseDictadaTable.id),
				isNull(asistenciaAlumnoTable.borradoEn),
			))
			.where(and(
				eq(claseDictadaTable.planificacionCursoId, planificacionId),
				eq(claseDictadaTable.fechaClase, fecha),
				isNull(claseDictadaTable.borradoEn),
			));
	}

	async getHistorial(planificacionId: number) {
		const presentes = sql<number>`count(${asistenciaAlumnoTable.id}) filter (where ${asistenciaAlumnoTable.valor} = ${VALORES_ASISTENCIA.presente})`.mapWith(Number);
		const ausentes = sql<number>`count(${asistenciaAlumnoTable.id}) filter (where ${asistenciaAlumnoTable.valor} = ${VALORES_ASISTENCIA.ausente})`.mapWith(Number);
		const justificados = sql<number>`count(${asistenciaAlumnoTable.id}) filter (where ${asistenciaAlumnoTable.valor} = ${VALORES_ASISTENCIA.justificado})`.mapWith(Number);
		const total = sql<number>`count(${asistenciaAlumnoTable.id})`.mapWith(Number);

		return this.db.select({
			id: claseDictadaTable.id,
			fecha: claseDictadaTable.fechaClase,
			docenteNombre: empleadoTable.nombre,
			docenteApellido: empleadoTable.apellido,
			presentes,
			ausentes,
			justificados,
			total,
		})
			.from(claseDictadaTable)
			.leftJoin(empleadoTable, eq(empleadoTable.id, claseDictadaTable.empleadoId))
			.leftJoin(asistenciaAlumnoTable, and(
				eq(asistenciaAlumnoTable.claseDictadaId, claseDictadaTable.id),
				isNull(asistenciaAlumnoTable.borradoEn),
			))
			.where(and(
				eq(claseDictadaTable.planificacionCursoId, planificacionId),
				isNull(claseDictadaTable.borradoEn),
			))
			.groupBy(
				claseDictadaTable.id,
				claseDictadaTable.fechaClase,
				empleadoTable.nombre,
				empleadoTable.apellido,
			)
			.orderBy(desc(claseDictadaTable.fechaClase), desc(claseDictadaTable.id));
	}

	async guardar(
		planificacionId: number,
		fecha: Date,
		asistencias: AsistenciaValidada[],
	): Promise<ResultadoGuardarEnRepositorio> {
		try {
			return await this.db.transaction(async (tx) => {
				const [claseExistente] = await tx.select({ id: claseDictadaTable.id })
					.from(claseDictadaTable)
					.where(and(
						eq(claseDictadaTable.planificacionCursoId, planificacionId),
						eq(claseDictadaTable.fechaClase, fecha),
						isNull(claseDictadaTable.borradoEn),
					))
					.limit(1);

				let claseId = claseExistente?.id;
				if (claseId === undefined) {
					const [docente] = await tx.select({ empleadoId: asignacionCursoTable.empleadoId })
						.from(asignacionCursoTable)
						.where(and(
							eq(asignacionCursoTable.planificacionCursoId, planificacionId),
							eq(asignacionCursoTable.rol, ROL_INSTRUCTOR),
							isNull(asignacionCursoTable.borradoEn),
						))
						.orderBy(asc(asignacionCursoTable.id))
						.limit(1);
					const [clase] = await tx.insert(claseDictadaTable).values({
						planificacionCursoId: planificacionId,
						fechaClase: fecha,
						empleadoId: docente?.empleadoId ?? null,
					}).returning({ id: claseDictadaTable.id });
					claseId = clase.id;
				}

				for (const asistencia of asistencias) {
					const [guardada] = await tx.select({ id: asistenciaAlumnoTable.id })
						.from(asistenciaAlumnoTable)
						.where(and(
							eq(asistenciaAlumnoTable.claseDictadaId, claseId),
							eq(asistenciaAlumnoTable.inscripcionAlumnoId, asistencia.inscripcionId),
							isNull(asistenciaAlumnoTable.borradoEn),
						))
						.limit(1);

					if (guardada) {
						await tx.update(asistenciaAlumnoTable)
							.set({ valor: asistencia.valor, actualizadoEn: new Date() })
							.where(eq(asistenciaAlumnoTable.id, guardada.id));
					} else {
						await tx.insert(asistenciaAlumnoTable).values({
							claseDictadaId: claseId,
							inscripcionAlumnoId: asistencia.inscripcionId,
							valor: asistencia.valor,
						});
					}
				}

				return { guardada: true, claseId };
			});
		} catch (error) {
			if (esConflictoUnico(error)) return { guardada: false, motivo: 'conflicto' };
			throw error;
		}
	}
}
