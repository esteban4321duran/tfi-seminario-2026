import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CuentaCorrienteAlumnoInforme } from './CuentaCorrienteAlumnoInforme.js';
import { alumnoTable, cuotaTable, inscripcionAlumnoTable, pagoCuotaAlumnoTable, planificacionCursoTable } from '../persistence/schema.js';
import { eq, getColumns, sql, sum } from "drizzle-orm";
import dayjs from "dayjs";
import 'dayjs/locale/es.js';

dayjs.locale('es');


//definimos un servicio para este caso de uso
//$ nest generate service procesarPagosAlumnos/procesarPagosAlumnos 

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

		const result = await this.db.select({
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


		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
		const formatoDinero = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

		const conceptos = result
			.map((concepto) => {
				return {
					mes: dayjs(concepto.mes).format('MMMM'),
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


		return {
			conceptos,
			deudaTotal: "$70.000",
		}
	}

	private estadoConcepto(total: number, acumulado: number) {

		if (total === acumulado) {
			return 'pagado';
		} else if (acumulado > 0) {
			return 'parcial';
		} else {
			return 'pendiente';
		}

		// 				when "importe_pagado_acumulado" = "importe_total" then 'pagado'
		// 				when "importe_pagado_acumulado" > 0 then 'parcial'
		// 				else 'pendiente'
		// 				end`,
	}
}
