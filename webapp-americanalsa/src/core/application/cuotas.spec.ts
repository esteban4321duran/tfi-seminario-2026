import { describe, expect, it } from 'vitest';
import { calcularSaldoCuota, esCuotaVencida, estadoCuota } from './cuotas.js';

describe('calcularSaldoCuota', () => {
	it('calcula el saldo pagado parcialmente', () => {
		expect(calcularSaldoCuota(25_000, 10_000)).toBe(15_000);
	});

	it('no devuelve saldos negativos', () => {
		expect(calcularSaldoCuota(25_000, 30_000)).toBe(0);
	});

	it('evita errores de punto flotante', () => {
		expect(calcularSaldoCuota(0.3, 0.1)).toBe(0.2);
	});
});

describe('estadoCuota', () => {
	it('determina si está pagada, parcial o pendiente', () => {
		expect(estadoCuota(100, 100)).toBe('pagada');
		expect(estadoCuota(100, 25)).toBe('parcial');
		expect(estadoCuota(100, 0)).toBe('pendiente');
	});
});

describe('esCuotaVencida', () => {
	const mayo = new Date(Date.UTC(2026, 4, 1));

	it('vence el primer día de su mes', () => {
		expect(esCuotaVencida(mayo, new Date(2026, 4, 1))).toBe(true);
	});

	it('no vence en el mes anterior', () => {
		expect(esCuotaVencida(mayo, new Date(2026, 3, 30))).toBe(false);
	});
});
