import { describe, expect, it } from 'vitest';
import { validarDatosAlumno } from './alumno.domain.js';
import type { RegistrarAlumnoDto } from '../application/alumno.types.js';

const alumnoValido: RegistrarAlumnoDto = {
	nombre: ' Ana ',
	apellido: ' Pérez ',
	dni: '12345678',
	fechaNacimiento: '2000-02-29',
	email: 'ana@example.com',
	telefono: '3811234567',
	domicilio: ' Calle 123 ',
};

describe('validarDatosAlumno', () => {
	it('acepta los datos correctos y fechas calendario válidas', () => {
		expect(validarDatosAlumno(alumnoValido, '2026-11-16')).toEqual([]);
	});

	it.each(['2024-02-31', '1899-12-31', '2026-11-17', '2000-2-01'])('rechaza la fecha de nacimiento %s', (fechaNacimiento) => {
		expect(validarDatosAlumno({ ...alumnoValido, fechaNacimiento }, '2026-11-16'))
			.toContainEqual(expect.objectContaining({ campo: 'fechaNacimiento' }));
	});

	it('rechaza campos obligatorios vacíos y valores fuera de formato', () => {
		const errores = validarDatosAlumno({
			...alumnoValido,
			nombre: '  ',
			dni: '12-345',
			telefono: '12345678901',
			email: 'no-es-un-email',
			domicilio: '',
		}, '2026-11-16');

		expect(errores.map((error) => error.campo)).toEqual(expect.arrayContaining([
			'nombre', 'dni', 'telefono', 'email', 'domicilio',
		]));
	});
});
