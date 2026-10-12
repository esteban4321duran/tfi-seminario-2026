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

export interface CuentaCorrienteAlumno {
	alumno: { dni: string }
	conceptos: (ConceptoCuentaCorrienteAlumnoV2 | ConceptoVacio)[];
	deudaTotal: string;
}

export interface ConceptoCuentaCorrienteAlumnoV2 {
	vacio: boolean;
	alumno: string;
	concepto: string;
	importeTotal: string;
	importePagadoAcumulado: string;
	importePendiente: string;
	estado: string;
	mes: string;
	anio: string;
	ordenRelativo: number;
	estadoPagado: boolean;
	estadoParcial: boolean;
	estadoPendiente: boolean;
}
export interface ConceptoVacio {
	vacio: boolean;
}

export interface CuentaCorrienteAlumnoInformeV2 {
	cuentasAlumnos: CuentaCorrienteAlumno[];
	conceptos: string[];
}