import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ConceptoCuentaCorrienteAlumnoV2, ConceptoVacio, CuentaCorrienteAlumnoInforme, CuentaCorrienteAlumnoInformeV2 } from './CuentaCorrienteAlumnoInforme.js';
import { alumnoTable, cuotaTable, inscripcionAlumnoTable, pagoCuotaAlumnoTable, planificacionCursoTable } from '../persistence/schema.js';
import { eq, sql, sum } from "drizzle-orm";
import dayjs from "dayjs";
import 'dayjs/locale/es.js';
import { FormatoMonedaService } from '../../core/application/formato-moneda-service/formato-moneda-service.js';
import { FormatoFechaService } from '../../core/application/formato-fecha-service/formato-fecha-service.js';
import { CuentaCorrienteAlumnoReader, RegistroCuentaCorrienteAlumno } from '../persistence/cuenta-corriente-alumno-reader/cuenta-corriente-alumno-reader.js';


dayjs.locale('es');

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
		private readonly sqlService: CuentaCorrienteAlumnoReader,
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

	async getInformeDeudaTodos(anio: number = dayjs().year()): Promise<CuentaCorrienteAlumnoInformeV2> {

		const registros = await this.sqlService.getRegistrosTodos(anio);
		const conceptos = this.mapearAConceptoCuentaCorriente(registros);
		const informe = this.construirInformeMultialumno(conceptos);
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
		return `${this.tipoConceptoEnLetras(concepto)} ${this.formatoFechaService.mesEnLetras(concepto.mes)}`
	}

	private mapearAConceptoCuentaCorriente(registros: RegistroCuentaCorrienteAlumno[]): ConceptoCuentaCorrienteAlumnoV2[] {
		const formatoMoneda = this.formatoMonedaService.getFormateador();

		return registros
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
	}

	private agruparPorAlumnoPorConcepto(conceptos: ConceptoCuentaCorrienteAlumnoV2[]): Map<string, Map<string, ConceptoCuentaCorrienteAlumnoV2[]>> {
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
		return celdasPorAlumnoPorConcepto;
	}

	private construirInformeMultialumno(conceptos: ConceptoCuentaCorrienteAlumnoV2[]): CuentaCorrienteAlumnoInformeV2 {

		const celdasPorAlumnoPorConcepto = this.agruparPorAlumnoPorConcepto(conceptos);
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

		return {
			conceptos: columnasKeys,
			cuentasAlumnos: filasKeys.map((alumnoId, i) => {
				return {
					alumno: alumnosPorId.get(alumnoId)![0],
					conceptos: celdasMatriz[i],
					deudaTotal: '$0.00'
				}
			}),
		};
	}
}
