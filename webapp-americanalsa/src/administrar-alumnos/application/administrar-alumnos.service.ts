import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { AlumnoRepository } from '../persistence/alumno.repository.js';
import { validarDatosAlumno } from '../domain/alumno.domain.js';
import type { AlumnoListado, RegistrarAlumnoDto, ResultadoRegistrarAlumno } from './alumno.types.js';

function fechaLocalIso(fecha: Date): string {
	const anio = fecha.getFullYear();
	const mes = String(fecha.getMonth() + 1).padStart(2, '0');
	const dia = String(fecha.getDate()).padStart(2, '0');
	return `${anio}-${mes}-${dia}`;
}

@Injectable()
export class AdministrarAlumnosService {
	constructor(private readonly repository: AlumnoRepository) { }

	async listar(buscar?: string): Promise<AlumnoListado[]> {
		const texto = buscar?.trim();
		const filas = texto
			? await this.repository.buscar(texto)
			: await this.repository.listarUltimos();

		return filas.map((fila) => ({
			...fila,
			creadoEn: dayjs(fila.creadoEn).format('DD/MM/YYYY'),
		}));
	}

	async registrar(dto: RegistrarAlumnoDto): Promise<ResultadoRegistrarAlumno> {
		const datos = {
			nombre: dto.nombre?.trim() ?? '',
			apellido: dto.apellido?.trim() ?? '',
			dni: dto.dni?.trim() ?? '',
			fechaNacimiento: dto.fechaNacimiento?.trim() ?? '',
			email: dto.email?.trim().toLowerCase() ?? '',
			telefono: dto.telefono?.trim() ?? '',
			domicilio: dto.domicilio?.trim() ?? '',
		};
		const errores = validarDatosAlumno(datos, fechaLocalIso(new Date()));
		if (errores.length > 0) return { ok: false, tipo: 'datos_invalidos', errores };

		const resultado = await this.repository.crear({
			nombre: datos.nombre,
			apellido: datos.apellido,
			dni: datos.dni,
			fechaNacimiento: new Date(`${datos.fechaNacimiento}T00:00:00.000Z`),
			email: datos.email,
			telefono: datos.telefono,
			domicilio: datos.domicilio,
		});

		if (!resultado.creado) return { ok: false, tipo: 'dni_duplicado' };
		return { ok: true, id: resultado.id };
	}
}
