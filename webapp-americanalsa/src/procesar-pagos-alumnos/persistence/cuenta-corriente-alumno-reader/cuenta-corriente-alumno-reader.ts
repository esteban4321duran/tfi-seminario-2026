import { Injectable } from '@nestjs/common';
import { alumnoTable, cuotaTable, cursoTable, inscripcionAlumnoTable, matriculaTable, pagoCuotaAlumnoTable, pagoMatriculacionAlumnoTable, planificacionCursoTable } from '../schema.js';
import { and, eq, sql } from 'drizzle-orm';
import { union } from 'drizzle-orm/pg-core';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { InjectDrizzle } from '@nestjs/drizzle';

export interface RegistroCuentaCorrienteAlumno {
	alumnoId: number;
	dni: string;
	apellido: string;
	nombre: string;
	mes: string;
	anio: string;
	concepto: string;
	importeTotal: number;
	importePagadoAcumulado: number;
	importePendiente: number;
	ordenRelativo: number;
}

@Injectable()
export class CuentaCorrienteAlumnoReader {

	constructor(
		@InjectDrizzle()
		private readonly db: NodePgDatabase,
	){

	}

	public async getRegistros(anio: number): Promise<RegistroCuentaCorrienteAlumno[]>{
		const importesPorMesQuery = this.db.select({
			alumnoId: alumnoTable.id.as('alumno'),
			dni: alumnoTable.dni,
			apellido: alumnoTable.apellido,
			nombre: sql<string>`"alumno"."nombre"`.as('nombre'),
			mes: sql<string>`EXTRACT(MONTH from "cuota".mes)`.as("mes"),
			anio: sql<string>`EXTRACT(YEAR from "cuota".mes)`.as("anio"),
			concepto: sql<string>`"curso"."nombre"`.as('concepto'),
			importeTotal: planificacionCursoTable.precioCuota.as('importe_total'),
			importePagadoAcumulado: sql<number>`coalesce(sum("pago_cuota_alumno"."monto"), 0)`.as('importe_pagado_acumulado'),
			importePendiente: sql<number>`"planificacion_curso"."precio_cuota" - coalesce(sum("pago_cuota_alumno"."monto"),0)`.as('importe_pendiente'),
			ordenRelativo: sql<number>`2`.as('orden_relativo'),
		})
			.from(cuotaTable)
			.innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, cuotaTable.planificacionCursoId))
			.innerJoin(cursoTable, eq(planificacionCursoTable.cursoId, cursoTable.id))
			.innerJoin(inscripcionAlumnoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId))
			.innerJoin(alumnoTable, eq(alumnoTable.id, inscripcionAlumnoTable.alumnoId))
			.leftJoin(
				pagoCuotaAlumnoTable,
				and(
					eq(pagoCuotaAlumnoTable.cuotaId, cuotaTable.id),
					eq(pagoCuotaAlumnoTable.inscripcionAlumnoId, inscripcionAlumnoTable.id,),
				)
			)
			.groupBy(
				alumnoTable.id,
				alumnoTable.dni,
				alumnoTable.apellido,
				alumnoTable.nombre,
				inscripcionAlumnoTable.id,
				cuotaTable.id,
				cuotaTable.mes,
				cursoTable.nombre,
				planificacionCursoTable.id,
				planificacionCursoTable.precioCuota,
			)
			.having(
				eq(
					sql<number>`EXTRACT(year from "planificacion_curso"."fecha_inicio")`,
					anio,
				)
			)
			.orderBy(
				alumnoTable.id,
				cuotaTable.mes
			);

		const matriculasPorMesQuery = this.db.select({
			alumnoId: alumnoTable.id.as('alumno'),
			dni: alumnoTable.dni,
			apellido: alumnoTable.apellido,
			nombre: sql<string>`"alumno"."nombre"`.as('nombre'),
			mes: sql<string>`EXTRACT(MONTH from "planificacion_curso"."fecha_inicio")`.as("mes"),
			anio: sql<string>`EXTRACT(YEAR from "planificacion_curso"."fecha_inicio")`.as("anio"),
			concepto: sql<string>`concat('matricula ', "curso"."nombre")`.as('concepto'),
			importeTotal: planificacionCursoTable.precioCuota.as('importe_total'),
			importePagadoAcumulado: sql<number>`coalesce(sum("pago_matriculacion_alumno"."monto"), 0)`.as('importe_pagado_acumulado'),
			importePendiente: sql<number>`"planificacion_curso"."precio_cuota" - coalesce(sum("pago_matriculacion_alumno"."monto"),0)`.as('importe_pendiente'),
			ordenRelativo: sql<number>`1`.as('orden_relativo'),
		})
			.from(matriculaTable)
			.innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, matriculaTable.planificacionCursoId))
			.innerJoin(cursoTable, eq(planificacionCursoTable.cursoId, cursoTable.id))
			.innerJoin(inscripcionAlumnoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId))
			.innerJoin(alumnoTable, eq(alumnoTable.id, inscripcionAlumnoTable.alumnoId))
			.leftJoin(
				pagoMatriculacionAlumnoTable,
				and(
					eq(pagoMatriculacionAlumnoTable.matriculaId, matriculaTable.id),
					eq(pagoMatriculacionAlumnoTable.inscripcionAlumnoId, inscripcionAlumnoTable.id,),
				)
			)
			.groupBy(
				alumnoTable.id,
				alumnoTable.dni,
				alumnoTable.apellido,
				alumnoTable.nombre,
				inscripcionAlumnoTable.id,
				inscripcionAlumnoTable.id,
				matriculaTable.id,
				planificacionCursoTable.fechaInicio,
				cursoTable.nombre,
				planificacionCursoTable.id,
				planificacionCursoTable.precioCuota,
			)
			.having(
				eq(
					sql<number>`EXTRACT(year from "planificacion_curso"."fecha_inicio")`,
					anio
				)
			)
			.orderBy(
				alumnoTable.id,
				planificacionCursoTable.fechaInicio,
			);

		return await union(
				importesPorMesQuery,
				matriculasPorMesQuery
			).orderBy(sql`
			-- "alumno",
			"anio",
			"mes",
			"orden_relativo"
			`);
	}
}
