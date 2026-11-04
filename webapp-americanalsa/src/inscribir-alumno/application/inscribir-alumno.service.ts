import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, desc, eq, gte, isNull, or, sql } from 'drizzle-orm';
import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import {
	alumnoTable, cuotaTable, cursoTable, inscripcionAlumnoTable,
	pagoCuotaAlumnoTable, planificacionCursoTable,
} from '../../procesar-pagos-alumnos/persistence/schema.js';
import { FormatoMonedaService } from '../../core/application/formato-moneda-service/formato-moneda-service.js';

export interface InscribirAlumnoDto {
	apellido?: string;
	nombre?: string;
	fechaNacimiento?: Date | string;
	email?: string;
	telefono?: string;
	domicilio?: string;
	dni?: string;
	planificacionCursoId?: string;
	alumnoId?: string; // viene informado cuando el secretario eligió un alumno existente
}

export interface CuotaAdeudada {
	curso: string;
	mes: string;
	pendiente: string;
}

export type ResultadoInscripcion =
	| { ok: true; alumnoId: number; anio: number; esNuevo: boolean }
	| { ok: false; tipo: 'faltan_datos'; faltantes: string[] }
	| { ok: false; tipo: 'curso_no_disponible'; mensaje: string }
	| { ok: false; tipo: 'alumno_ya_registrado'; mensaje: string }
	| { ok: false; tipo: 'adeuda_cuotas'; mensaje: string; cuotas: CuotaAdeudada[] }
	| { ok: false; tipo: 'ya_cursando'; mensaje: string };

@Injectable()
export class InscribirAlumnoService {
	constructor(
		@InjectDrizzle()
		private readonly db: NodePgDatabase,
		private readonly formatoMonedaService: FormatoMonedaService,
	) { }

	async getCursosDisponibles() {
		const filas = await this.db.select({
			id: planificacionCursoTable.id,
			nombre: cursoTable.nombre,
			fechaInicio: planificacionCursoTable.fechaInicio,
		})
			.from(planificacionCursoTable)
			.innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.where(and(isNull(planificacionCursoTable.borradoEn), gte(planificacionCursoTable.fechaFin, new Date())))
			.orderBy(desc(planificacionCursoTable.fechaInicio), asc(cursoTable.nombre));

		return filas.map((f) => ({
			id: f.id,
			etiqueta: `${f.nombre} - ${f.fechaInicio.getMonth() <= 5 ? '1er' : '2do'} cuatrimestre ${f.fechaInicio.getFullYear()}`,
		}));
	}

	async buscarAlumnos(texto: string) {
		const patron = `%${texto.trim()}%`;
		return this.db.select({ id: alumnoTable.id, apellido: alumnoTable.apellido, nombre: alumnoTable.nombre, dni: alumnoTable.dni })
			.from(alumnoTable)
			.where(and(
				isNull(alumnoTable.borradoEn),
				or(
					sql`${alumnoTable.apellido} ilike ${patron}`,
					sql`${alumnoTable.nombre} ilike ${patron}`,
					sql`(${alumnoTable.apellido} || ' ' || ${alumnoTable.nombre}) ilike ${patron}`,
				),
			))
			.orderBy(asc(alumnoTable.apellido), asc(alumnoTable.nombre))
			.limit(20);
	}

	async getAlumno(id: number) {
		const [alumno] = await this.db.select({ id: alumnoTable.id, apellido: alumnoTable.apellido, nombre: alumnoTable.nombre })
			.from(alumnoTable)
			.where(and(eq(alumnoTable.id, id), isNull(alumnoTable.borradoEn))).limit(1);
		return alumno;
	}

