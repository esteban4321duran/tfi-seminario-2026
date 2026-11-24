import { Injectable } from '@nestjs/common';
import { etiquetaCuatrimestreFecha } from '../../core/application/cuatrimestre.js';
import {
	fechaLocalIso,
	formatearDiaConSemana,
	inicioDiaLocal,
	inicioDiaLocalSiguiente,
} from '../../core/application/fechas.js';
import {
	OPCIONES_ASISTENCIA,
	VALOR_ASISTENCIA_POR_DEFECTO,
	validarConjuntoAsistencias,
	validarFechaClase,
} from '../domain/asistencia.domain.js';
import { estaEnCursoHoy } from '../../core/application/fechas.js';
import { AsistenciaRepository } from '../persistence/asistencia.repository.js';
import type {
	CursoAsistencia,
	GuardarAsistenciaDto,
	HistorialAsistencias,
	HojaDeAsistencia,
	ResultadoGuardarAsistencia,
} from './asistencia.types.js';

const MENSAJE_ELEGIR_CURSO = 'Seleccioná un curso para cargar la lista de asistencia.';
const MENSAJE_SIN_CURSOS = 'No hay cursos en curso para tomar asistencia.';
const MENSAJE_CURSO_NO_DISPONIBLE = 'El curso elegido no está en curso hoy. Seleccioná un curso disponible.';
const MENSAJE_SIN_ALUMNOS = 'Este curso no tiene alumnos inscriptos; no se puede guardar una clase vacía.';

@Injectable()
export class GestionarAsistenciasService {
	constructor(private readonly repository: AsistenciaRepository) { }

	async getCursosEnCurso(): Promise<CursoAsistencia[]> {
		const referencia = new Date();
		return this.listarCursosEnCurso(referencia);
	}

	async getHojaDeAsistencia(cursoId?: number, fechaSolicitada?: string): Promise<HojaDeAsistencia> {
		const referencia = new Date();
		const hoy = fechaLocalIso(referencia);
		const cursos = await this.listarCursosEnCurso(referencia);
		const curso = cursos.find((item) => item.id === cursoId) ?? null;
		const fecha = fechaSolicitada ?? hoy;
		const seleccion: HojaDeAsistencia = {
			cursos: cursos.map((item) => ({ ...item, seleccionado: item.id === cursoId })),
			curso,
			fecha,
			fechaHoy: hoy,
			fechaEtiqueta: '',
			alumnos: [],
			claseId: null,
			claseExistente: false,
			docente: curso?.docente ?? null,
			errores: [],
			mensajeAviso: null,
		};

		if (!cursoId) {
			seleccion.mensajeAviso = cursos.length ? MENSAJE_ELEGIR_CURSO : MENSAJE_SIN_CURSOS;
			return seleccion;
		}
		if (!curso) {
			seleccion.mensajeAviso = MENSAJE_CURSO_NO_DISPONIBLE;
			return seleccion;
		}

		const errores = validarFechaClase(fecha, curso.fechaInicio, curso.fechaFin, hoy);
		if (errores.length > 0) {
			seleccion.errores = errores;
			seleccion.mensajeAviso = 'No se pudo cargar la asistencia para esa fecha.';
			return seleccion;
		}

		const fechaClase = new Date(`${fecha}T00:00:00.000Z`);
		const [inscriptos, filasClase] = await Promise.all([
			this.repository.getAlumnosInscriptos(curso.id),
			this.repository.getClasePorFecha(curso.id, fechaClase),
		]);
		const clase = filasClase[0];
		const valoresGuardados = new Map(
			filasClase.flatMap((fila) => (
				fila.inscripcionId !== null && fila.valor !== null
					? [[fila.inscripcionId, fila.valor] as const]
					: []
			)),
		);
		const docenteGuardado = clase?.docenteApellido && clase.docenteNombre
			? `${clase.docenteApellido}, ${clase.docenteNombre}`
			: null;

		return {
			...seleccion,
			fechaEtiqueta: formatearDiaConSemana(fechaClase),
			alumnos: inscriptos.map((alumno, indice) => {
				const valor = valoresGuardados.get(alumno.inscripcionId) ?? VALOR_ASISTENCIA_POR_DEFECTO;
				return {
					...alumno,
					numero: indice + 1,
					valor,
					opciones: OPCIONES_ASISTENCIA.map((opcion) => ({
						...opcion,
						seleccionado: opcion.valor === valor,
					})),
				};
			}),
			claseId: clase?.claseId ?? null,
			claseExistente: clase !== undefined,
			docente: clase ? docenteGuardado : curso.docente,
		};
	}

