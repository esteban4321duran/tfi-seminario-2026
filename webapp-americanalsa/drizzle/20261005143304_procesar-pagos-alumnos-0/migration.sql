CREATE TYPE "nivel" AS ENUM('a1', 'a2', 'b1', 'b2', 'b3');--> statement-breakpoint
CREATE TABLE "alumno" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "alumno_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"fechaNacimiento" timestamp with time zone NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"apellido" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"telefono" varchar(10) NOT NULL,
	"domicilio" varchar(200) NOT NULL,
	"creadoEn" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizadoEn" timestamp with time zone,
	"borradoEn" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cuota" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cuota_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mes" date NOT NULL,
	"planificacionCursoId" integer NOT NULL,
	"creadoEn" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizadoEn" timestamp with time zone,
	"borradoEn" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "curso" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curso_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"nivel" "nivel",
	"creadoEn" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizadoEn" timestamp with time zone,
	"borradoEn" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inscripcion_alumno" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inscripcion_alumno_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"alumnoId" integer NOT NULL,
	"planificacionCursoId" integer NOT NULL,
	"creadoEn" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizadoEn" timestamp with time zone,
	"borradoEn" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pago_cuota_alumno" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pago_cuota_alumno_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"monto" numeric(11,2) NOT NULL,
	"creadoEn" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizadoEn" timestamp with time zone,
	"borradoEn" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "planificacion_curso" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "planificacion_curso_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"precioCuota" numeric(11,2) NOT NULL,
	"fechaInicio" timestamp with time zone NOT NULL,
	"fechaFin" timestamp with time zone NOT NULL,
	"creadoEn" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizadoEn" timestamp with time zone,
	"borradoEn" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "cuota" ADD CONSTRAINT "cuota_planificacionCursoId_planificacion_curso_id_fkey" FOREIGN KEY ("planificacionCursoId") REFERENCES "planificacion_curso"("id");--> statement-breakpoint
ALTER TABLE "inscripcion_alumno" ADD CONSTRAINT "inscripcion_alumno_alumnoId_alumno_id_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumno"("id");--> statement-breakpoint
ALTER TABLE "inscripcion_alumno" ADD CONSTRAINT "inscripcion_alumno_HxzR0li5FqS4_fkey" FOREIGN KEY ("planificacionCursoId") REFERENCES "planificacion_curso"("id");