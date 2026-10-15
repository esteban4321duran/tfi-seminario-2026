import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ConceptoCuentaCorrienteAlumnoV2, ConceptoVacio, CuentaCorrienteAlumnoInforme, CuentaCorrienteAlumnoInformeV2 } from './CuentaCorrienteAlumnoInforme.js';
import { alumnoTable, cuotaTable, cursoTable, inscripcionAlumnoTable, pagoCuotaAlumnoTable, planificacionCursoTable, matriculaTable, pagoMatriculacionAlumnoTable } from '../persistence/schema.js';
import { and, eq, sql, sum } from "drizzle-orm";
import { union } from 'drizzle-orm/pg-core'
import dayjs from "dayjs";
import 'dayjs/locale/es.js';
import { FormatoMonedaService } from '../../core/application/formato-moneda-service/formato-moneda-service.js';
import { FormatoFechaService } from '../../core/application/formato-fecha-service/formato-fecha-service.js';


dayjs.locale('es');

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


enum TipoConcepto {
	MATRICULA = 1,
	CUOTA = 2,
}

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
		private readonly formatoMonedaService: FormatoMonedaService,
		private readonly formatoFechaService: FormatoFechaService,
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

		const formatoDinero = this.formatoMonedaService.getFormateador();

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
					estado: this.getEstadoConcepto(concepto.importeTotal, concepto.importePagadoAcumulado),
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
					2025
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

		const formatoMoneda = this.formatoMonedaService.getFormateador();

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
					alumno: {
						id: String(r.alumnoId),
						dni: r.dni,
						apellido: r.apellido,
						nombre: r.nombre
					},
					importeTotal: formatoMoneda.format(r.importeTotal),
					importePagadoAcumulado: formatoMoneda.format(r.importePagadoAcumulado),
					importePendiente: formatoMoneda.format(r.importePendiente),
					vacio: false,
					estado: this.getEstadoConcepto(r.importeTotal, r.importePagadoAcumulado),
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

		const celdasPorAlumno = Map.groupBy(conceptos, (c) => c.alumno.id);
		const celdasPorAlumnoPorConcepto = new Map<string, Map<string, ConceptoCuentaCorrienteAlumnoV2[]>>();
		for (const [alumno, cs] of celdasPorAlumno.entries()) {
			celdasPorAlumnoPorConcepto.set(
				alumno,
				Map.groupBy(
					cs,
					this.getConceptoDeuda.bind(this)
				)
			);
		}
		const columnasKeys = Array.from(
			new Set(
				conceptos.map(
					this.getConceptoDeuda.bind(this)
				)
			)
		);

		const filasKeys = Array.from(
			new Set(
				conceptos.map((c) => c.alumno.id)
			)
		);

		const celdasMatriz = new Array<(ConceptoCuentaCorrienteAlumnoV2 | ConceptoVacio)[]>();

		filasKeys.forEach((alumnoId, i) => {
			columnasKeys.forEach((concepto, j) => {
				if (celdasMatriz[i] === undefined) {
					celdasMatriz[i] = new Array();
				}

				if (!celdasPorAlumnoPorConcepto.get(alumnoId)?.has(concepto)) {
					celdasMatriz[i][j] = { vacio: true }
				} else {
					celdasMatriz[i][j] = celdasPorAlumnoPorConcepto.get(alumnoId)!.get(concepto)![0];
				}


			});
		});

		const alumnosPorId =
			Map
				.groupBy(
					conceptos.map((c) => c.alumno),
					(alumno) => alumno.id
				)


		const informe: CuentaCorrienteAlumnoInformeV2 = {
			conceptos: columnasKeys,
			cuentasAlumnos: filasKeys.map((alumnoId, i) => {
				return {
					alumno: alumnosPorId.get(alumnoId)![0],
					conceptos: celdasMatriz[i],
					deudaTotal: '$0.00'
				}
			}),
		};
		return informe;
	}

	private getEstadoConcepto(total: number, acumulado: number) {
		if (total === acumulado) {
			return 'pagado';
		} else if (acumulado > 0) {
			return 'parcial';
		} else {
			return 'pendiente';
		}
	}

	private tipoConceptoEnLetras(concepto: ConceptoCuentaCorrienteAlumnoV2): string {
		return concepto.ordenRelativo === TipoConcepto.MATRICULA ? 'Matricula' : 'Cuota';
	}

	private getConceptoDeuda(concepto: ConceptoCuentaCorrienteAlumnoV2): string {
		return `${this.tipoConceptoEnLetras(concepto)} ${this.formatoFechaService.mesEnLetras(concepto.mes)} ${concepto.anio}`
	}
}
