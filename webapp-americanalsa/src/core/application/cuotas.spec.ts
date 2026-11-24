import { describe, expect, it } from 'vitest';
import { calcularSaldoCuota, esCuotaDelMesActual, esCuotaVencida, estadoCuota, primerDiaMesActual } from './cuotas.js';

describe('calcularSaldoCuota', () => {
	it('calcula el saldo pagado parcialmente', () => expect(calcularSaldoCuota(25_000, 10_000)).toBe(15_000));
	it('no devuelve saldos negativos', () => expect(calcularSaldoCuota(25_000, 30_000)).toBe(0));
	it('evita errores de punto flotante', () => expect(calcularSaldoCuota(0.3, 0.1)).toBe(0.2));
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
	it('no vence durante su mes, incluido el primer y último día', () => {
		expect(esCuotaVencida(mayo, new Date(2026, 4, 1))).toBe(false);
		expect(esCuotaVencida(mayo, new Date(2026, 4, 31))).toBe(false);
	});
	it('vence desde el primer día del mes siguiente', () => expect(esCuotaVencida(mayo, new Date(2026, 5, 1))).toBe(true));
	it('no vence en el mes anterior', () => expect(esCuotaVencida(mayo, new Date(2026, 3, 30))).toBe(false));
});

describe('mes actual', () => {
	it('mantiene alineadas las funciones puras y el límite SQL', () => {
		const hoy = new Date(2026, 4, 31, 23, 59);
		const inicio = primerDiaMesActual(hoy);
		const actual = new Date(Date.UTC(2026, 4, 1));
		const anterior = new Date(Date.UTC(2026, 3, 1));
		expect(esCuotaDelMesActual(actual, hoy)).toBe(true);
		expect(esCuotaVencida(actual, hoy)).toBe(false);
		expect(actual < inicio).toBe(false);
		expect(esCuotaDelMesActual(anterior, hoy)).toBe(false);
		expect(esCuotaVencida(anterior, hoy)).toBe(true);
		expect(anterior < inicio).toBe(true);
	});
});
