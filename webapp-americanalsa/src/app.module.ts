import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProcesarPagosAlumnosModule } from './procesar-pagos-alumnos/procesar-pagos-alumnos.module.js';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { CoreModule } from './core/core.module.js';
import { AdministrarCursosModule } from './administrar-cursos/administrar-cursos.module.js';
import { InscribirAlumnoModule } from './inscribir-alumno/inscribir-alumno.module.js';
import { AdministrarAlumnosModule } from './administrar-alumnos/administrar-alumnos.module.js';
import { GestionarAsistenciasModule } from './gestionar-asistencias/gestionar-asistencias.module.js';
import { ResumenModule } from './resumen/resumen.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProcesarPagosAlumnosModule,
    AdministrarCursosModule,
    AdministrarAlumnosModule,
    InscribirAlumnoModule,
    GestionarAsistenciasModule,
    ResumenModule,
    DrizzleModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        drizzle,
        connection: configService.getOrThrow<string>('DATABASE_URL'),
      }),
    }),
    CoreModule,
  ],
})
export class AppModule { }
