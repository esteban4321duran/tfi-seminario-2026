import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import {
  DIAS_SEMANA,
  type DiaSemana,
} from '../domain/curso.domain.js';
import {
  asignacionCursoTable,
  cuotaTable,
  cursoTable,
  empleadoTable,
  horarioCursoTable,
  matriculaTable,
  planificacionCursoTable,
} from '../../core/persistence/schema.js';

export interface CursoListadoPersistido {
  id: number;
  nombre: string;
  fechaInicio: Date;
  instructoraNombre: string | null;
  instructoraApellido: string | null;
  cantidadClases: number;
  horarios: Array<{
    diaSemana: DiaSemana;
    horaInicio: string;
    duracionMinutos: number;
  }>;
}

type ResultadoCreacion =
  | { creado: true; planificacionId: number }
  | { creado: false; motivo: 'planificacion_duplicada' };

@Injectable()
export class CursoRepository {
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

  async existeInstructora(id: number): Promise<boolean> {
    const [instructora] = await this.db.select({ id: empleadoTable.id })
      .from(empleadoTable)
      .where(and(eq(empleadoTable.id, id), isNull(empleadoTable.borradoEn)))
      .limit(1);

    return Boolean(instructora);
  }

  private async existePlanificacionDuplicada(
    db: Pick<NodePgDatabase, 'select'>,
    cursoId: number,
    desde: Date,
    hasta: Date,
  ): Promise<boolean> {
    const [duplicado] = await db.select({ id: planificacionCursoTable.id })
      .from(planificacionCursoTable)
      .where(and(
        eq(planificacionCursoTable.cursoId, cursoId),
        isNull(planificacionCursoTable.borradoEn),
        gte(planificacionCursoTable.fechaInicio, desde),
        lte(planificacionCursoTable.fechaInicio, hasta),
      ))
      .limit(1);

    return Boolean(duplicado);
  }

  async crearCursoCompleto(params: {
    nombre: string;
    instructoraId: number;
    dias: readonly ((typeof DIAS_SEMANA)[number]['valor'])[];
    horaInicio: string;
    duracionMinutos: number;
    cantidadClases: number;
    precioCuota: number;
    precioMatricula: number;
    fechaInicio: Date;
    fechaFin: Date;
    cuotas: Array<{ mes: Date }>;
    rol: 'instructor';
  }): Promise<ResultadoCreacion> {
    const { nombre, instructoraId, dias, horaInicio, duracionMinutos, cantidadClases, precioCuota, precioMatricula, fechaInicio, fechaFin, cuotas, rol } = params;

    return this.db.transaction(async (tx) => {
      const [cursoExistente] = await tx.select({ id: cursoTable.id })
        .from(cursoTable)
        .where(and(sql`lower(${cursoTable.nombre}) = lower(${nombre})`, isNull(cursoTable.borradoEn)))
        .limit(1);

      if (cursoExistente && await this.existePlanificacionDuplicada(tx, cursoExistente.id, fechaInicio, fechaFin)) {
        return { creado: false, motivo: 'planificacion_duplicada' };
      }

      let cursoId = cursoExistente?.id;
      if (cursoId === undefined) {
        const [nuevo] = await tx.insert(cursoTable).values({ nombre }).returning({ id: cursoTable.id });
        cursoId = nuevo.id;
      }

      const [planificacion] = await tx.insert(planificacionCursoTable)
        .values({
          cursoId,
          fechaInicio,
          fechaFin,
          cantidadClases,
          precioCuota,
          precioMatricula,
        })
        .returning({ id: planificacionCursoTable.id });

      await tx.insert(asignacionCursoTable).values({
        planificacionCursoId: planificacion.id,
        empleadoId: instructoraId,
        rol,
      });

      await tx.insert(horarioCursoTable).values(
        dias.map((diaSemana) => ({
          planificacionCursoId: planificacion.id,
          diaSemana,
          horaInicio,
          duracionMinutos,
        })),
      );

      await tx.insert(matriculaTable).values({ planificacionCursoId: planificacion.id });

      await tx.insert(cuotaTable).values(
        cuotas.map(({ mes }) => ({ planificacionCursoId: planificacion.id, mes })),
      );

      return { creado: true, planificacionId: planificacion.id };
    });
  }

  async listarCursos(): Promise<CursoListadoPersistido[]> {
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
      fechaInicio: f.fechaInicio,
      instructoraNombre: f.instructoraNombre,
      instructoraApellido: f.instructoraApellido,
      cantidadClases: f.cantidadClases,
      horarios: horarios
        .filter((h) => h.planificacionCursoId === f.id)
        .sort((a, b) => orden.indexOf(a.diaSemana) - orden.indexOf(b.diaSemana))
        .map((h) => ({
          diaSemana: DIAS_SEMANA.find((d) => d.valor === h.diaSemana)!.valor as DiaSemana,
          horaInicio: h.horaInicio,
          duracionMinutos: h.duracionMinutos,
        })),
    }));
  }
}