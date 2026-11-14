import { describe, expect, it } from 'vitest';
import { calcularFechaCorteCuotas, cuotaVencida } from './cuotas.js';

describe('vencimiento de cuotas', () => {
	it('calcula el primer día del mes actual como fecha de corte', () => {
		const fechaActual = new Date(2026, 2, 15, 12);

		expect(calcularFechaCorteCuotas(fechaActual)).toEqual(new Date(Date.UTC(2026, 2, 1)));
	});

	it('considera vencida una cuota si su mes es igual o anterior a la fecha de corte', () => {
		const fechaCorte = new Date(Date.UTC(2026, 2, 1));

		expect(cuotaVencida(new Date(Date.UTC(2026, 2, 1)), fechaCorte)).toBe(true);
		expect(cuotaVencida(new Date(Date.UTC(2026, 3, 1)), fechaCorte)).toBe(false);
	});
});
