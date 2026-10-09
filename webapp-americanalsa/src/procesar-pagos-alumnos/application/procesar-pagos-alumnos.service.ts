import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CuentaCorrienteAlumnoInforme } from './CuentaCorrienteAlumnoInforme.js';
import { alumnoTable, cuotaTable, cursoTable, inscripcionAlumnoTable, pagoCuotaAlumnoTable, planificacionCursoTable } from '../persistence/schema.js';
import { and, eq, sql, sum } from "drizzle-orm";
import dayjs from "dayjs";
import 'dayjs/locale/es.js';

dayjs.locale('es');


//definimos un servicio para este caso de uso
// sintaxis: nest generate service []
//$ nest generate service application/procesarPagosAlumnos procesarPagosAlumnos

//esta sintaxis le indica al CLI de nest que genere el servicio dentro del modulo procesarPagosAlumnos.
//.service.ts se concatena automáticamente al nombre del archivo
@Injectable()
export class ProcesarPagosAlumnosService {
	constructor(
		@InjectDrizzle()
		private readonly db: NodePgDatabase,
	) {
	}

	async getInformeDeudaAlumno(alumnoId: number): Promise<CuentaCorrienteAlumnoInforme> {

		const importesPorMes = await this.db.select({
			mes: cuotaTable.mes,
			importePagadoAcumulado: sum(pagoCuotaAlumnoTable.monto).as('importe_pagado_acumulado'),
			importeTotal: planificacionCursoTable.precioCuota.as('importe_total'),
			importePendiente: sql<string>`"planificacion_curso"."precio_cuota" - sum("pago_cuota_alumno"."monto")`.as('importe_pendiente')
		})
			.from(cuotaTable)
			.innerJoin(pagoCuotaAlumnoTable, eq(pagoCuotaAlumnoTable.cuotaId, cuotaTable.id))
			.innerJoin(inscripcionAlumnoTable, eq(pagoCuotaAlumnoTable.inscripcionAlumnoId, inscripcionAlumnoTable.id))
			.innerJoin(alumnoTable, eq(inscripcionAlumnoTable.alumnoId, alumnoTable.id))
			.innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, cuotaTable.planificacionCursoId))
			.where(eq(alumnoTable.id, alumnoId))
			.groupBy(cuotaTable.id, cuotaTable.mes, planificacionCursoTable.id);

		console.log(importesPorMes);

		const resultTotalAdeudado = await this.db.select({
			totalAdeudado: sql<string>`sum("planificacion_curso"."precio_cuota") - sum("pago_cuota_alumno"."monto")`.as('total_adeudado')
		})
			.from(cuotaTable)
			.innerJoin(pagoCuotaAlumnoTable, eq(pagoCuotaAlumnoTable.cuotaId, cuotaTable.id))
			.innerJoin(inscripcionAlumnoTable, eq(pagoCuotaAlumnoTable.inscripcionAlumnoId, inscripcionAlumnoTable.id))
			.innerJoin(alumnoTable, eq(inscripcionAlumnoTable.alumnoId, alumnoTable.id))
			.innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, cuotaTable.planificacionCursoId))
			.where(eq(alumnoTable.id, alumnoId));



		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
		const formatoDinero = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

		const conceptos = importesPorMes
			.map((concepto) => {
				return {
					mes: dayjs(concepto.mes).format('MMMM YYYY'),
					importeTotal: Number(concepto.importeTotal),
					importePagadoAcumulado: Number(concepto.importePagadoAcumulado),
					importePendiente: Number(concepto.importePendiente),
				};
			})
			.map((concepto) => {
				return {
					...concepto,
					estado: this.estadoConcepto(concepto.importeTotal, concepto.importePagadoAcumulado),
				};
			}).map((concepto) => {
				return {
					...concepto,
					estadoPagado: concepto.estado === 'pagado',
					estadoParcial: concepto.estado === 'parcial',
					estadoPendiente: concepto.estado === 'pendiente',
				};
			})
			.map((concepto) => {
				return {
					...concepto,
					importeTotal: formatoDinero.format(concepto.importeTotal),
					importePagadoAcumulado: formatoDinero.format(concepto.importePagadoAcumulado),
					importePendiente: formatoDinero.format(concepto.importePendiente),
				};
			});

		const totalAdeudado = formatoDinero.format(Number(resultTotalAdeudado[0].totalAdeudado));

		return {
			conceptos,
			deudaTotal: totalAdeudado
		}
	}

	async getAllInformeDeudaAlumno(): Promise<void> {
		const importesPorMes = await this.db.select({
			alumno: alumnoTable.id,
			mes: cuotaTable.mes,
			curso: cursoTable.nombre,
			importeTotal: planificacionCursoTable.precioCuota.as('importe_total'),
			importePagadoAcumulado: sql<number>`coalesce(sum("pago_cuota_alumno"."monto"), 0)`,
			importePendiente: sql<string>`"planificacion_curso"."precio_cuota" - coalesce(sum("pago_cuota_alumno"."monto"),0)`.as('importe_pendiente')
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
				inscripcionAlumnoTable.id,
				cuotaTable.id,
				cuotaTable.mes,
				cursoTable.nombre,
				planificacionCursoTable.id,
				planificacionCursoTable.precioCuota,
			)
			.orderBy(
				alumnoTable.id,
				cuotaTable.mes
			)

		console.table(importesPorMes);
	}

	private estadoConcepto(total: number, acumulado: number) {
		if (total === acumulado) {
			return 'pagado';
		} else if (acumulado > 0) {
			return 'parcial';
		} else {
			return 'pendiente';
		}
	}
}
