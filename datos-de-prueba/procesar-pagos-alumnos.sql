insert into alumno (dni, fecha_nacimiento, nombre, apellido, email, telefono, domicilio) values
('40360005','2000-03-12 12:00:00 America/Argentina/Buenos_Aires','Martina','Hernandez','martinah@gmail.com','321987456','suipacha 3000'),
('41562008','2001-03-11 12:00:00 America/Argentina/Buenos_Aires','Lucia','Gomez','lugomez@gmail.com','381456987','san martin 1265'),
('41000009','2001-01-20 12:00:00 America/Argentina/Buenos_Aires','Matias','Lopez','matiaslopez@gmail.com','381661579','san luis 239'),
('40000014', '2000-06-14 12:00:00 America/Argentina/Buenos_Aires', 'Fabricio', 'Fravega', 'fabricio.fravega@gmail.com', '3815759761', 'calle F Manzana 6'),
('45263496', '2000-09-14 12:00:00 America/Argentina/Buenos_Aires', 'Maria', 'Concha', 'Mari.sisi@gmail.com', '3816582316', 'Unamuno 2026'),
('40000015', '2000-01-15 12:00:00 America/Argentina/Buenos_Aires', 'Gabriela', 'González', 'grabiela.gonzalez@gmail.com', '3816582316', 'Guerra de independencia 1015');

insert into curso (nombre, nivel) values 
('Nivel A1','a1'),
('Nivel A2','a2'),
('Nivel B1','b1'),
('Nivel B2','b2');

insert into planificacion_curso (precio_cuota, fecha_inicio, fecha_fin, curso_id) values
 (20000.00,'2025-03-01 09:00:00 America/Argentina/Buenos_Aires', '2025-06-28 12:00:00 America/Argentina/Buenos_Aires', 1),
 (20000.00,'2025-03-01 09:00:00 America/Argentina/Buenos_Aires', '2025-06-28 12:00:00 America/Argentina/Buenos_Aires', 2),
 (20000.00,'2025-03-01 09:00:00 America/Argentina/Buenos_Aires', '2025-06-28 12:00:00 America/Argentina/Buenos_Aires', 3),
 (20000.00,'2025-03-01 09:00:00 America/Argentina/Buenos_Aires', '2025-06-28 12:00:00 America/Argentina/Buenos_Aires', 4),

 (20000.00,'2025-08-09 09:00:00 America/Argentina/Buenos_Aires', '2025-11-29 12:00:00 America/Argentina/Buenos_Aires', 1),
 (20000.00,'2025-08-09 09:00:00 America/Argentina/Buenos_Aires', '2025-11-29 12:00:00 America/Argentina/Buenos_Aires', 2),
 (20000.00,'2025-08-09 09:00:00 America/Argentina/Buenos_Aires', '2025-11-29 12:00:00 America/Argentina/Buenos_Aires', 3),
 (20000.00,'2025-08-09 09:00:00 America/Argentina/Buenos_Aires', '2025-11-29 12:00:00 America/Argentina/Buenos_Aires', 4),

 (25000.00,'2026-03-07 09:00:00 America/Argentina/Buenos_Aires', '2025-06-27 12:00:00 America/Argentina/Buenos_Aires', 1),
 (25000.00,'2026-03-07 09:00:00 America/Argentina/Buenos_Aires', '2025-06-27 12:00:00 America/Argentina/Buenos_Aires', 2),
 (25000.00,'2026-03-07 09:00:00 America/Argentina/Buenos_Aires', '2025-06-27 12:00:00 America/Argentina/Buenos_Aires', 3),
 (25000.00,'2026-03-07 09:00:00 America/Argentina/Buenos_Aires', '2025-06-27 12:00:00 America/Argentina/Buenos_Aires', 4),

 (25000.00,'2025-08-08 09:00:00 America/Argentina/Buenos_Aires', '2025-11-28 12:00:00 America/Argentina/Buenos_Aires', 1),
 (25000.00,'2025-08-08 09:00:00 America/Argentina/Buenos_Aires', '2025-11-28 12:00:00 America/Argentina/Buenos_Aires', 2),
 (25000.00,'2025-08-08 09:00:00 America/Argentina/Buenos_Aires', '2025-11-28 12:00:00 America/Argentina/Buenos_Aires', 3),
 (25000.00,'2025-08-08 09:00:00 America/Argentina/Buenos_Aires', '2025-11-28 12:00:00 America/Argentina/Buenos_Aires', 4);

insert into inscripcion_alumno (alumno_id, planificacion_curso_id) values 
 -- alumno id 1
(1, 1),
(1, 6),
(1, 11),
(1, 16),

 -- alumno id 2
(2, 4),
(2, 8),

 -- alumno id 3
(3, 7),
(3, 12),

 -- alumno id 4
(4, 2),
(4, 7),

 -- alumno id 5
(5, 1),
(5, 14),

 -- alumno id 6
(6, 2),
(6, 15);


insert into cuota (mes, planificacion_curso_id) values
 -- 4 cuotas por curso, primer cuatrimestre 2025
('2025-03-01', 1),
('2025-03-01', 2),
('2025-03-01', 3),
('2025-03-01', 4),

('2025-04-01', 1),
('2025-04-01', 2),
('2025-04-01', 3),
('2025-04-01', 4),

('2025-05-01', 1),
('2025-05-01', 2),
('2025-05-01', 3),
('2025-05-01', 4),

