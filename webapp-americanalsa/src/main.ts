import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import hbs from 'hbs'

const procesarPagosViewsDir = join(import.meta.dirname, '..', 'src', 'procesar-pagos-alumnos', 'views');
//configurar el motor de plantillas para generar vistas porque usamos el patrón MVC
//https://docs.nestjs.com/http/mvc

//motor de plantillas:
//https://handlebarsjs.com/guide/

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );
  app.useStaticAssets(join(import.meta.dirname, '..', 'public')); //definir directorio para archivos estáticos que necesitamos servir, por ej, CSS y JS de bootstrap

  //agregar una linea para las vistas de cáda módulo del sistema 
  app.setBaseViewsDir(procesarPagosViewsDir); //definir directorio donde se obtienen las plantillas que usaremos para generar las vistas
  hbs.registerPartials(join(procesarPagosViewsDir, 'partials'))
  app.setViewEngine('hbs');


  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
