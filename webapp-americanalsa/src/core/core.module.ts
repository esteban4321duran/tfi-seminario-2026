import { Module } from '@nestjs/common';
import { FormatoMonedaService } from './application/formato-moneda-service/formato-moneda-service.js';

@Module({
  providers: [FormatoMonedaService],
  exports: [FormatoMonedaService],
})
export class CoreModule { }
