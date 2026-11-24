import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import hbs from 'hbs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@127.0.0.1:5432/americanalsa_test';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    const sharedViewsDir = join(import.meta.dirname, '..', 'src', 'views');
    const procesarPagosViewsDir = join(import.meta.dirname, '..', 'src', 'procesar-pagos-alumnos', 'views');
    const administrarCursosViewsDir = join(import.meta.dirname, '..', 'src', 'administrar-cursos', 'views');
    const administrarAlumnosViewsDir = join(import.meta.dirname, '..', 'src', 'administrar-alumnos', 'views');
    const inscribirAlumnoViewsDir = join(import.meta.dirname, '..', 'src', 'inscribir-alumno', 'views');
    const gestionarAsistenciasViewsDir = join(import.meta.dirname, '..', 'src', 'gestionar-asistencias', 'views');
    const resumenViewsDir = join(import.meta.dirname, '..', 'src', 'resumen', 'views');
    app.setBaseViewsDir([sharedViewsDir, procesarPagosViewsDir, administrarCursosViewsDir, administrarAlumnosViewsDir, inscribirAlumnoViewsDir, gestionarAsistenciasViewsDir, resumenViewsDir]);
    hbs.registerPartials(join(sharedViewsDir, 'partials'));
    app.setViewEngine('hbs');
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(/Panel de control/)
      .expect(/Inscripciones recientes/);
  });

  it('/cuotas (GET) renders the filtered account list', () => {
    return request(app.getHttpServer())
      .get('/cuotas?estado=pendiente')
      .expect(200)
      .expect(/Búsqueda de cuentas corrientes/)
      .expect(/Cuentas corrientes/)
      .expect(/id="cuotasPagoModal"/)
      .expect(/data-bs-target="#cuotasPagoModal"/);
  });

  it('/administrar-alumnos (GET) renders the student list', () => {
    return request(app.getHttpServer())
      .get('/administrar-alumnos?buscar=ana&buscar=juan')
      .expect(200)
      .expect(/Gestión de alumnos/)
      .expect(/alumnosRegistroModal/);
  });

  it('/administrar-alumnos (POST) returns field validation errors as JSON', () => {
    return request(app.getHttpServer())
      .post('/administrar-alumnos')
      .set('Accept', 'application/json')
      .type('form')
      .send({})
      .expect(400)
      .expect('Content-Type', /json/)
      .expect((response) => {
        expect(response.body.mensajeError).toBe('Revisá los datos ingresados.');
        expect(response.body.errores).toEqual(expect.arrayContaining([
          expect.objectContaining({ campo: 'nombre' }),
          expect.objectContaining({ campo: 'dni' }),
          expect.objectContaining({ campo: 'fechaNacimiento' }),
        ]));
      });
  });

  it('/gestionar-asistencias (GET) handles repeated query parameters', () => {
    return request(app.getHttpServer())
      .get('/gestionar-asistencias?cursoId=1&cursoId=2')
      .expect(200)
      .expect(/Control de clases/)
      .expect(/Tomar asistencia/);
  });

  it('/gestionar-asistencias (POST) rejects malformed identifiers as JSON', () => {
    return request(app.getHttpServer())
      .post('/gestionar-asistencias')
      .set('Accept', 'application/json')
      .send({ cursoId: {}, fecha: [], asistencias: 'no-es-una-lista' })
      .expect(400)
      .expect('Content-Type', /json/)
      .expect((response) => {
        expect(response.body).toHaveProperty('mensajeError');
        expect(Array.isArray(response.body.errores)).toBe(true);
      });
  });

  it('/cuotas/opciones-pago (GET) returns pending installment options as JSON', () => {
    return request(app.getHttpServer())
      .get('/cuotas/opciones-pago?inscripcionId=1')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect((response) => {
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length) {
          expect(response.body[0]).toHaveProperty('cuotaKey');
          expect(response.body[0]).toHaveProperty('etiqueta');
        }
      });
  });

  it('/cuotas/opciones-pago (GET) rejects an invalid enrollment id', () => {
    return request(app.getHttpServer())
      .get('/cuotas/opciones-pago?inscripcionId=invalid')
      .expect(400);
  });

  it('/cuotas/registrar-pago (GET) no longer serves a standalone form', () => {
    return request(app.getHttpServer())
      .get('/cuotas/registrar-pago')
      .expect(404);
  });

  it('/cuotas/registrar-pago (POST) rejects a missing installment', () => {
    return request(app.getHttpServer())
      .post('/cuotas/registrar-pago')
      .set('Accept', 'application/json')
      .type('form')
      .send({})
      .expect(400)
      .expect({ mensajeError: 'Seleccioná una cuota válida.' });
  });

  it('/cuotas/registrar-pago (POST) returns validation errors as JSON for the modal', () => {
    return request(app.getHttpServer())
      .post('/cuotas/registrar-pago')
      .set('Accept', 'application/json')
      .type('form')
      .send({})
      .expect(400)
      .expect('Content-Type', /json/)
      .expect({ mensajeError: 'Seleccioná una cuota válida.' });
  });

  it('/cuotas/registrar-pago (POST) rejects amounts with more than two decimals', () => {
    return request(app.getHttpServer())
      .post('/cuotas/registrar-pago')
      .set('Accept', 'application/json')
      .type('form')
      .send({ cuotaKey: '1:1', monto: '1.234' })
      .expect(400)
      .expect({ mensajeError: 'Ingresá un importe válido mayor a cero, con hasta dos decimales.' });
  });

  it('/administrar-cursos (POST) requires both prices', () => {
    return request(app.getHttpServer())
      .post('/administrar-cursos')
      .type('form')
      .send({})
      .expect(400)
      .expect(/Precio de cuota/)
      .expect(/Precio de matrícula/);
  });

  afterEach(async () => {
    await app.close();
  });
});
