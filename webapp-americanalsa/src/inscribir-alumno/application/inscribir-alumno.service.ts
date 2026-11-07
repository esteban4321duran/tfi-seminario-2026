import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { etiquetaCuatrimestreFecha } from '../../core/application/cuatrimestre.js';
import { FormatoMonedaService } from '../../core/application/formato-moneda-service/formato-moneda-service.js';
import { InscribirAlumnoRepository } from '../persistence/inscribir-alumno.repository.js';

export interface InscribirAlumnoDto {
	apellido?: string;
	nombre?: string;
	planificacionCursoId?: string;
	alumnoId?: string; // viene informado cuando el secretario eligió un alumno existente
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

@Injectable()
export class InscribirAlumnoService {
	constructor(
		private readonly repository: InscribirAlumnoRepository,
		private readonly formatoMonedaService: FormatoMonedaService,
	) { }

	async getCursosDisponibles() {
		const filas = await this.repository.getCursosDisponibles();
		return filas.map((f) => ({
			id: f.id,
			etiqueta: `${f.nombre} - ${etiquetaCuatrimestreFecha(f.fechaInicio)}`,
		}));
	}

	async listarInscripciones() {
		return this.repository.listarInscripciones();
	}

	async buscarAlumnos(texto: string) {
		return this.repository.buscarAlumnos(texto);
	}

	async getAlumno(id: number) {
		return this.repository.getAlumno(id);
	}

	async inscribir(dto: InscribirAlumnoDto): Promise<ResultadoInscripcion> {
		const planificacionId = Number(dto.planificacionCursoId);
		const alumnoId = Number(dto.alumnoId);

		const faltantes: string[] = [];
		if (!Number.isInteger(alumnoId) || alumnoId <= 0) faltantes.push('Alumno');
		if (!Number.isInteger(planificacionId) || planificacionId <= 0) faltantes.push('Curso');
		if (faltantes.length > 0) return { ok: false, tipo: 'faltan_datos', faltantes };

		const planificacion = await this.repository.getPlanificacionDisponible(planificacionId);
		if (!planificacion) {
			return { ok: false, tipo: 'curso_no_disponible', mensaje: 'El curso elegido no existe o ya terminó.' };
		}

		if (!(await this.getAlumno(alumnoId))) {
			return { ok: false, tipo: 'faltan_datos', faltantes: ['Alumno (el alumno seleccionado no existe)'] };
		}

		const cuotas = await this.getCuotasAdeudadas(alumnoId);
		if (cuotas.length > 0) {
			return { ok: false, tipo: 'adeuda_cuotas', mensaje: 'El alumno adeuda cuotas, no se puede realizar la inscripción.', cuotas };
		}

		const cursando = await this.getCursoEnCurso(alumnoId);
		if (cursando) {
			return { ok: false, tipo: 'ya_cursando', mensaje: `El alumno ya está cursando "${cursando}", no se puede inscribir a otro curso.` };
		}

		await this.repository.crearInscripcion(alumnoId, planificacionId);

		return { ok: true, alumnoId, anio: planificacion.fechaInicio.getFullYear() };
	}

	private async getCuotasAdeudadas(alumnoId: number): Promise<CuotaAdeudada[]> {
		const filas = await this.repository.getCuotasAdeudadas(alumnoId);
		const formatoMoneda = this.formatoMonedaService.getFormateador();
		return filas.map((f) => ({
			curso: f.curso,
			mes: dayjs(f.mes).locale('es').format('MMMM YYYY'),
			pendiente: formatoMoneda.format(f.pendiente),
		}));
	}

	private async getCursoEnCurso(alumnoId: number): Promise<string | undefined> {
		return this.repository.getCursoEnCurso(alumnoId);
	}
}