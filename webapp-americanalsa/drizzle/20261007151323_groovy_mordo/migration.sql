ALTER TABLE "alumno" ADD COLUMN "dni" varchar(8) NOT NULL;--> statement-breakpoint
ALTER TABLE "pago_cuota_alumno" ADD COLUMN "inscripcionAlumnoId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pago_cuota_alumno" ADD COLUMN "cuotaId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "planificacion_curso" ADD COLUMN "cursoId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pago_cuota_alumno" ADD CONSTRAINT "pago_cuota_alumno_mV0FxLUwGW8v_fkey" FOREIGN KEY ("inscripcionAlumnoId") REFERENCES "inscripcion_alumno"("id");--> statement-breakpoint
ALTER TABLE "pago_cuota_alumno" ADD CONSTRAINT "pago_cuota_alumno_cuotaId_cuota_id_fkey" FOREIGN KEY ("cuotaId") REFERENCES "cuota"("id");--> statement-breakpoint
ALTER TABLE "planificacion_curso" ADD CONSTRAINT "planificacion_curso_cursoId_curso_id_fkey" FOREIGN KEY ("cursoId") REFERENCES "curso"("id");