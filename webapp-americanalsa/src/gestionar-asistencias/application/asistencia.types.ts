import type {
	AsistenciaEntrada,
	ErrorCampoAsistencia,
	ValorAsistencia,
} from '../domain/asistencia.domain.js';

export interface GuardarAsistenciaDto {
	cursoId?: number;
	fecha?: string;
	asistencias?: Array<AsistenciaEntrada | null> | null;
}

export type ResultadoGuardarAsistencia =
	| { ok: true; claseId: number }
	| { ok: false; tipo: 'datos_invalidos'; errores: ErrorCampoAsistencia[] }
	| { ok: false; tipo: 'curso_no_disponible' }
	| { ok: false; tipo: 'conflicto' };

export interface CursoAsistencia {
	id: number;
	nombre: string;
	etiqueta: string;
	fechaInicio: string;
	fechaFin: string;
	docente: string | null;
	cantidadClases: number;
	seleccionado: boolean;
}

export interface AlumnoEnAsistencia {
	inscripcionId: number;
	numero: number;
	apellido: string;
	nombre: string;
	dni: string;
	valor: ValorAsistencia;
	opciones: Array<{
		valor: ValorAsistencia;
		etiqueta: string;
		etiquetaResumen: string;
		seleccionado: boolean;
	}>;
}

export interface HojaDeAsistencia {
	cursos: CursoAsistencia[];
	curso: CursoAsistencia | null;
	fecha: string;
	fechaHoy: string;
	fechaEtiqueta: string;
	alumnos: AlumnoEnAsistencia[];
	claseId: number | null;
	claseExistente: boolean;
	docente: string | null;
	errores: ErrorCampoAsistencia[];
	mensajeAviso: string | null;
}

export interface ClaseEnHistorial {
	id: number;
	fecha: string;
	fechaIso: string;
	docente: string;
	conteos: Array<{
		valor: ValorAsistencia;
		etiquetaResumen: string;
		cantidad: number;
	}>;
	total: number;
	esNueva: boolean;
}

export interface HistorialAsistencias {
	curso: {
		id: number;
		etiqueta: string;
		cantidadClases: number;
	} | null;
	clases: ClaseEnHistorial[];
	clasesDictadas: number;
	guardada: number | undefined;
	mensajeAviso: string | null;
}
