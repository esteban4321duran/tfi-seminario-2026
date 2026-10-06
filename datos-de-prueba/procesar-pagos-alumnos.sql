-- export const alumnoTable = pgTable('alumno', {
-- 	id: integer().generatedAlwaysAsIdentity().primaryKey(),
-- 	fechaNacimiento:timestamp({ mode: "date", withTimezone: true }).notNull(),
-- 	nombre: varchar({ length: MAX_NAME_LENGTH }).notNull(),
-- 	apellido: varchar({ length: MAX_NAME_LENGTH }).notNull(),
-- 	email: varchar({ length: MAX_EMAIL_LENGTH }).notNull(),
-- 	telefono: varchar({ length: MAX_PHONE_LENGTH }).notNull(),
-- 	domicilio: varchar({ length: MAX_DOMICILIO_LENGTH }).notNull(),
-- 	...timestampsSchema
-- });

insert into alumno (dni, fechaNacimiento, nombre, apellido, email, telefono, domicilio) values
('40360005','2000-03-12 12:00:00 America/Argentina/Buenos_Aires','Martina','Hernandez','martinah@gmail.com','321987456','suipacha 3000'),
('41562008','2001-03-11 12:00:00 America/Argentina/Buenos_Aires','Lucia','Gomez','lugomez@gmail.com','381456987','san martin 1265'),
('41000009','2001-01-20 12:00:00 America/Argentina/Buenos_Aires','Matias','Lopez','matiaslopez@gmail.com','381661579','san luis 239'),
('40000014', '2000-06-14 12:00:00 America/Argentina/Buenos_Aires', 'Fabricio', 'Fravega', 'fabricio.fravega@gmail.com', '3815759761', 'calle F Manzana 6'),
('45263496', '2000-09-14 12:00:00 America/Argentina/Buenos_Aires', 'Maria', 'Concha', 'Mari.sisi@gmail.com', '3816582316', 'Unamuno 2026');



-- export const cursoTable = pgTable("curso", {
-- 	id: integer().generatedAlwaysAsIdentity().primaryKey(),
-- 	nombre: varchar({ length: MAX_NAME_LENGTH }).notNull(),
-- 	nivel: nivelEnum(),
-- 	...timestampsSchema
-- });

insert into curso (nombre, nivel) values 
('Nivel A1','a1'),
('Nivel A2','a2'),
('Nivel B1','b1'),
('Nivel B2','b2');


-- export const planificacionCursoTable = pgTable('planificacion_curso', {
-- 	id: integer().generatedAlwaysAsIdentity().primaryKey(),
-- 	precioCuota: decimal({ mode: "number", precision: DIGITOS_PRECISION_NUMEROS_REALES, scale: DIGITOS_DECIMALES_NUMEROS_REALES }).notNull(),
-- 	fechaInicio: timestamp({ mode: "date", withTimezone: true }).notNull(),
-- 	fechaFin: timestamp({ mode: "date", withTimezone: true }).notNull(),
-- 	...timestampsSchema
-- });

insert into planificacionCursoTable (precioCuota, fechaInicio, fechaFin, cursoId) values
 (25000.00,'2000-03-1 09:00:00 America/Argentina/Buenos_Aires', '2000-06-28 09:00:00 America/Argentina/Buenos_Aires', 1),


-- export const inscripcionAlumnoTable = pgTable('inscripcion_alumno', {
-- 	id: integer().generatedAlwaysAsIdentity().primaryKey(),
-- 	alumnoId: integer().notNull().references(() => alumnoTable.id),
-- 	planificacionCursoId: integer().notNull().references(() => planificacionCursoTable.id),
-- 	...timestampsSchema
-- });

insert into inscripcionAlumnoTable (alumnoId, planificacionCursoId) values 
(1, 1),
(1, 6),
(1, 11),
(1, 16),
(2, 4),
(2, 8),


-- export const cuotaTable = pgTable('cuota', {
-- 	id: integer().generatedAlwaysAsIdentity().primaryKey(),
-- 	mes: date({mode:"date"}).notNull(),
-- 	planificacionCursoId: integer().notNull().references(() => planificacionCursoTable.id),
-- 	...timestampsSchema
-- });

insert into cuota (mes, planificacionCursoId) values 
('2026-03-01', 1),
('2026-04-01', 1),
('2026-05-01', 1),
('2026-06-01', 1)

-- export const pagoCuotaAlumnoTable = pgTable('pago_cuota_alumno', {
-- 	id: integer().generatedAlwaysAsIdentity().primaryKey(),
-- 	monto: decimal({ mode: "number", precision: DIGITOS_PRECISION_NUMEROS_REALES, scale: DIGITOS_DECIMALES_NUMEROS_REALES }).notNull(),
-- 	...timestampsSchema
-- })
