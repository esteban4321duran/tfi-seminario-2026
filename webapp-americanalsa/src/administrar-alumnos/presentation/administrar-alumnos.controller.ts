import { Body, Controller, Get, Post, Query, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AdministrarAlumnosService } from '../application/administrar-alumnos.service.js';
import type { RegistrarAlumnoDto } from '../application/alumno.types.js';
import { enteroPositivo, leerTexto } from '../../core/presentation/entrada.js';

const MENSAJE_DATOS_INVALIDOS = 'Revisá los datos ingresados.';
const MENSAJE_DNI_DUPLICADO = 'Ya existe un alumno registrado con ese DNI.';
const MENSAJE_ERROR_REGISTRO = 'No se pudo registrar el alumno.';

function leerCampo(body: unknown, campo: string): string | undefined {
	if (typeof body !== 'object' || body === null) return undefined;
	const cuerpo = body as Record<string, unknown>;
	return leerTexto(cuerpo[campo]);
}

function fechaLocalIso(fecha: Date): string {
	const anio = fecha.getFullYear();
	const mes = String(fecha.getMonth() + 1).padStart(2, '0');
	const dia = String(fecha.getDate()).padStart(2, '0');
	return `${anio}-${mes}-${dia}`;
}

@Controller('administrar-alumnos')
export class AdministrarAlumnosController {
	constructor(private readonly service: AdministrarAlumnosService) { }

	@Get()
	@Render('alumnos-listado')
	async listado(
		@Query('buscar') buscarParam?: unknown,
		@Query('creado') creadoParam?: unknown,
	) {
		const buscar = leerTexto(buscarParam)?.trim() || undefined;
		const creado = enteroPositivo(creadoParam);
		const alumnos = await this.service.listar(buscar);
		return {
			esAlumnos: true,
			buscar: buscar ?? '',
			hayBusqueda: Boolean(buscar),
			creado: creado !== undefined,
			alumnos: alumnos.map((alumno) => ({ ...alumno, esNuevo: alumno.id === creado })),
			fechaHoy: fechaLocalIso(new Date()),
		};
	}

	@Post()
	async registrar(@Body() body: unknown, @Res() res: Response) {
		const dto: RegistrarAlumnoDto = {
			nombre: leerCampo(body, 'nombre'),
			apellido: leerCampo(body, 'apellido'),
			dni: leerCampo(body, 'dni'),
			fechaNacimiento: leerCampo(body, 'fechaNacimiento'),
			email: leerCampo(body, 'email'),
			telefono: leerCampo(body, 'telefono'),
			domicilio: leerCampo(body, 'domicilio'),
		};
		const resultado = await this.service.registrar(dto);

		if (resultado.ok) return res.status(201).json({ id: resultado.id });
		if (resultado.tipo === 'datos_invalidos') {
			return res.status(400).json({ mensajeError: MENSAJE_DATOS_INVALIDOS, errores: resultado.errores });
		}
		return res.status(409).json({
			mensajeError: MENSAJE_ERROR_REGISTRO,
			errores: [{ campo: 'dni', mensaje: MENSAJE_DNI_DUPLICADO }],
		});
	}
}
