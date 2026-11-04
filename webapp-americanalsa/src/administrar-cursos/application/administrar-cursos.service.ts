import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import {
	asignacionCursoTable, cuotaTable, cursoTable, empleadoTable, horarioCursoTable,
	matriculaTable, planificacionCursoTable,
} from '../../procesar-pagos-alumnos/persistence/schema.js';

export const DIAS_SEMANA = [
	{ valor: 'lunes', etiqueta: 'Lunes' },
	{ valor: 'martes', etiqueta: 'Martes' },
	{ valor: 'miercoles', etiqueta: 'Miércoles' },
	{ valor: 'jueves', etiqueta: 'Jueves' },
	{ valor: 'viernes', etiqueta: 'Viernes' },
	{ valor: 'sabado', etiqueta: 'Sábado' },
] as const;

type DiaSemana = (typeof DIAS_SEMANA)[number]['valor'];

// meses en base 0 (2 = marzo, 5 = junio, 7 = agosto, 10 = noviembre)
const CUATRIMESTRES: Record<number, { mesInicio: number; mesFin: number }> = {
	1: { mesInicio: 2, mesFin: 5 },
	2: { mesInicio: 7, mesFin: 10 },
};

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

export function normalizarDias(dias?: string | string[]): DiaSemana[] {
	const lista = dias === undefined ? [] : Array.isArray(dias) ? dias : [dias];
	return DIAS_SEMANA.map((d) => d.valor).filter((d) => lista.includes(d));
}

@Injectable()
export class AdministrarCursosService {
	constructor(
		@InjectDrizzle()
		private readonly db: NodePgDatabase,
	) { }

	async getInstructoras() {
		return this.db
			.select({ id: empleadoTable.id, nombre: empleadoTable.nombre, apellido: empleadoTable.apellido })
			.from(empleadoTable)
			.where(isNull(empleadoTable.borradoEn))
			.orderBy(asc(empleadoTable.apellido), asc(empleadoTable.nombre));
	}

