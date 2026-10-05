export interface ConceptoCuentaCorrienteAlumno {
	mes: string;
	importeTotal: string;
	importePagadoAcumulado: string;
	importePendiente: string;
	estado: string;
	estadoPagado: boolean;
	estadoParcial: boolean;
	estadoPendiente: boolean;
}

export interface CuentaCorrienteAlumnoInforme {
	conceptos: ConceptoCuentaCorrienteAlumno[];
	deudaTotal: string;
}


