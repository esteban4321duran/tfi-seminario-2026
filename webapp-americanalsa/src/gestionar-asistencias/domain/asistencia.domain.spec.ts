import { describe, expect, it } from 'vitest';
import { validarConjuntoAsistencias, validarFechaClase } from './asistencia.domain.js';

describe('validarFechaClase', () => {
	it('acepta los extremos inclusivos del período del curso', () => {
		expect(validarFechaClase('2026-07-01', '2026-07-01', '2026-10-31', '2026-11-16')).toEqual([]);
		expect(validarFechaClase('2026-10-31', '2026-07-01', '2026-10-31', '2026-11-16')).toEqual([]);
	});

	it.each(['2026-02-31', '2026-7-01', '2026-11-17', '2026-06-30'])('rechaza la fecha inválida o fuera de regla %s', (fecha) => {
		expect(validarFechaClase(fecha, '2026-07-01', '2026-10-31', '2026-11-16').length).toBeGreaterThan(0);
	});
});

describe('validarConjuntoAsistencias', () => {
	it('acepta valores válidos de inscripciones del curso', () => {
		expect(validarConjuntoAsistencias([
			{ inscripcionId: 10, valor: 'presente' },
			{ inscripcionId: 11, valor: 'justificado' },
		], [10, 11])).toEqual({
			ok: true,
			asistencias: [
				{ inscripcionId: 10, valor: 'presente' },
				{ inscripcionId: 11, valor: 'justificado' },
			],
		});
	});

	it('rechaza listas mal formadas, inscripciones ajenas, repetidas y valores desconocidos', () => {
		const resultado = validarConjuntoAsistencias([
			{ inscripcionId: 10, valor: 'presente' },
			{ inscripcionId: 10, valor: 'ausente' },
			{ inscripcionId: 99, valor: 'presente' },
			{ inscripcionId: 11, valor: 'tarde' },
			null,
		], [10, 11]);

		expect(resultado.ok).toBe(false);
		if (!resultado.ok) {
			expect(resultado.errores.map((error) => error.campo)).toEqual(expect.arrayContaining([
				'inscripcionId', 'valor', 'asistencias',
			]));
		}
	});

	it('rechaza un cuerpo que no contiene una lista', () => {
		expect(validarConjuntoAsistencias(null, [10])).toEqual({
			ok: false,
			errores: [{ campo: 'asistencias', mensaje: 'La lista de asistencias no es válida.' }],
		});
	});
});
