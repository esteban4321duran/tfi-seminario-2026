import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProcesarPagosAlumnosModule } from './procesar-pagos-alumnos/procesar-pagos-alumnos.module.js';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';


@Module({
  imports: [
    ProcesarPagosAlumnosModule,
    DrizzleModule.forRoot({
      drizzle,
      connection: process.env.DATABASE_HOST!,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
