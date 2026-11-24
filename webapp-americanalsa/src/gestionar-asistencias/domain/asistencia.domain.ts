const OPCION_ASISTENCIA_PRESENTE = {
	valor: 'presente',
	etiqueta: 'Presente',
	etiquetaResumen: 'Presentes',
	campoConteo: 'presentes',
} as const;
const OPCION_ASISTENCIA_AUSENTE = {
	valor: 'ausente',
	etiqueta: 'Ausente',
	etiquetaResumen: 'Ausentes',
	campoConteo: 'ausentes',
} as const;
const OPCION_ASISTENCIA_JUSTIFICADO = {
	valor: 'justificado',
	etiqueta: 'Justificado',
	etiquetaResumen: 'Justificados',
	campoConteo: 'justificados',
} as const;

export const OPCIONES_ASISTENCIA = [
	OPCION_ASISTENCIA_PRESENTE,
	OPCION_ASISTENCIA_AUSENTE,
	OPCION_ASISTENCIA_JUSTIFICADO,
] as const;

export type ValorAsistencia = (typeof OPCIONES_ASISTENCIA)[number]['valor'];
export const VALORES_ASISTENCIA = {
	presente: OPCION_ASISTENCIA_PRESENTE.valor,
	ausente: OPCION_ASISTENCIA_AUSENTE.valor,
	justificado: OPCION_ASISTENCIA_JUSTIFICADO.valor,
} as const;
export const VALOR_ASISTENCIA_POR_DEFECTO = VALORES_ASISTENCIA.presente;

function esValorAsistencia(valor: string | undefined): valor is ValorAsistencia {
	return OPCIONES_ASISTENCIA.some((opcion) => opcion.valor === valor);
}

export interface AsistenciaEntrada {
	inscripcionId?: number;
	valor?: string;
}

export interface AsistenciaValidada {
	inscripcionId: number;
	valor: ValorAsistencia;
}

export interface ErrorCampoAsistencia {
	campo: 'cursoId' | 'fecha' | 'asistencias' | 'inscripcionId' | 'valor';
	mensaje: string;
}

export type ResultadoValidacionAsistencias =
	| { ok: true; asistencias: AsistenciaValidada[] }
	| { ok: false; errores: ErrorCampoAsistencia[] };

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MENSAJE_FECHA_INVALIDA = 'Ingresá una fecha real en formato AAAA-MM-DD.';

function esFechaCalendario(fecha: string): boolean {
	if (!FORMATO_FECHA.test(fecha)) return false;
	const [anio, mes, dia] = fecha.split('-').map(Number);
	if (mes < 1 || mes > 12 || dia < 1) return false;
	const fechaUtc = new Date(0);
	fechaUtc.setUTCFullYear(anio, mes - 1, dia);
	return fechaUtc.getUTCFullYear() === anio
		&& fechaUtc.getUTCMonth() === mes - 1
		&& fechaUtc.getUTCDate() === dia;
}

export function validarFechaClase(
	fecha: string | undefined,
	inicioCurso: string,
	finCurso: string,
	hoy: string,
): ErrorCampoAsistencia[] {
	if (!fecha || !esFechaCalendario(fecha)) {
		return [{ campo: 'fecha', mensaje: MENSAJE_FECHA_INVALIDA }];
	}

	const errores: ErrorCampoAsistencia[] = [];
	if (fecha > hoy) errores.push({ campo: 'fecha', mensaje: 'La fecha de la clase no puede ser futura.' });
	if (fecha < inicioCurso || fecha > finCurso) {
		errores.push({ campo: 'fecha', mensaje: 'La fecha debe estar dentro del período del curso.' });
	}
	return errores;
}

export function validarConjuntoAsistencias(
	entradas: Array<AsistenciaEntrada | null> | null | undefined,
	inscripcionesValidas: readonly number[],
): ResultadoValidacionAsistencias {
	if (!Array.isArray(entradas)) {
		return { ok: false, errores: [{ campo: 'asistencias', mensaje: 'La lista de asistencias no es válida.' }] };
	}

	const errores: ErrorCampoAsistencia[] = [];
	const idsValidos = new Set(inscripcionesValidas);
	const idsRecibidos = new Set<number>();
	const asistencias: AsistenciaValidada[] = [];

	entradas.forEach((entrada) => {
		if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
			errores.push({ campo: 'asistencias', mensaje: 'Cada asistencia debe ser un objeto válido.' });
			return;
		}

		const { inscripcionId, valor } = entrada;
		if (typeof inscripcionId !== 'number' || !Number.isSafeInteger(inscripcionId) || inscripcionId <= 0) {
			errores.push({ campo: 'inscripcionId', mensaje: 'La inscripción indicada no es válida.' });
			return;
		}
		if (idsRecibidos.has(inscripcionId)) {
			errores.push({ campo: 'inscripcionId', mensaje: 'No repitas una inscripción en la lista.' });
			return;
		}
		idsRecibidos.add(inscripcionId);
		if (!idsValidos.has(inscripcionId)) {
			errores.push({ campo: 'inscripcionId', mensaje: 'La inscripción no pertenece a este curso.' });
			return;
		}
		if (!esValorAsistencia(valor)) {
			errores.push({ campo: 'valor', mensaje: 'Elegí un valor de asistencia válido.' });
			return;
		}

		asistencias.push({ inscripcionId, valor });
	});

	if (errores.length > 0) return { ok: false, errores };
	return { ok: true, asistencias };
}
