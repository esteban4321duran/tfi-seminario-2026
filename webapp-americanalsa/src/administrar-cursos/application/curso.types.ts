export interface CrearCursoDto {
	nombre?: string;
	anio?: string;
	cuatrimestre?: string;
	instructoraId?: string;
	dias?: string | string[];
	horaInicio?: string;
	duracionMinutos?: string;
	cantidadClases?: string;
	precioCuota?: string;
	precioMatricula?: string;
}

export type ResultadoCrearCurso =
	| { ok: true; planificacionId: number }
	| { ok: false; tipo: 'faltan_datos'; faltantes: string[] }
	| { ok: false; tipo: 'curso_existente'; mensaje: string };

export interface CursoListado {
	id: number;
	nombre: string;
	cuatrimestre: string;
	instructora: string | null;
	horarios: string[];
	cantidadClases: number;
}
