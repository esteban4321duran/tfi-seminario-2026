CREATE TABLE "matricula" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "matricula_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"planificacion_curso_id" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone,
	"borrado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pago_matriculacion_alumno" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pago_matriculacion_alumno_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"monto" numeric(11,2) NOT NULL,
	"inscripcion_alumno_id" integer NOT NULL,
	"matricula_id" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone,
	"borrado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "cuota" RENAME CONSTRAINT "cuota_planificacionCursoId_planificacion_curso_id_fkey" TO "cuota_planificacion_curso_id_planificacion_curso_id_fkey";--> statement-breakpoint
ALTER TABLE "inscripcion_alumno" RENAME CONSTRAINT "inscripcion_alumno_HxzR0li5FqS4_fkey" TO "inscripcion_alumno_alumno_id_alumno_id_fkey";--> statement-breakpoint
ALTER TABLE "inscripcion_alumno" RENAME CONSTRAINT "inscripcion_alumno_alumnoId_alumno_id_fkey" TO "inscripcion_alumno_N0lsvriSa81U_fkey";--> statement-breakpoint
ALTER TABLE "planificacion_curso" ADD COLUMN "precio_matricula" numeric(11,2) NOT NULL;--> statement-breakpoint

ALTER TABLE "matricula" ADD CONSTRAINT "matricula_planificacion_curso_id_planificacion_curso_id_fkey" FOREIGN KEY ("planificacion_curso_id") REFERENCES "planificacion_curso"("id");--> statement-breakpoint
ALTER TABLE "pago_matriculacion_alumno" ADD CONSTRAINT "pago_matriculacion_alumno_R1OxX70x0VS0_fkey" FOREIGN KEY ("inscripcion_alumno_id") REFERENCES "inscripcion_alumno"("id");--> statement-breakpoint
ALTER TABLE "pago_matriculacion_alumno" ADD CONSTRAINT "pago_matriculacion_alumno_matricula_id_matricula_id_fkey" FOREIGN KEY ("matricula_id") REFERENCES "matricula"("id");--> statement-breakpoint
ALTER TABLE "cuota" DROP CONSTRAINT "cuota_planificacion_curso_id_planificacion_curso_id_fkey", ADD CONSTRAINT "cuota_planificacion_curso_id_planificacion_curso_id_fkey" FOREIGN KEY ("planificacion_curso_id") REFERENCES "planificacion_curso"("id");--> statement-breakpoint
ALTER TABLE "inscripcion_alumno" DROP CONSTRAINT "inscripcion_alumno_N0lsvriSa81U_fkey", ADD CONSTRAINT "inscripcion_alumno_N0lsvriSa81U_fkey" FOREIGN KEY ("planificacion_curso_id") REFERENCES "planificacion_curso"("id");--> statement-breakpoint
ALTER TABLE "inscripcion_alumno" DROP CONSTRAINT "inscripcion_alumno_alumno_id_alumno_id_fkey", ADD CONSTRAINT "inscripcion_alumno_alumno_id_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumno"("id");
