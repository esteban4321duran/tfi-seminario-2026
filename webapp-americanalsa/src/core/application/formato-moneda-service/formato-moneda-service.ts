import { Injectable } from '@nestjs/common';

@Injectable()
export class FormatoMonedaService {

    private formateador: Intl.NumberFormat;

    constructor() {
        this.formateador = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
    }

    public getFormateador() {
        return this.formateador;
    }
}
