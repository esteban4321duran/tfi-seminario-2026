import { Injectable } from '@nestjs/common';

@Injectable()
export class FormatoFechaService {

    static MESES_MAP = new Map([
        ['1', 'enero'],
        ['2', 'febrero'],
        ['3', 'marzo'],
        ['4', 'abril'],
        ['5', 'mayo'],
        ['6', 'junio'],
        ['7', 'julio'],
        ['8', 'agosto'],
        ['9', 'septiembre'],
        ['10', 'octubre'],
        ['11', 'noviembre'],
        ['12', 'diciembre'],
    ]);
    /**
     * 
     * @param mes - 1 -> 'Enero', 2 -> 'Febrero'
     */
    public mesEnLetras(mes: string): string {

        if (!FormatoFechaService.MESES_MAP.has(mes)) {
            throw new Error('Mes fuera de rango');
        }

        return FormatoFechaService.MESES_MAP.get(mes)!;
    }

}
