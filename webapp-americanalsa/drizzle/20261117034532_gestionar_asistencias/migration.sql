CREATE TYPE "valor_asistencia" AS ENUM('presente', 'ausente', 'justificado');--> statement-breakpoint
CREATE TABLE "asistencia_alumno" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "asistencia_alumno_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"clase_dictada_id" integer NOT NULL,
	"inscripcion_alumno_id" integer NOT NULL,
	"valor" "valor_asistencia" NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone,
	"borrado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clase_dictada" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "clase_dictada_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"planificacion_curso_id" integer NOT NULL,
	"fecha_clase" date NOT NULL,
	"empleado_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone,
	"borrado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "asistencia_alumno_clase_inscripcion_activa_unique_idx" ON "asistencia_alumno" ("clase_dictada_id","inscripcion_alumno_id") WHERE "borrado_en" is null;--> statement-breakpoint
CREATE INDEX "idx_asistencia_alumno_clase_dictada_id" ON "asistencia_alumno" ("clase_dictada_id");--> statement-breakpoint
CREATE INDEX "idx_asistencia_alumno_inscripcion_alumno_id" ON "asistencia_alumno" ("inscripcion_alumno_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clase_dictada_planificacion_fecha_activa_unique_idx" ON "clase_dictada" ("planificacion_curso_id","fecha_clase") WHERE "borrado_en" is null;--> statement-breakpoint
CREATE INDEX "idx_clase_dictada_planificacion_curso_id" ON "clase_dictada" ("planificacion_curso_id");--> statement-breakpoint
CREATE INDEX "idx_clase_dictada_empleado_id" ON "clase_dictada" ("empleado_id");--> statement-breakpoint
ALTER TABLE "asistencia_alumno" ADD CONSTRAINT "asistencia_alumno_clase_dictada_id_clase_dictada_id_fkey" FOREIGN KEY ("clase_dictada_id") REFERENCES "clase_dictada"("id");--> statement-breakpoint
ALTER TABLE "asistencia_alumno" ADD CONSTRAINT "asistencia_alumno_TXO8yQfAcmbF_fkey" FOREIGN KEY ("inscripcion_alumno_id") REFERENCES "inscripcion_alumno"("id");--> statement-breakpoint
ALTER TABLE "clase_dictada" ADD CONSTRAINT "clase_dictada_D0V1NCsmonQL_fkey" FOREIGN KEY ("planificacion_curso_id") REFERENCES "planificacion_curso"("id");--> statement-breakpoint
ALTER TABLE "clase_dictada" ADD CONSTRAINT "clase_dictada_empleado_id_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleado"("id");