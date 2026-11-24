import type { ErrorCampoAlumno, RegistrarAlumnoDto } from '../application/alumno.types.js';

const LONGITUD_MAXIMA_NOMBRE = 100;
const LONGITUD_MAXIMA_EMAIL = 100;
const LONGITUD_MAXIMA_TELEFONO = 10;
const LONGITUD_MAXIMA_DOMICILIO = 200;
const FECHA_MINIMA_NACIMIENTO = '1900-01-01';
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fechaValida(fecha: string): boolean {
	if (!FORMATO_FECHA.test(fecha)) return false;
	const [anio, mes, dia] = fecha.split('-').map(Number);
	if (mes < 1 || mes > 12 || dia < 1) return false;
	const fechaUtc = new Date(0);
	fechaUtc.setUTCFullYear(anio, mes - 1, dia);
	return fechaUtc.getUTCFullYear() === anio
		&& fechaUtc.getUTCMonth() === mes - 1
		&& fechaUtc.getUTCDate() === dia;
}

export function validarDatosAlumno(dto: RegistrarAlumnoDto, hoy: string): ErrorCampoAlumno[] {
	const errores: ErrorCampoAlumno[] = [];
	const nombre = dto.nombre?.trim() ?? '';
	const apellido = dto.apellido?.trim() ?? '';
	const dni = dto.dni?.trim() ?? '';
	const email = dto.email?.trim() ?? '';
	const telefono = dto.telefono?.trim() ?? '';
	const domicilio = dto.domicilio?.trim() ?? '';
	const fechaNacimiento = dto.fechaNacimiento?.trim() ?? '';

	if (!nombre) errores.push({ campo: 'nombre', mensaje: 'Ingresá el nombre.' });
	else if (nombre.length > LONGITUD_MAXIMA_NOMBRE) errores.push({ campo: 'nombre', mensaje: 'El nombre no puede superar los 100 caracteres.' });

	if (!apellido) errores.push({ campo: 'apellido', mensaje: 'Ingresá el apellido.' });
	else if (apellido.length > LONGITUD_MAXIMA_NOMBRE) errores.push({ campo: 'apellido', mensaje: 'El apellido no puede superar los 100 caracteres.' });

	if (!/^\d{7,8}$/.test(dni)) errores.push({ campo: 'dni', mensaje: 'El DNI debe tener 7 u 8 dígitos.' });

	if (!email) errores.push({ campo: 'email', mensaje: 'Ingresá el email.' });
	else if (email.length > LONGITUD_MAXIMA_EMAIL) errores.push({ campo: 'email', mensaje: 'El email no puede superar los 100 caracteres.' });
	else if (!FORMATO_EMAIL.test(email)) errores.push({ campo: 'email', mensaje: 'Ingresá un email válido.' });

	if (!/^\d+$/.test(telefono)) errores.push({ campo: 'telefono', mensaje: 'El teléfono debe contener solo dígitos.' });
	else if (telefono.length > LONGITUD_MAXIMA_TELEFONO) errores.push({ campo: 'telefono', mensaje: 'El teléfono no puede superar los 10 dígitos.' });

	if (!domicilio) errores.push({ campo: 'domicilio', mensaje: 'Ingresá el domicilio.' });
	else if (domicilio.length > LONGITUD_MAXIMA_DOMICILIO) errores.push({ campo: 'domicilio', mensaje: 'El domicilio no puede superar los 200 caracteres.' });

	if (!fechaValida(fechaNacimiento)) {
		errores.push({ campo: 'fechaNacimiento', mensaje: 'Ingresá una fecha de nacimiento válida en formato AAAA-MM-DD.' });
	} else if (fechaNacimiento < FECHA_MINIMA_NACIMIENTO) {
		errores.push({ campo: 'fechaNacimiento', mensaje: 'La fecha de nacimiento no puede ser anterior a 1900.' });
	} else if (fechaNacimiento > hoy) {
		errores.push({ campo: 'fechaNacimiento', mensaje: 'La fecha de nacimiento no puede ser futura.' });
	}

	return errores;
}
