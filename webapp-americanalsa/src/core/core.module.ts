import { Module } from '@nestjs/common';
import { FormatoMonedaService } from './application/formato-moneda-service/formato-moneda-service.js';
import { FormatoFechaService } from './application/formato-fecha-service/formato-fecha-service.js';

@Module({
  providers: [FormatoMonedaService, FormatoFechaService],
  exports: [FormatoMonedaService, FormatoFechaService]
})
export class CoreModule { }
