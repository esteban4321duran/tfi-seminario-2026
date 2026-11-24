import { describe, expect, it } from 'vitest';
import { formatearDia, formatearDiaConSemana } from './fechas.js';

describe('formatearDia', () => {
	it('formatea los días calendario usando UTC', () => {
		expect(formatearDia(new Date('2026-11-16T00:00:00.000Z'))).toBe('16/11/2026');
	});

	it('incluye el día de la semana en UTC', () => {
		expect(formatearDiaConSemana(new Date('2026-11-16T00:00:00.000Z'))).toBe('lunes, 16/11/2026');
	});
});