	async inscribir(dto: InscribirAlumnoDto): Promise<ResultadoInscripcion> {
		const apellido = (dto.apellido ?? '').trim();
		const nombre = (dto.nombre ?? '').trim();
		const planificacionId = Number(dto.planificacionCursoId);
		const alumnoIdElegido = dto.alumnoId ? Number(dto.alumnoId) : undefined;

		// Escenario 5: faltan datos obligatorios
		const faltantes: string[] = [];
		if (!apellido) faltantes.push('Apellido');
		if (!nombre) faltantes.push('Nombre');
		if (!Number.isInteger(planificacionId) || planificacionId <= 0) faltantes.push('Curso');
		if (faltantes.length > 0) return { ok: false, tipo: 'faltan_datos', faltantes };

		const [planificacion] = await this.db.select({ id: planificacionCursoTable.id, fechaInicio: planificacionCursoTable.fechaInicio })
			.from(planificacionCursoTable)
			.where(and(
				eq(planificacionCursoTable.id, planificacionId),
				isNull(planificacionCursoTable.borradoEn),
				gte(planificacionCursoTable.fechaFin, new Date()),
			)).limit(1);
		if (!planificacion) {
			return { ok: false, tipo: 'curso_no_disponible', mensaje: 'El curso elegido no existe o ya terminó.' };
		}

		let alumnoId = alumnoIdElegido;
		if (alumnoId === undefined) {
			// alumno nuevo: evitar duplicados por nombre
			const [existente] = await this.db.select({ id: alumnoTable.id }).from(alumnoTable)
				.where(and(
					isNull(alumnoTable.borradoEn),
					sql`lower(${alumnoTable.apellido}) = lower(${apellido})`,
					sql`lower(${alumnoTable.nombre}) = lower(${nombre})`,
				)).limit(1);
			if (existente) {
				return {
					ok: false,
					tipo: 'alumno_ya_registrado',
					mensaje: `Ya existe un alumno llamado ${apellido}, ${nombre}. Búsquelo y selecciónelo en lugar de cargarlo de nuevo.`,
				};
			}
		} else {
			if (!(await this.getAlumno(alumnoId))) {
				return { ok: false, tipo: 'faltan_datos', faltantes: ['Alumno (el alumno seleccionado no existe)'] };
			}

			// Escenario 3: adeuda cuotas
			const cuotas = await this.getCuotasAdeudadas(alumnoId);
			if (cuotas.length > 0) {
				return { ok: false, tipo: 'adeuda_cuotas', mensaje: 'El alumno adeuda cuotas, no se puede realizar la inscripción.', cuotas };
			}

			// Escenario 4: ya está cursando
			const cursando = await this.getCursoEnCurso(alumnoId);
			if (cursando) {
				return { ok: false, tipo: 'ya_cursando', mensaje: `El alumno ya está cursando "${cursando}", no se puede inscribir a otro curso.` };
			}
		}
		const resultado = await this.db.transaction(async (tx) => {
			let alumnoDefinitivo = alumnoId;

			if (alumnoDefinitivo === undefined) {
				const fechaNacimiento = dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : new Date('2000-01-01T00:00:00.000Z');
				const email = (dto.email ?? '').trim() || 'sin-email@local';
				const telefono = (dto.telefono ?? '').trim() || '0000000000';
				const domicilio = (dto.domicilio ?? '').trim() || 'Sin domicilio';
				const dni = (dto.dni ?? '').trim() || '00000000';

				const [nuevo] = await tx.insert(alumnoTable).values({
					fechaNacimiento,
					nombre,
					apellido,
					email,
					telefono,
					domicilio,
					dni,
				}).returning({ id: alumnoTable.id });

				alumnoDefinitivo = nuevo.id;
			}

			await tx.insert(inscripcionAlumnoTable).values({
				alumnoId: alumnoDefinitivo,
				planificacionCursoId: planificacionId,
			});

			return alumnoDefinitivo;
		});

		return { ok: true, alumnoId: resultado, anio: planificacion.fechaInicio.getFullYear(), esNuevo: alumnoIdElegido === undefined };
	}

	private async getCuotasAdeudadas(alumnoId: number): Promise<CuotaAdeudada[]> {
		const filas = await this.db.select({
			curso: cursoTable.nombre,
			mes: cuotaTable.mes,
			pendiente: sql<string>`${planificacionCursoTable.precioCuota} - coalesce(sum(${pagoCuotaAlumnoTable.monto}), 0)`,
		})
			.from(inscripcionAlumnoTable)
			.innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId))
			.innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.innerJoin(cuotaTable, eq(cuotaTable.planificacionCursoId, planificacionCursoTable.id))
			.leftJoin(pagoCuotaAlumnoTable, and(
				eq(pagoCuotaAlumnoTable.cuotaId, cuotaTable.id),
				eq(pagoCuotaAlumnoTable.inscripcionAlumnoId, inscripcionAlumnoTable.id),
				isNull(pagoCuotaAlumnoTable.borradoEn),
			))
			.where(and(
				eq(inscripcionAlumnoTable.alumnoId, alumnoId),
				isNull(inscripcionAlumnoTable.borradoEn),
				sql`${cuotaTable.mes} <= current_date`,
			))
			.groupBy(inscripcionAlumnoTable.id, cuotaTable.id, cuotaTable.mes, cursoTable.nombre, planificacionCursoTable.precioCuota)
			.having(sql`coalesce(sum(${pagoCuotaAlumnoTable.monto}), 0) < ${planificacionCursoTable.precioCuota}`)
			.orderBy(asc(cuotaTable.mes));

		const formatoMoneda = this.formatoMonedaService.getFormateador();
		return filas.map((f) => ({
			curso: f.curso,
			mes: dayjs(f.mes).locale('es').format('MMMM YYYY'),
			pendiente: formatoMoneda.format(Number(f.pendiente)),
		}));
	}

	private async getCursoEnCurso(alumnoId: number): Promise<string | undefined> {
		const [fila] = await this.db.select({ curso: cursoTable.nombre })
			.from(inscripcionAlumnoTable)
			.innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId))
			.innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
			.where(and(
				eq(inscripcionAlumnoTable.alumnoId, alumnoId),
				isNull(inscripcionAlumnoTable.borradoEn),
				gte(planificacionCursoTable.fechaFin, new Date()),
			)).limit(1);
		return fila?.curso;
	}
}