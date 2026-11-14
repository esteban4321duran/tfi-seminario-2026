import { Injectable } from '@nestjs/common';
import { CUATRIMESTRES, calcularFechasCuatrimestre, cuatrimestreDeFecha, esCuatrimestre, etiquetaCuatrimestre, type Cuatrimestre } from '../../core/application/cuatrimestre.js';
import { DIAS_SEMANA, normalizarDias, type DiaSemana } from '../domain/curso.domain.js';
import { CursoRepository } from '../persistence/curso.repository.js';
import type { CrearCursoDto, CursoListado, ResultadoCrearCurso } from './curso.types.js';

function leerPrecio(valor?: string): number | undefined {
	const texto = valor?.trim();
	if (!texto || !/^\d+(?:\.\d{1,2})?$/.test(texto)) return undefined;
	const precio = Number(texto);
	return Number.isFinite(precio) && precio <= 999_999_999.99 ? precio : undefined;
}

function crearCuotasDelCuatrimestre(anio: number, cuatrimestre: Cuatrimestre) {
	const { mesInicio, mesFin } = CUATRIMESTRES[cuatrimestre];
	const cuotas: Date[] = [];
	for (let mes = mesInicio; mes <= mesFin; mes++) {
		cuotas.push(new Date(Date.UTC(anio, mes, 1)));
	}
	return cuotas;
}

type ValidacionDatos =
	| { ok: true; datos: {
			nombre: string;
			instructoraId: number;
			dias: DiaSemana[];
			horaInicio: string;
			duracionMinutos: number;
			cantidadClases: number;
			anio: number;
			cuatrimestre: Cuatrimestre;
			precioCuota: number;
			precioMatricula: number;
		} }
	| { ok: false; tipo: 'faltan_datos'; faltantes: string[] };

@Injectable()
export class AdministrarCursosService {
	constructor(
		private readonly repository: CursoRepository,
	) { }

	private validarDatos(dto: CrearCursoDto): ValidacionDatos {
		const faltantes: string[] = [];

		const nombre = (dto.nombre ?? '').trim();
		if (!nombre) faltantes.push('Nombre del curso');

		const instructoraId = Number(dto.instructoraId);
		if (!Number.isInteger(instructoraId) || instructoraId <= 0) {
			faltantes.push('Instructora');
		}

		const dias = normalizarDias(dto.dias);
		if (dias.length === 0) faltantes.push('Días de clase');

		const horaInicio = (dto.horaInicio ?? '').trim();
		if (!/^\d{2}:\d{2}$/.test(horaInicio)) faltantes.push('Horario de inicio');

		const duracionMinutos = Number(dto.duracionMinutos);
		if (!Number.isInteger(duracionMinutos) || duracionMinutos <= 0) faltantes.push('Duración de la clase');

		const cantidadClases = Number(dto.cantidadClases);
		if (!Number.isInteger(cantidadClases) || cantidadClases <= 0) faltantes.push('Cantidad de clases');

		const anio = Number(dto.anio);
		if (!Number.isInteger(anio) || anio < 2000) faltantes.push('Año');

		const cuatrimestre = Number(dto.cuatrimestre);
		if (!esCuatrimestre(cuatrimestre)) faltantes.push('Cuatrimestre');

		const precioCuota = leerPrecio(dto.precioCuota);
		if (precioCuota === undefined) faltantes.push('Precio de cuota');

		const precioMatricula = leerPrecio(dto.precioMatricula);
		if (precioMatricula === undefined) faltantes.push('Precio de matrícula');

		if (faltantes.length > 0 || precioCuota === undefined || precioMatricula === undefined) {
			return { ok: false, tipo: 'faltan_datos', faltantes };
		}

		const cuatrimestreValido = cuatrimestre as Cuatrimestre;
		return {
			ok: true,
			datos: {
				nombre,
				instructoraId,
				dias,
				horaInicio,
				duracionMinutos,
				cantidadClases,
				anio,
				cuatrimestre: cuatrimestreValido,
				precioCuota,
				precioMatricula,
			},
		};
	}

	async getInstructoras() {
		return this.repository.getInstructoras();
	}

	async crear(dto: CrearCursoDto): Promise<ResultadoCrearCurso> {
		const validacion = this.validarDatos(dto);
		if (!validacion.ok) {
			return validacion;
		}

		if (!(await this.repository.existeInstructora(validacion.datos.instructoraId))) {
			return { ok: false, tipo: 'faltan_datos', faltantes: ['Instructora'] };
		}

		const { nombre, anio, cuatrimestre, ...datosPlanificacion } = validacion.datos;
		const { fechaInicio, fechaFin } = calcularFechasCuatrimestre(anio, cuatrimestre);
		const cuotas = crearCuotasDelCuatrimestre(anio, cuatrimestre);
		const resultado = await this.repository.crearCursoCompleto({
			...datosPlanificacion,
			nombre,
			fechaInicio,
			fechaFin,
			cuotas,
			rol: 'instructor',
		});

		if (!resultado.creado) {
			return {
				ok: false,
				tipo: 'curso_existente',
				mensaje: `El curso "${nombre}" ya existe en el ${etiquetaCuatrimestre(cuatrimestre)} cuatrimestre de ${anio}.`,
			};
		}

		return { ok: true as const, planificacionId: resultado.planificacionId };
	}

	async listar(): Promise<CursoListado[]> {
		const cursos = await this.repository.listarCursos();
		return cursos.map((curso) => ({
			id: curso.id,
			nombre: curso.nombre,
			cuatrimestre: `${etiquetaCuatrimestre(cuatrimestreDeFecha(curso.fechaInicio))} cuatrimestre`,
			anio: curso.fechaInicio.getFullYear(),
			instructora: curso.instructoraApellido ? `${curso.instructoraApellido}, ${curso.instructoraNombre}` : null,
			cantidadClases: curso.cantidadClases,
			horarios: curso.horarios.map((horario) => {
				const dia = DIAS_SEMANA.find((d) => d.valor === horario.diaSemana);
				return `${dia?.etiqueta ?? horario.diaSemana} ${horario.horaInicio.slice(0, 5)} (${horario.duracionMinutos} min)`;
			}),
		}));
	}
}