('2025-06-01', 1),
('2025-06-01', 2),
('2025-06-01', 3),
('2025-06-01', 4),

 -- 4 cuotas por curso, segundo cuatrimestre 2025
('2025-08-01', 5),
('2025-08-01', 6),
('2025-08-01', 7),
('2025-08-01', 8),

('2025-09-01', 5),
('2025-09-01', 6),
('2025-09-01', 7),
('2025-09-01', 8),

('2025-10-01', 5),
('2025-10-01', 6),
('2025-10-01', 7),
('2025-10-01', 8),

('2025-11-01', 5),
('2025-11-01', 6),
('2025-11-01', 7),
('2025-11-01', 8),
-- 4 cuotas por curso, primer cuatrimestre 2026
('2026-03-01', 9),
('2026-03-01', 10),
('2026-03-01', 11),
('2026-03-01', 12),

('2026-04-01', 9),
('2026-04-01', 10),
('2026-04-01', 11),
('2026-04-01', 12),

('2026-05-01', 9),
('2026-05-01', 10),
('2026-05-01', 11),
('2026-05-01', 12),

('2026-06-01', 9),
('2026-06-01', 10),
('2026-06-01', 11),
('2026-06-01', 12),

 -- 4 cuotas por curso, segundo cuatrimestre 2026
('2026-08-01', 13),
('2026-08-01', 14),
('2026-08-01', 15),
('2026-08-01', 16),

('2026-09-01', 13),
('2026-09-01', 14),
('2026-09-01', 15),
('2026-09-01', 16),

('2026-10-01', 13),
('2026-10-01', 14),
('2026-10-01', 15),
('2026-10-01', 16),

('2026-11-01', 13),
('2026-11-01', 14),
('2026-11-01', 15),
('2026-11-01', 16);

-- export const pagoCuotaAlumnoTable = pgTable('pago_cuota_alumno', {
-- 	id: integer().generatedAlwaysAsIdentity().primaryKey(),
-- 	monto: decimal({ mode: "number", precision: DIGITOS_PRECISION_NUMEROS_REALES, scale: DIGITOS_DECIMALES_NUMEROS_REALES }).notNull(),
-- 	inscripcionAlumnoId: integer().notNull().references(()=>inscripcionAlumnoTable.id),
-- 	cuotaId: integer().notNull().references(()=>cuotaTable.id),
-- 	...timestampsSchema
-- })

insert into pago_cuota_alumno (monto, inscripcion_alumno_id, cuota_id) values 
-- pagos de cuotas de las diferentes inscripciones del alumno id 1
-- a1 primer cuat 2025
(20000.00, 1, 1),
(20000.00, 1, 5),
(20000.00, 1, 9),
(20000.00, 1, 13),

-- a2 segundo cuat 2025
(20000.00, 2, 18),
(20000.00, 2, 22),
(20000.00, 2, 26),
(20000.00, 2, 30),

-- b1 primer cuat 2026
(25000.00, 3, 35),
(25000.00, 3, 39),
(25000.00, 3, 43),
(25000.00, 3, 47),

-- b2 segundo cuat 2026
(25000.00, 4, 52),
(25000.00, 4, 56),
(25000.00, 4, 60),
(5000.00, 4, 64),

-- pagos de cuotas de las diferentes inscripciones del alumno id 2
-- b2 primer cuat 2025
(20000.00, 5, 4), 
(20000.00, 5, 8), 
(20000.00, 5, 12), 
(20000.00, 5, 16), 

-- b2 segundo cuat 2025
(20000.00, 6, 20), 
(20000.00, 6, 24), 
(10000.00, 6, 28), 
(5000.00, 6, 28), 
(5000.00, 6, 28), 

-- pagos de cuotas de las diferentes inscripciones del alumno id 3
-- b1 segundo cuat 2025
(20000.00, 7, 19),
(20000.00, 7, 23),
(20000.00, 7, 27),
(20000.00, 7, 31),

-- b2 primer cuat 2026
(25000.00, 8, 36),
(25000.00, 8, 40),
(25000.00, 8, 44),
(25000.00, 8, 48),

-- pagos de cuotas de las diferentes inscripciones del alumno id 4
-- a2 primer cuat 2025
(20000.00, 9, 2),
(20000.00, 9, 6),
(20000.00, 9, 10),
(20000.00, 9, 14),

-- b1 segundo cuat 2025
(20000.00, 10, 19),
(20000.00, 10, 23),
(10000.00, 10, 27),
(10000.00, 10, 27),
(12500.00, 10, 31),

-- pagos de cuotas de las diferentes inscripciones del alumno id 5
-- a1 primer cuatrimestre 2025
(20000.00, 11, 1),
(20000.00, 11, 5),
(20000.00, 11, 9),
(20000.00, 11, 13),

 -- a2 primer cuatrimestre 2026
(25000.00, 12, 33),
(25000.00, 12, 37),
(25000.00, 12, 41),
(10000.00, 12, 45),

-- pagos de cuotas de las diferentes inscripciones del alumno id 6
-- a2 primer cuatrimestre 2025
(20000.00, 13, 2),
(20000.00, 13, 6),
(20000.00, 13, 10),
(20000.00, 13, 14),

-- b1 segundo cuatrimestre 2026
(25000.00, 14, 51),
(25000.00, 14, 55);
