import { pgTable, integer, varchar, timestamp, decimal , date, pgEnum} from "drizzle-orm/pg-core"

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 100;
const MAX_PHONE_LENGTH = 10;
const MAX_DOMICILIO_LENGTH = 200;
const DIGITOS_PRECISION_NUMEROS_REALES = 11;
const DIGITOS_DECIMALES_NUMEROS_REALES = 2;

//https://orm.drizzle.team/docs/column-types#timestamp
const timestampsSchema = {
	creadoEn: timestamp({ mode: "date", withTimezone: true }).defaultNow().notNull(),
	actualizadoEn: timestamp({ mode: "date", withTimezone: true }),
	borradoEn: timestamp({ mode: "date", withTimezone: true }),
}

//combinamos los tipos integer y identity para las claves primarias
//https://supabase.com/blog/choosing-a-postgres-primary-key#integerbiginteger-again
export const alumnoSchema = pgTable('alumno', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	fechaNacimiento:timestamp({ mode: "date", withTimezone: true }).notNull(),
	nombre: varchar({ length: MAX_NAME_LENGTH }).notNull(),
	apellido: varchar({ length: MAX_NAME_LENGTH }).notNull(),
	email: varchar({ length: MAX_EMAIL_LENGTH }).notNull(),
	telefono: varchar({ length: MAX_PHONE_LENGTH }).notNull(),
	domicilio: varchar({ length: MAX_DOMICILIO_LENGTH }).notNull(),
	...timestampsSchema
});

//https://orm.drizzle.team/docs/column-types#enum
export const nivelEnum = pgEnum("nivel",["a1","a2","b1","b2","b3",]);

export const cursoSchema = pgTable("curso", {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	nombre: varchar({ length: MAX_NAME_LENGTH }).notNull(),
	nivel: nivelEnum(),
	...timestampsSchema
});

export const planificacionCursoSchema = pgTable('planificacion_curso', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	precioCuota: decimal({ mode: "number", precision: DIGITOS_PRECISION_NUMEROS_REALES, scale: DIGITOS_DECIMALES_NUMEROS_REALES }).notNull(),
	fechaInicio: timestamp({ mode: "date", withTimezone: true }).notNull(),
	fechaFin: timestamp({ mode: "date", withTimezone: true }).notNull(),
	...timestampsSchema
});

export const inscripcionAlumnoSchema = pgTable('inscripcion_alumno', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	alumnoId: integer().notNull().references(() => alumnoSchema.id),
	planificacionCursoId: integer().notNull().references(() => planificacionCursoSchema.id),
	...timestampsSchema
});

export const cuotaSchema = pgTable('cuota', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	mes: date({mode:"date"}).notNull(),
	planificacionCursoId: integer().notNull().references(() => planificacionCursoSchema.id),
	...timestampsSchema
});

export const pagoCuotaAlumnoSchema = pgTable('pago_cuota_alumno', {
	id: integer().generatedAlwaysAsIdentity().primaryKey(),
	monto: decimal({ mode: "number", precision: DIGITOS_PRECISION_NUMEROS_REALES, scale: DIGITOS_DECIMALES_NUMEROS_REALES }).notNull(),
	...timestampsSchema
})



