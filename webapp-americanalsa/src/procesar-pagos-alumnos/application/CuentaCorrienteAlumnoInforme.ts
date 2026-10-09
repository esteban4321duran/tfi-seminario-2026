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

export interface CeldaCuentaCorrienteAlumno {
	mes: string;
	importeTotal: string;
	importePagadoAcumulado: string;
	importePendiente: string;
	estado: string;
	estadoPagado: boolean;
	estadoParcial: boolean;
	estadoPendiente: boolean;
}

export interface CuentaCorrienteAlumnoInformeV2 {
	celdasPorAlumnoPorConcepto: Map<number, Map<string, CeldaCuentaCorrienteAlumno>>
	columnasKeys: Set<string>;
	filasKeys: Set<number>;
}



