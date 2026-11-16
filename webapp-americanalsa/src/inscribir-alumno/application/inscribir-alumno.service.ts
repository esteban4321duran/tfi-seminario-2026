import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { etiquetaCuatrimestreFecha } from '../../core/application/cuatrimestre.js';
import { calcularSaldoCuota, esCuotaVencida } from '../../core/application/cuotas.js';
import { FormatoMonedaService } from '../../core/application/formato-moneda-service/formato-moneda-service.js';
import { InscribirAlumnoRepository } from '../persistence/inscribir-alumno.repository.js';
import type {
	AlumnoElegido,
	AlumnoEncontrado,
	CuotaAdeudada,
	CursoDisponible,
	InscripcionReciente,
	InscribirAlumnoDto,
	ResultadoInscripcion,
} from './inscribir-alumno.types.js';

@Injectable()
export class InscribirAlumnoService {
	constructor(
		private readonly repository: InscribirAlumnoRepository,
		private readonly formatoMonedaService: FormatoMonedaService,
	) { }

	async getCursosDisponibles(): Promise<CursoDisponible[]> {
		const filas = await this.repository.getCursosDisponibles();
		return filas.map((f) => ({
			id: f.id,
			etiqueta: `${f.nombre} - ${etiquetaCuatrimestreFecha(f.fechaInicio)}`,
		}));
	}

	async listarInscripciones(): Promise<InscripcionReciente[]> {
		const filas = await this.repository.listarInscripciones();
		return filas.map((f) => ({
			id: f.id,
			alumno: `${f.nombre} ${f.apellido}`,
			curso: f.curso,
			fecha: dayjs(f.creadoEn).format('DD/MM/YYYY'),
		}));
	}

	async buscarAlumnos(texto: string): Promise<AlumnoEncontrado[]> {
		const filas = await this.repository.buscarAlumnos(texto);
		return filas.map((f) => ({
			id: f.id,
			apellido: f.apellido,
			nombre: f.nombre,
			dni: f.dni,
		}));
	}

	async getAlumno(id: number): Promise<AlumnoElegido | undefined> {
		const alumno = await this.repository.getAlumno(id);
		return alumno && {
			id: alumno.id,
			apellido: alumno.apellido,
			nombre: alumno.nombre,
		};
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

		const cursando = await this.repository.getCursoEnCurso(alumnoId);
		if (cursando) {
			return { ok: false, tipo: 'ya_cursando', mensaje: `El alumno ya está cursando "${cursando}", no se puede inscribir a otro curso.` };
		}

		await this.repository.crearInscripcion(alumnoId, planificacionId);

		return { ok: true, alumnoId, anio: planificacion.fechaInicio.getFullYear() };
	}

	private async getCuotasAdeudadas(alumnoId: number): Promise<CuotaAdeudada[]> {
		const ahora = new Date();
		const filas = await this.repository.getCuotasConPagos(alumnoId);
		const formatoMoneda = this.formatoMonedaService.getFormateador();
		return filas.flatMap((f) => {
			const pendiente = calcularSaldoCuota(f.precioCuota, f.importePagado);
			if (!esCuotaVencida(f.mes, ahora) || pendiente === 0) return [];
			return [{
				curso: f.curso,
				mes: dayjs(f.mes).locale('es').format('MMMM YYYY'),
				pendiente: formatoMoneda.format(pendiente),
			}];
		});
	}

}