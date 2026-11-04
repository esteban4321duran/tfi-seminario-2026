CREATE TYPE "dia_semana" AS ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado');--> statement-breakpoint
CREATE TYPE "rol_asignacion" AS ENUM('instructor', 'interprete', 'teatro');--> statement-breakpoint
CREATE TABLE "asignacion_curso" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "asignacion_curso_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"planificacion_curso_id" integer NOT NULL,
	"empleado_id" integer NOT NULL,
	"rol" "rol_asignacion" NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone,
	"borrado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "empleado" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "empleado_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"apellido" varchar(100) NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone,
	"borrado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "horario_curso" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "horario_curso_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"planificacion_curso_id" integer NOT NULL,
	"dia_semana" "dia_semana" NOT NULL,
	"hora_inicio" time NOT NULL,
	"duracion_minutos" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone,
	"borrado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "planificacion_curso" ADD COLUMN "cantidad_clases" integer DEFAULT 16 NOT NULL;--> statement-breakpoint
ALTER TABLE "asignacion_curso" ADD CONSTRAINT "asignacion_curso_bTKhmOfxGuOF_fkey" FOREIGN KEY ("planificacion_curso_id") REFERENCES "planificacion_curso"("id");--> statement-breakpoint
ALTER TABLE "asignacion_curso" ADD CONSTRAINT "asignacion_curso_empleado_id_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleado"("id");--> statement-breakpoint
ALTER TABLE "horario_curso" ADD CONSTRAINT "horario_curso_NUBzMrdBXltP_fkey" FOREIGN KEY ("planificacion_curso_id") REFERENCES "planificacion_curso"("id");