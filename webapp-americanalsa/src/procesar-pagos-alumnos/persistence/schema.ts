import { pgTable, integer, varchar, timestamp, decimal, date, time, pgEnum } from "drizzle-orm/pg-core"

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 100;
const MAX_PHONE_LENGTH = 10;
const MAX_DOMICILIO_LENGTH = 200;
const MAX_DNI_LENGTH = 8;
const DIGITOS_PRECISION_NUMEROS_REALES = 11;
const DIGITOS_DECIMALES_NUMEROS_REALES = 2;

//https://orm.drizzle.team/docs/column-types#timestamp
const timestampsSchema = {
	creadoEn: timestamp('creado_en', { mode: "date", withTimezone: true }).defaultNow().notNull(),
	actualizadoEn: timestamp('actualizado_en', { mode: "date", withTimezone: true }),
	borradoEn: timestamp('borrado_en', { mode: "date", withTimezone: true }),
}

//combinamos los tipos integer y identity para las claves primarias
//https://supabase.com/blog/choosing-a-postgres-primary-key#integerbiginteger-again
export const alumnoTable = pgTable('alumno', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	fechaNacimiento: timestamp('fecha_nacimiento', { mode: "date", withTimezone: true }).notNull(),
	nombre: varchar({ length: MAX_NAME_LENGTH }).notNull(),
	apellido: varchar({ length: MAX_NAME_LENGTH }).notNull(),
	email: varchar({ length: MAX_EMAIL_LENGTH }).notNull(),
	telefono: varchar({ length: MAX_PHONE_LENGTH }).notNull(),
	domicilio: varchar({ length: MAX_DOMICILIO_LENGTH }).notNull(),
	dni: varchar({ length: MAX_DNI_LENGTH }).notNull(),
	...timestampsSchema,
});

//https://orm.drizzle.team/docs/column-types#enum
export const nivelEnum = pgEnum("nivel", ["a1", "a2", "b1", "b2", "b3",]);

export const cursoTable = pgTable("curso", {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	nombre: varchar({ length: MAX_NAME_LENGTH }).notNull(),
	nivel: nivelEnum(),
	...timestampsSchema
});

export const planificacionCursoTable = pgTable('planificacion_curso', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	precioCuota: decimal('precio_cuota', { mode: "number", precision: DIGITOS_PRECISION_NUMEROS_REALES, scale: DIGITOS_DECIMALES_NUMEROS_REALES }).notNull(),
	precioMatricula: decimal('precio_matricula', { mode: "number", precision: DIGITOS_PRECISION_NUMEROS_REALES, scale: DIGITOS_DECIMALES_NUMEROS_REALES }).notNull(),
	fechaInicio: timestamp('fecha_inicio', { mode: "date", withTimezone: true }).notNull(),
	fechaFin: timestamp('fecha_fin', { mode: "date", withTimezone: true }).notNull(),
	cantidadClases: integer('cantidad_clases').notNull().default(16),
	cursoId: integer('curso_id').notNull().references(() => cursoTable.id),
	...timestampsSchema
});

export const inscripcionAlumnoTable = pgTable('inscripcion_alumno', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	alumnoId: integer('alumno_id').notNull().references(() => alumnoTable.id),
	planificacionCursoId: integer('planificacion_curso_id').notNull().references(() => planificacionCursoTable.id),
	...timestampsSchema
});

export const cuotaTable = pgTable('cuota', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	mes: date({ mode: "date" }).notNull(),
	planificacionCursoId: integer('planificacion_curso_id').notNull().references(() => planificacionCursoTable.id),
	...timestampsSchema
});

export const pagoCuotaAlumnoTable = pgTable('pago_cuota_alumno', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	monto: decimal({ mode: "number", precision: DIGITOS_PRECISION_NUMEROS_REALES, scale: DIGITOS_DECIMALES_NUMEROS_REALES }).notNull(),
	inscripcionAlumnoId: integer('inscripcion_alumno_id').notNull().references(() => inscripcionAlumnoTable.id),
	cuotaId: integer('cuota_id').notNull().references(() => cuotaTable.id),
	...timestampsSchema
})

export const matriculaTable = pgTable('matricula', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	planificacionCursoId: integer('planificacion_curso_id').notNull().references(() => planificacionCursoTable.id),
	...timestampsSchema
});

export const pagoMatriculacionAlumnoTable = pgTable('pago_matriculacion_alumno', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	monto: decimal({ mode: "number", precision: DIGITOS_PRECISION_NUMEROS_REALES, scale: DIGITOS_DECIMALES_NUMEROS_REALES }).notNull(),
	inscripcionAlumnoId: integer('inscripcion_alumno_id').notNull().references(() => inscripcionAlumnoTable.id),
	matriculaId: integer('matricula_id').notNull().references(() => matriculaTable.id),
	...timestampsSchema
});

export const empleadoTable = pgTable('empleado', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	nombre: varchar({ length: MAX_NAME_LENGTH }).notNull(),
	apellido: varchar({ length: MAX_NAME_LENGTH }).notNull(),
	...timestampsSchema
});

export const rolAsignacionEnum = pgEnum('rol_asignacion', ['instructor', 'interprete', 'teatro']);

export const asignacionCursoTable = pgTable('asignacion_curso', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	planificacionCursoId: integer('planificacion_curso_id').notNull().references(() => planificacionCursoTable.id),
	empleadoId: integer('empleado_id').notNull().references(() => empleadoTable.id),
	rol: rolAsignacionEnum().notNull(),
	...timestampsSchema
});

export const diaSemanaEnum = pgEnum('dia_semana', ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']);

export const horarioCursoTable = pgTable('horario_curso', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	planificacionCursoId: integer('planificacion_curso_id').notNull().references(() => planificacionCursoTable.id),
	diaSemana: diaSemanaEnum('dia_semana').notNull(),
	horaInicio: time('hora_inicio').notNull(),
	duracionMinutos: integer('duracion_minutos').notNull(),
	...timestampsSchema
});

