import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CuentaCorrienteAlumnoInforme } from './CuentaCorrienteAlumnoInforme.js';
import { alumnoTable } from '../persistence/schema.js';

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

	getInformeDeudaAlumno(alumnoId: number): CuentaCorrienteAlumnoInforme {
		return {
			conceptos: [
				{
					mes: "marzo",
					importeTotal: "$60.000,00",
					importePagadoAcumulado: "$60.000,00",
					importePendiente: "$0,00",
					estado: "pagado",
					estadoPagado: true,
					estadoPendiente: false,
					estadoParcial: false,
				},
				{
					mes: "abril",
					importeTotal: "$60.000,00",
					importePagadoAcumulado: "$60.000,00",
					importePendiente: "$0,00",
					estado: "pagado",
					estadoPagado: true,
					estadoPendiente: false,
					estadoParcial: false,
				},
				{
					mes: "mayo",
					importeTotal: "$60.000,00",
					importePagadoAcumulado: "$50.000,00",
					importePendiente: "$10.000,00",
					estado: "parcial",
					estadoPagado: false,
					estadoPendiente: false,
					estadoParcial: true,
				},
				{
					mes: "junio",
					importeTotal: "$60.000,00",
					importePagadoAcumulado: "$0,00",
					importePendiente: "$60.000,00",
					estado: "pendiente",
					estadoPagado: false,
					estadoPendiente: true,
					estadoParcial: false,
				},
			],
			deudaTotal: "$70.000",
		}
	}
}
