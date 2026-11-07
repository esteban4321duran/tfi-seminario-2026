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
    app.setBaseViewsDir([sharedViewsDir, procesarPagosViewsDir, administrarCursosViewsDir]);
    hbs.registerPartials(join(sharedViewsDir, 'partials'));
    app.setViewEngine('hbs');
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(/hello/)
      .expect(/world/);
  });

  it('/cuotas (GET) renders the filtered account list', () => {
    return request(app.getHttpServer())
      .get('/cuotas?estado=pendiente')
      .expect(200)
      .expect(/Búsqueda de cuentas corrientes/)
      .expect(/Cuentas corrientes/);
  });

  it('/cuotas/registrar-pago (GET) renders the payment form', () => {
    return request(app.getHttpServer())
      .get('/cuotas/registrar-pago')
      .expect(200)
      .expect(/Registrar pago/)
      .expect(/Importe recibido/);
  });

  it('/cuotas/registrar-pago (POST) rejects a missing installment', () => {
    return request(app.getHttpServer())
      .post('/cuotas/registrar-pago')
      .type('form')
      .send({})
      .expect(400)
      .expect(/Seleccioná una cuota válida/);
  });

  it('/cuotas/registrar-pago (POST) rejects amounts with more than two decimals', () => {
    return request(app.getHttpServer())
      .post('/cuotas/registrar-pago')
      .type('form')
      .send({ cuotaKey: '1:1', monto: '1.234' })
      .expect(400)
      .expect(/hasta dos decimales/);
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
