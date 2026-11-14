import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import {
  alumnoTable,
  cuotaTable,
  cursoTable,
  inscripcionAlumnoTable,
  pagoCuotaAlumnoTable,
  planificacionCursoTable,
} from '../../core/persistence/schema.js';

export interface CursoDisponibleRow {
  id: number;
  nombre: string;
  fechaInicio: Date;
}

export interface InscripcionListadoRow {
  id: number;
  apellido: string;
  nombre: string;
  curso: string;
  creadoEn: Date;
}

export interface AlumnoBusquedaRow {
  id: number;
  apellido: string;
  nombre: string;
  dni: string;
}

export interface AlumnoBaseRow {
  id: number;
  apellido: string;
  nombre: string;
}

export interface CuotaAdeudadaRow {
  curso: string;
  mes: Date;
  pendiente: number;
}

@Injectable()
export class InscribirAlumnoRepository {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) { }

  async getCursosDisponibles(): Promise<CursoDisponibleRow[]> {
    return this.db.select({
      id: planificacionCursoTable.id,
      nombre: cursoTable.nombre,
      fechaInicio: planificacionCursoTable.fechaInicio,
    })
      .from(planificacionCursoTable)
      .innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
      .where(and(isNull(planificacionCursoTable.borradoEn), gte(planificacionCursoTable.fechaFin, new Date())))
      .orderBy(desc(planificacionCursoTable.fechaInicio), asc(cursoTable.nombre));
  }

  async listarInscripciones(): Promise<InscripcionListadoRow[]> {
    return this.db.select({
      id: inscripcionAlumnoTable.id,
      apellido: alumnoTable.apellido,
      nombre: alumnoTable.nombre,
      curso: cursoTable.nombre,
      creadoEn: inscripcionAlumnoTable.creadoEn,
    })
      .from(inscripcionAlumnoTable)
      .innerJoin(alumnoTable, eq(alumnoTable.id, inscripcionAlumnoTable.alumnoId))
      .innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId))
      .innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
      .where(and(
        isNull(inscripcionAlumnoTable.borradoEn),
        isNull(alumnoTable.borradoEn),
        isNull(planificacionCursoTable.borradoEn),
        isNull(cursoTable.borradoEn),
      ))
      .orderBy(desc(inscripcionAlumnoTable.creadoEn))
      .limit(10);
  }

  async buscarAlumnos(texto: string): Promise<AlumnoBusquedaRow[]> {
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

  async getAlumno(id: number): Promise<AlumnoBaseRow | undefined> {
    const [alumno] = await this.db.select({ id: alumnoTable.id, apellido: alumnoTable.apellido, nombre: alumnoTable.nombre })
      .from(alumnoTable)
      .where(and(eq(alumnoTable.id, id), isNull(alumnoTable.borradoEn)))
      .limit(1);
    return alumno;
  }

  async getPlanificacionDisponible(planificacionId: number) {
    const [planificacion] = await this.db.select({
      id: planificacionCursoTable.id,
      fechaInicio: planificacionCursoTable.fechaInicio,
    })
      .from(planificacionCursoTable)
      .where(and(
        eq(planificacionCursoTable.id, planificacionId),
        isNull(planificacionCursoTable.borradoEn),
        gte(planificacionCursoTable.fechaFin, new Date()),
      ))
      .limit(1);

    return planificacion;
  }

  async crearInscripcion(alumnoId: number, planificacionId: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(inscripcionAlumnoTable).values({
        alumnoId,
        planificacionCursoId: planificacionId,
      });
    });
  }

  async getCuotasAdeudadas(alumnoId: number, fechaCorte: Date): Promise<CuotaAdeudadaRow[]> {
    const filas = await this.db.select({
      curso: cursoTable.nombre,
      mes: cuotaTable.mes,
      pendiente: sql<number>`${planificacionCursoTable.precioCuota} - coalesce(sum(${pagoCuotaAlumnoTable.monto}), 0)`,
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
        lte(cuotaTable.mes, fechaCorte),
      ))
      .groupBy(inscripcionAlumnoTable.id, cuotaTable.id, cuotaTable.mes, cursoTable.nombre, planificacionCursoTable.precioCuota)
      .having(sql`coalesce(sum(${pagoCuotaAlumnoTable.monto}), 0) < ${planificacionCursoTable.precioCuota}`)
      .orderBy(asc(cuotaTable.mes));

    return filas.map((f) => ({
      curso: f.curso,
      mes: f.mes,
      pendiente: Number(f.pendiente),
    }));
  }

  async getCursoEnCurso(alumnoId: number): Promise<string | undefined> {
    const [fila] = await this.db.select({ curso: cursoTable.nombre })
      .from(inscripcionAlumnoTable)
      .innerJoin(planificacionCursoTable, eq(planificacionCursoTable.id, inscripcionAlumnoTable.planificacionCursoId))
      .innerJoin(cursoTable, eq(cursoTable.id, planificacionCursoTable.cursoId))
      .where(and(
        eq(inscripcionAlumnoTable.alumnoId, alumnoId),
        isNull(inscripcionAlumnoTable.borradoEn),
        gte(planificacionCursoTable.fechaFin, new Date()),
      ))
      .limit(1);

    return fila?.curso;
  }
}