	async crear(dto: CrearCursoDto): Promise<ResultadoCrearCurso> {
		const faltantes: string[] = [];

		const nombre = (dto.nombre ?? '').trim();
		if (!nombre) faltantes.push('Nombre del curso');

		const instructoraId = Number(dto.instructoraId);
		if (!Number.isInteger(instructoraId) || instructoraId <= 0) {
			faltantes.push('Instructora');
		} else {
			const [instructora] = await this.db.select({ id: empleadoTable.id }).from(empleadoTable)
				.where(and(eq(empleadoTable.id, instructoraId), isNull(empleadoTable.borradoEn))).limit(1);
			if (!instructora) faltantes.push('Instructora');
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
		if (!(cuatrimestre in CUATRIMESTRES)) faltantes.push('Cuatrimestre');

		if (faltantes.length > 0) {
			return { ok: false, tipo: 'faltan_datos', faltantes };
		}

		// ¿ya existe el curso en ese cuatrimestre?
		const [cursoExistente] = await this.db.select({ id: cursoTable.id }).from(cursoTable)
			.where(and(sql`lower(${cursoTable.nombre}) = lower(${nombre})`, isNull(cursoTable.borradoEn)))
			.limit(1);

		if (cursoExistente) {
			const [duplicado] = await this.db.select({ id: planificacionCursoTable.id }).from(planificacionCursoTable)
				.where(and(
					eq(planificacionCursoTable.cursoId, cursoExistente.id),
					isNull(planificacionCursoTable.borradoEn),
					sql`EXTRACT(YEAR FROM ${planificacionCursoTable.fechaInicio}) = ${anio}`,
					sql`(EXTRACT(MONTH FROM ${planificacionCursoTable.fechaInicio}) <= 6) = ${cuatrimestre === 1}`,
				)).limit(1);
			if (duplicado) {
				return {
					ok: false,
					tipo: 'curso_existente',
					mensaje: `El curso "${nombre}" ya existe en el ${cuatrimestre === 1 ? '1er' : '2do'} cuatrimestre de ${anio}.`,
				};
			}
		}

		const { mesInicio, mesFin } = CUATRIMESTRES[cuatrimestre];
		const fechaInicio = new Date(anio, mesInicio, 1, 9, 0);
		const fechaFin = new Date(anio, mesFin + 1, 0, 12, 0); // último día del mes de fin

		return await this.db.transaction(async (tx) => {
			let cursoId = cursoExistente?.id;
			if (cursoId === undefined) {
				const [nuevo] = await tx.insert(cursoTable).values({ nombre }).returning({ id: cursoTable.id });
				cursoId = nuevo.id;
			}

			// precios: los del formulario o, si no se cargaron, los de la última planificación
			const [ultima] = await tx
				.select({ precioCuota: planificacionCursoTable.precioCuota, precioMatricula: planificacionCursoTable.precioMatricula })
				.from(planificacionCursoTable)
				.where(isNull(planificacionCursoTable.borradoEn))
				.orderBy(desc(planificacionCursoTable.fechaInicio)).limit(1);
			const precioCuota = Number(dto.precioCuota) > 0 ? Number(dto.precioCuota) : (ultima?.precioCuota ?? 0);
			const precioMatricula = Number(dto.precioMatricula) > 0 ? Number(dto.precioMatricula) : (ultima?.precioMatricula ?? 0);

			const [planificacion] = await tx.insert(planificacionCursoTable)
				.values({ cursoId, fechaInicio, fechaFin, cantidadClases, precioCuota, precioMatricula })
				.returning({ id: planificacionCursoTable.id });

			await tx.insert(asignacionCursoTable).values({
				planificacionCursoId: planificacion.id, empleadoId: instructoraId, rol: 'instructor',
			});

			await tx.insert(horarioCursoTable).values(
				dias.map((diaSemana) => ({ planificacionCursoId: planificacion.id, diaSemana, horaInicio, duracionMinutos })),
			);

			await tx.insert(matriculaTable).values({ planificacionCursoId: planificacion.id });

			const cuotas = [];
			for (let m = mesInicio; m <= mesFin; m++) {
				cuotas.push({ planificacionCursoId: planificacion.id, mes: new Date(Date.UTC(anio, m, 1)) });
			}
			await tx.insert(cuotaTable).values(cuotas);

			return { ok: true as const, planificacionId: planificacion.id };
		});
	}

	async listar(): Promise<CursoListado[]> {
		const filas = await this.db.select({
			id: planificacionCursoTable.id,
			nombre: cursoTable.nombre,
			fechaInicio: planificacionCursoTable.fechaInicio,
			cantidadClases: planificacionCursoTable.cantidadClases,
			instructoraNombre: empleadoTable.nombre,
			instructoraApellido: empleadoTable.apellido,
		})
			.from(planificacionCursoTable)
			.innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.leftJoin(asignacionCursoTable, and(
				eq(asignacionCursoTable.planificacionCursoId, planificacionCursoTable.id),
				eq(asignacionCursoTable.rol, 'instructor'),
				isNull(asignacionCursoTable.borradoEn),
			))
			.leftJoin(empleadoTable, eq(empleadoTable.id, asignacionCursoTable.empleadoId))
			.where(isNull(planificacionCursoTable.borradoEn))
			.orderBy(desc(planificacionCursoTable.fechaInicio), asc(cursoTable.nombre));

		const ids = filas.map((f) => f.id);
		const horarios = ids.length === 0 ? [] : await this.db.select().from(horarioCursoTable)
			.where(and(inArray(horarioCursoTable.planificacionCursoId, ids), isNull(horarioCursoTable.borradoEn)));

		const orden = DIAS_SEMANA.map((d) => d.valor as string);
		return filas.map((f) => ({
			id: f.id,
			nombre: f.nombre,
			cuatrimestre: `${f.fechaInicio.getMonth() <= 5 ? '1er' : '2do'} cuatrimestre ${f.fechaInicio.getFullYear()}`,
			instructora: f.instructoraApellido ? `${f.instructoraApellido}, ${f.instructoraNombre}` : null,
			cantidadClases: f.cantidadClases,
			horarios: horarios
				.filter((h) => h.planificacionCursoId === f.id)
				.sort((a, b) => orden.indexOf(a.diaSemana) - orden.indexOf(b.diaSemana))
				.map((h) => `${DIAS_SEMANA.find((d) => d.valor === h.diaSemana)!.etiqueta} ${h.horaInicio.slice(0, 5)} (${h.duracionMinutos} min)`),
		}));
	}
}