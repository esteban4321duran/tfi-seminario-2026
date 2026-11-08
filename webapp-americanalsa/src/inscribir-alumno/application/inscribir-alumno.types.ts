export interface InscribirAlumnoDto {
	apellido?: string;
	nombre?: string;
	planificacionCursoId?: string;
	alumnoId?: string;
}

export interface CuotaAdeudada {
	curso: string;
	mes: string;
	pendiente: string;
}

export type ResultadoInscripcion =
	| { ok: true; alumnoId: number; anio: number }
	| { ok: false; tipo: 'faltan_datos'; faltantes: string[] }
	| { ok: false; tipo: 'curso_no_disponible'; mensaje: string }
	| { ok: false; tipo: 'adeuda_cuotas'; mensaje: string; cuotas: CuotaAdeudada[] }
	| { ok: false; tipo: 'ya_cursando'; mensaje: string };