	async getHistorial(cursoId?: number, guardada?: number): Promise<HistorialAsistencias> {
		if (!cursoId) {
			return {
				curso: null,
				clases: [],
				clasesDictadas: 0,
				guardada,
				mensajeAviso: 'Seleccioná un curso para consultar su historial.',
			};
		}

		const planificacion = await this.repository.getPlanificacion(cursoId);
		if (!planificacion) {
			return {
				curso: null,
				clases: [],
				clasesDictadas: 0,
				guardada,
				mensajeAviso: 'No encontramos ese curso para mostrar el historial.',
			};
		}

		const filas = await this.repository.getHistorial(cursoId);
		return {
			curso: {
				id: planificacion.id,
				etiqueta: `${planificacion.nombre} - ${etiquetaCuatrimestreFecha(planificacion.fechaInicio)}`,
				cantidadClases: planificacion.cantidadClases,
			},
			clases: filas.map((fila) => ({
				id: fila.id,
				fecha: formatearDiaConSemana(fila.fecha),
				fechaIso: fila.fecha.toISOString().slice(0, 10),
				docente: fila.docenteApellido && fila.docenteNombre
					? `${fila.docenteApellido}, ${fila.docenteNombre}`
					: '—',
				conteos: OPCIONES_ASISTENCIA.map((opcion) => ({
					valor: opcion.valor,
					etiquetaResumen: opcion.etiquetaResumen,
					cantidad: fila[opcion.campoConteo],
				})),
				total: fila.total,
				esNueva: fila.id === guardada,
			})),
			clasesDictadas: filas.length,
			guardada,
			mensajeAviso: null,
		};
	}

	async guardarAsistencia(dto: GuardarAsistenciaDto): Promise<ResultadoGuardarAsistencia> {
		if (!dto.cursoId) {
			return {
				ok: false,
				tipo: 'datos_invalidos',
				errores: [{ campo: 'cursoId', mensaje: 'Seleccioná un curso válido.' }],
			};
		}

		const planificacion = await this.repository.getPlanificacion(dto.cursoId);
		if (!planificacion) return { ok: false, tipo: 'curso_no_disponible' };

		const referencia = new Date();
		const hoy = fechaLocalIso(referencia);
		const inicioCurso = fechaLocalIso(planificacion.fechaInicio);
		const finCurso = fechaLocalIso(planificacion.fechaFin);
		if (!estaEnCursoHoy(inicioCurso, finCurso, hoy)) {
			return { ok: false, tipo: 'curso_no_disponible' };
		}

		const erroresFecha = validarFechaClase(dto.fecha, inicioCurso, finCurso, hoy);
		if (erroresFecha.length > 0) {
			return { ok: false, tipo: 'datos_invalidos', errores: erroresFecha };
		}

		const inscriptos = await this.repository.getAlumnosInscriptos(dto.cursoId);
		if (inscriptos.length === 0) {
			return {
				ok: false,
				tipo: 'datos_invalidos',
				errores: [{ campo: 'asistencias', mensaje: MENSAJE_SIN_ALUMNOS }],
			};
		}

		const validacion = validarConjuntoAsistencias(
			dto.asistencias,
			inscriptos.map((alumno) => alumno.inscripcionId),
		);
		if (!validacion.ok) return { ok: false, tipo: 'datos_invalidos', errores: validacion.errores };

		const valorPorInscripcion = new Map(
			validacion.asistencias.map(({ inscripcionId, valor }) => [inscripcionId, valor]),
		);
		const todasLasAsistencias = inscriptos.map((alumno) => ({
			inscripcionId: alumno.inscripcionId,
			valor: valorPorInscripcion.get(alumno.inscripcionId) ?? VALOR_ASISTENCIA_POR_DEFECTO,
		}));
		const fechaClase = new Date(`${dto.fecha}T00:00:00.000Z`);
		const resultado = await this.repository.guardar(dto.cursoId, fechaClase, todasLasAsistencias);

		if (!resultado.guardada) return { ok: false, tipo: 'conflicto' };
		return { ok: true, claseId: resultado.claseId };
	}

	private async listarCursosEnCurso(referencia: Date): Promise<CursoAsistencia[]> {
		const filas = await this.repository.getCursosEnCurso(
			inicioDiaLocal(referencia),
			inicioDiaLocalSiguiente(referencia),
		);
		return filas.map((fila) => ({
			id: fila.id,
			nombre: fila.nombre,
			etiqueta: `${fila.nombre} - ${etiquetaCuatrimestreFecha(fila.fechaInicio)}`,
			fechaInicio: fechaLocalIso(fila.fechaInicio),
			fechaFin: fechaLocalIso(fila.fechaFin),
			docente: fila.docenteApellido && fila.docenteNombre
				? `${fila.docenteApellido}, ${fila.docenteNombre}`
				: null,
			cantidadClases: fila.cantidadClases,
			seleccionado: false,
		}));
	}
}
