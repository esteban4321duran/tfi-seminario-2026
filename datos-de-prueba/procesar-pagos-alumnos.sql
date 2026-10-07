insert into alumno (dni, fechaNacimiento, nombre, apellido, email, telefono, domicilio) values
('40360005','2000-03-12 12:00:00 America/Argentina/Buenos_Aires','Martina','Hernandez','martinah@gmail.com','321987456','suipacha 3000'),
('41562008','2001-03-11 12:00:00 America/Argentina/Buenos_Aires','Lucia','Gomez','lugomez@gmail.com','381456987','san martin 1265'),
('41000009','2001-01-20 12:00:00 America/Argentina/Buenos_Aires','Matias','Lopez','matiaslopez@gmail.com','381661579','san luis 239'),
('40000014', '2000-06-14 12:00:00 America/Argentina/Buenos_Aires', 'Fabricio', 'Fravega', 'fabricio.fravega@gmail.com', '3815759761', 'calle F Manzana 6'),
('45263496', '2000-09-14 12:00:00 America/Argentina/Buenos_Aires', 'Maria', 'Concha', 'Mari.sisi@gmail.com', '3816582316', 'Unamuno 2026');

insert into curso (nombre, nivel) values 
('Nivel A1','a1'),
('Nivel A2','a2'),
('Nivel B1','b1'),
('Nivel B2','b2');

insert into planificacionCursoTable (precioCuota, fechaInicio, fechaFin, cursoId) values
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

insert into inscripcionAlumnoTable (alumnoId, planificacionCursoId) values 
(1, 1),
(1, 6),
(1, 11),
(1, 16),
(2, 4),
(2, 8),
(3, 7),
(3, 12),
(4, 2),
(4, 7),
(5, 3),
(5, 12);

insert into cuota (mes, planificacionCursoId) values
 -- 4 cuotas por curso, primer cuatrimestre
('2026-08-01', 1),
('2026-09-01', 1),
('2026-10-01', 1),
('2026-11-01', 1),
('2026-08-01', 2),
('2026-09-01', 2),
('2026-10-01', 2),
('2026-11-01', 2),
('2026-08-01', 3),
('2026-09-01', 3),
('2026-10-01', 3),
('2026-11-01', 3),
('2026-08-01', 4),
('2026-09-01', 4),
('2026-10-01', 4),
('2026-11-01', 4),

-- export const pagoCuotaAlumnoTable = pgTable('pago_cuota_alumno', {
-- 	id: integer().generatedAlwaysAsIdentity().primaryKey(),
-- 	monto: decimal({ mode: "number", precision: DIGITOS_PRECISION_NUMEROS_REALES, scale: DIGITOS_DECIMALES_NUMEROS_REALES }).notNull(),
-- 	...timestampsSchema
-- })
