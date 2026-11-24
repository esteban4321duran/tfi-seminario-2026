import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, desc, ilike, isNull, or, sql } from 'drizzle-orm';
import { alumnoTable } from '../../core/persistence/schema.js';

const LIMITE_ALUMNOS_POR_CONSULTA = 10;
const INDICE_DNI_ACTIVO = 'alumno_dni_activo_unique_idx';

export interface AlumnoListadoRow {
	id: number;
	apellido: string;
	nombre: string;
	dni: string;
	email: string;
	telefono: string;
	creadoEn: Date;
}

type DatosNuevoAlumno = {
	nombre: string;
	apellido: string;
	dni: string;
	fechaNacimiento: Date;
	email: string;
	telefono: string;
	domicilio: string;
};

export type ResultadoCreacionAlumno =
	| { creado: true; id: number }
	| { creado: false; motivo: 'dni_duplicado' };

function escaparComodines(texto: string): string {
	return texto.replace(/[\\%_]/g, '\\$&');
}

function esDniDuplicado(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) return false;
	if ('code' in error && error.code === '23505') {
		return !('constraint' in error) || error.constraint === INDICE_DNI_ACTIVO;
	}
	return 'cause' in error && esDniDuplicado(error.cause);
}

@Injectable()
export class AlumnoRepository {
	constructor(
		@InjectDrizzle()
		private readonly db: NodePgDatabase,
	) { }

	async listarUltimos(): Promise<AlumnoListadoRow[]> {
		return this.db.select({
			id: alumnoTable.id,
			apellido: alumnoTable.apellido,
			nombre: alumnoTable.nombre,
			dni: alumnoTable.dni,
			email: alumnoTable.email,
			telefono: alumnoTable.telefono,
			creadoEn: alumnoTable.creadoEn,
		})
			.from(alumnoTable)
			.where(isNull(alumnoTable.borradoEn))
			.orderBy(desc(alumnoTable.creadoEn), desc(alumnoTable.id))
			.limit(LIMITE_ALUMNOS_POR_CONSULTA);
	}

	async buscar(texto: string): Promise<AlumnoListadoRow[]> {
		const patron = `%${escaparComodines(texto.trim())}%`;
		return this.db.select({
			id: alumnoTable.id,
			apellido: alumnoTable.apellido,
			nombre: alumnoTable.nombre,
			dni: alumnoTable.dni,
			email: alumnoTable.email,
			telefono: alumnoTable.telefono,
			creadoEn: alumnoTable.creadoEn,
		})
			.from(alumnoTable)
			.where(and(
				isNull(alumnoTable.borradoEn),
				or(
					ilike(alumnoTable.apellido, patron),
					ilike(alumnoTable.nombre, patron),
					ilike(sql`${alumnoTable.apellido} || ' ' || ${alumnoTable.nombre}`, patron),
					ilike(alumnoTable.dni, patron),
				),
			))
			.orderBy(desc(alumnoTable.creadoEn), desc(alumnoTable.id))
			.limit(LIMITE_ALUMNOS_POR_CONSULTA);
	}

	async crear(datos: DatosNuevoAlumno): Promise<ResultadoCreacionAlumno> {
		try {
			const [alumno] = await this.db.insert(alumnoTable).values({
				...datos,
			}).returning({ id: alumnoTable.id });
			return { creado: true, id: alumno.id };
		} catch (error) {
			if (esDniDuplicado(error)) return { creado: false, motivo: 'dni_duplicado' };
			throw error;
		}
	}
}
