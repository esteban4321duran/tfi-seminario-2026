export interface RegistrarAlumnoDto {
	nombre?: string;
	apellido?: string;
	dni?: string;
	fechaNacimiento?: string;
	email?: string;
	telefono?: string;
	domicilio?: string;
}

export interface ErrorCampoAlumno {
	campo: 'nombre' | 'apellido' | 'dni' | 'fechaNacimiento' | 'email' | 'telefono' | 'domicilio';
	mensaje: string;
}

export type ResultadoRegistrarAlumno =
	| { ok: true; id: number }
	| { ok: false; tipo: 'datos_invalidos'; errores: ErrorCampoAlumno[] }
	| { ok: false; tipo: 'dni_duplicado' };

export interface AlumnoListado {
	id: number;
	apellido: string;
	nombre: string;
	dni: string;
	email: string;
	telefono: string;
	creadoEn: string;
}
