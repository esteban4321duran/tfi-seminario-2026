CREATE INDEX "idx_inscripcion_alumno_alumno_id" ON "inscripcion_alumno" ("alumno_id");--> statement-breakpoint
CREATE INDEX "idx_inscripcion_alumno_planificacion_curso_id" ON "inscripcion_alumno" ("planificacion_curso_id");--> statement-breakpoint
CREATE INDEX "idx_cuota_planificacion_curso_id" ON "cuota" ("planificacion_curso_id");--> statement-breakpoint
CREATE INDEX "idx_pago_cuota_alumno_inscripcion_alumno_id" ON "pago_cuota_alumno" ("inscripcion_alumno_id");--> statement-breakpoint
CREATE INDEX "idx_pago_cuota_alumno_cuota_id" ON "pago_cuota_alumno" ("cuota_id");
