import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ConceptoCuentaCorrienteAlumnoV2, ConceptoVacio, CuentaCorrienteAlumnoInforme, CuentaCorrienteAlumnoInformeV2 } from './CuentaCorrienteAlumnoInforme.js';
import { alumnoTable, cuotaTable, cursoTable, inscripcionAlumnoTable, pagoCuotaAlumnoTable, planificacionCursoTable, matriculaTable, pagoMatriculacionAlumnoTable } from '../persistence/schema.js';
import { and, eq, sql, sum } from "drizzle-orm";
import { union } from 'drizzle-orm/pg-core'
import dayjs from "dayjs";
import 'dayjs/locale/es.js';


dayjs.locale('es');

export interface RegistroCuentaCorrienteAlumno {
	alumno: number;
	mes: string;
	anio: string;
	concepto: string;
	importeTotal: number;
	importePagadoAcumulado: number;
	importePendiente: number;
	ordenRelativo: number;
}


enum TipoConcepto {
	MATRICULA = 1,
	CUOTA = 2,
}

const MESES_MAP = new Map([
	['1', 'enero'],
	['2', 'febrero'],
	['3', 'marzo'],
	['4', 'abril'],
	['5', 'mayo'],
	['6', 'junio'],
	['7', 'julio'],
	['8', 'agosto'],
	['9', 'septiembre'],
	['10', 'octubre'],
	['11', 'noviembre'],
	['12', 'diciembre'],
]);

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
					estado: this.getEstadoCelda(concepto.importeTotal, concepto.importePagadoAcumulado),
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

	async getAllInformeDeudaAlumno(): Promise<CuentaCorrienteAlumnoInformeV2> {
		const importesPorMesQuery = this.db.select({
			alumno: alumnoTable.id.as('alumno'),
			mes: sql<string>`EXTRACT(MONTH from "cuota".mes)`.as("mes"),
			anio: sql<string>`EXTRACT(YEAR from "cuota".mes)`.as("anio"),
			concepto: cursoTable.nombre,
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

		const matriculasPorMesQuery = this.db.select({
			alumno: alumnoTable.id.as('alumno'),
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
					2026
				)
			)
			.orderBy(
				alumnoTable.id,
				planificacionCursoTable.fechaInicio,
			);

		const registros: RegistroCuentaCorrienteAlumno[]
			= await union(
				importesPorMesQuery,
				matriculasPorMesQuery
			).orderBy(sql`
			-- "alumno",
			"anio",
			"mes",
			"orden_relativo"
			`);


		const conceptos: ConceptoCuentaCorrienteAlumnoV2[] = registros
			.map((r) => {
				return {
					...r,
					importePagadoAcumulado: Number(r.importePagadoAcumulado),
					importePendiente: Number(r.importePendiente),
				}
			})
			.map((r) => {
				return {
					...r,
					alumno: '' + r.alumno,
					importeTotal: '' + r.importeTotal,
					importePagadoAcumulado: '' + r.importePagadoAcumulado,
					importePendiente: '' + r.importePendiente,
					vacio: false,
					estado: this.getEstadoCelda(r.importeTotal, r.importePagadoAcumulado),
				}
			}).map((r) => {
				return {
					...r,
					// TODO refactorizaar estados en un enum de strings
					estadoPagado: r.estado === 'pagado',
					estadoParcial: r.estado === 'parcial',
					estadoPendiente: r.estado === 'pendiente',
				}
			});

		const celdasPorAlumno = Map.groupBy(conceptos, (c) => c.alumno);
		const celdasPorAlumnoPorConcepto = new Map<string, Map<string, ConceptoCuentaCorrienteAlumnoV2[]>>();
		for (const [alumno, cs] of celdasPorAlumno.entries()) {
			celdasPorAlumnoPorConcepto.set(
				alumno,
				Map.groupBy(
					cs,
					this.getConceptoDeuda
				)
			);
		}
		const columnasKeys = Array.from(
			new Set(
				conceptos.map(
					this.getConceptoDeuda
				)
			)
		);

		const filasKeys = Array.from(
			new Set(
				conceptos.map(
					(c) => c.alumno
				)
			)
		);


		const celdasMatriz = new Array<(ConceptoCuentaCorrienteAlumnoV2 | ConceptoVacio)[]>();

		filasKeys.forEach((alumno, i) => {
			columnasKeys.forEach((concepto, j) => {
				if (celdasMatriz[i] === undefined) {
					celdasMatriz[i] = new Array();
				}

				if (!celdasPorAlumnoPorConcepto.get(alumno)?.has(concepto)) {
					celdasMatriz[i][j] = { vacio: true }
				} else {
					celdasMatriz[i][j] = celdasPorAlumnoPorConcepto.get(alumno)!.get(concepto)![0];
				}


			});
		});
		const informe: CuentaCorrienteAlumnoInformeV2 = {
			conceptos: columnasKeys,
			cuentasAlumnos: filasKeys.map((alumno, i) => {
				return {
					alumno: { dni: alumno },
					conceptos: celdasMatriz[i],
					deudaTotal: '$0.00'
				}
			}),
		};
		return informe;
	}

	private getEstadoCelda(total: number, acumulado: number) {
		if (total === acumulado) {
			return 'pagado';
		} else if (acumulado > 0) {
			return 'parcial';
		} else {
			return 'pendiente';
		}
	}

	private getConceptoDeuda(item: ConceptoCuentaCorrienteAlumnoV2): string {
		return `${MESES_MAP.get(item.mes)}-${item.anio}-${item.ordenRelativo === TipoConcepto.MATRICULA ? 'matricula' : 'cuota'}`
	}
}