import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CuentaCorrienteAlumnoInforme } from './CuentaCorrienteAlumnoInforme.js';
import { alumnoTable, cuotaTable, cursoTable, inscripcionAlumnoTable, pagoCuotaAlumnoTable, planificacionCursoTable, matriculaTable, pagoMatriculacionAlumnoTable} from '../persistence/schema.js';
import { and, eq, sql, sum } from "drizzle-orm";
import { union } from 'drizzle-orm/pg-core'
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
<<<<<<< HEAD
		const importesPorMesQuery = this.db.select({
=======
		const importesPorMes = this.db.select({
>>>>>>> 60bafd6cf2dcfec25a734f2323f1c0cf1338488a
			alumno: alumnoTable.id.as('alumno'),
			mes: sql<number>`EXTRACT(MONTH from "cuota".mes)`.as("mes"),
			anio: sql<number>`EXTRACT(YEAR from "cuota".mes)`.as("anio"),
			concepto: cursoTable.nombre,
			importeTotal: planificacionCursoTable.precioCuota.as('importe_total'),
			importePagadoAcumulado: sql<number>`coalesce(sum("pago_cuota_alumno"."monto"), 0)`.as('importe_pagado_acumulado'),
			importePendiente: sql<string>`"planificacion_curso"."precio_cuota" - coalesce(sum("pago_cuota_alumno"."monto"),0)`.as('importe_pendiente'),
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
			);

<<<<<<< HEAD
		const matriculasPorMesQuery = this.db.select({
=======
		const matriculasPorMes = this.db.select({
>>>>>>> 60bafd6cf2dcfec25a734f2323f1c0cf1338488a
			alumno: alumnoTable.id.as('alumno'),
			mes: sql<number>`EXTRACT(MONTH from "planificacion_curso"."fecha_inicio")`.as("mes"),
			anio: sql<number>`EXTRACT(YEAR from "planificacion_curso"."fecha_inicio")`.as("anio"),
			concepto: sql<string>`concat('matricula ', "curso"."nombre")`.as('concepto') ,
			importeTotal: planificacionCursoTable.precioCuota.as('importe_total'),
			importePagadoAcumulado: sql<number>`coalesce(sum("pago_matriculacion_alumno"."monto"), 0)`.as('importe_pagado_acumulado'),
			importePendiente: sql<string>`"planificacion_curso"."precio_cuota" - coalesce(sum("pago_matriculacion_alumno"."monto"),0)`.as('importe_pendiente'),
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
				inscripcionAlumnoTable.id,
				matriculaTable.id,
				planificacionCursoTable.fechaInicio,
				cursoTable.nombre,
				planificacionCursoTable.id,
				planificacionCursoTable.precioCuota,
			)
			.orderBy(
				alumnoTable.id,
				planificacionCursoTable.fechaInicio,
			);

		const conceptos = await union(
			importesPorMesQuery,
			matriculasPorMesQuery
		).orderBy(sql`
			"alumno",
			"anio",
			"mes",
			"orden_relativo"
			`)

		console.table(conceptos);

		// const conceptosPorAlumno = Map.groupBy(importesPorMes, (concepto) => concepto.alumno);
		// const conceptosPorAlumnoPorMes = new Map();
		// for (const [alumno, conceptos] of conceptosPorAlumno.entries()){
		// 	conceptosPorAlumnoPorMes.set(alumno,  Map.groupBy(conceptos, (c)=>c.mes));
		// }
		//
		// /*
		//  * agregar tablas inscripcion y pagoInscripcionAlumno. Esta nueva tabla inscripcion, representa la entidad que el profe nos pidió que almacenemos por separado de las cuotas.
		//  * la inscripcion tiene el mismo valor de mes que la primera cuota.
		//  * Para incluir el pago de la inscripción en el informe podría hacer otra consulta similar a esta, pero from(inscripcion)
		//  * incluir un sub indice 1 entre las columnas resultantes de la consulta de pagos de inscripion
		//  * incluir un sub indice 2 entre las columnas resultantes de la consulta de pagos de cuotas
		//  * luego hacer UNION de ambos result set y ordenar por alumno.id (opcional), mes, sub indice. De esta manera la inscripcion figura antes que las cuotas.
		//  */
		//
		// console.log(conceptosPorAlumnoPorMes);
		// /*
		//  * return {
		//  * 	meses: [ARRAY CONSTANTE DE MESES] para armar la plantilla. Aprovechar el helper #unless para los meses en que los alumnos no tengan una cuota.
		//  *	
		//  * }
		//  */
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
