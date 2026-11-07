import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProcesarPagosAlumnosModule } from './procesar-pagos-alumnos/procesar-pagos-alumnos.module.js';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { CoreModule } from './core/core.module.js';
import { AdministrarCursosModule } from './administrar-cursos/administrar-cursos.module.js';
import { InscribirAlumnoModule } from './inscribir-alumno/inscribir-alumno.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProcesarPagosAlumnosModule,
    AdministrarCursosModule,
    InscribirAlumnoModule,
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
