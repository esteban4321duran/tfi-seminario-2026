import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { cuatrimestreDeFecha, etiquetaCuatrimestre } from '../../core/application/cuatrimestre.js';
import { primerDiaMesActual } from '../../core/application/cuotas.js';
import { inicioDiaLocal, inicioDiaLocalSiguiente, etiquetaMes } from '../../core/application/fechas.js';
import { LIMITE_INASISTENCIAS } from '../../core/application/asistencias.js';
import { FormatoMonedaService } from '../../core/application/formato-moneda-service/formato-moneda-service.js';
import { ResumenRepository } from '../persistence/resumen.repository.js';
import type { ResumenVista } from './resumen.types.js';

@Injectable()
export class ResumenService {
	constructor(private readonly repository: ResumenRepository, private readonly formatoMonedaService: FormatoMonedaService) { }

	async getResumen(hoy = new Date()): Promise<ResumenVista> {
		const inicioMes = primerDiaMesActual(hoy);
		const desde = inicioDiaLocal(hoy);
		const hasta = inicioDiaLocalSiguiente(hoy);
		const [cuotas, cursosEnCurso, inasistencias, totalInasistencias, recientes] = await Promise.all([
			this.repository.getCuotas(inicioMes),
			this.repository.getCursosEnCurso(desde, hasta),
			this.repository.getInasistencias(desde, hasta, LIMITE_INASISTENCIAS),
			this.repository.getTotalInasistencias(desde, hasta, LIMITE_INASISTENCIAS),
			this.repository.getInscripcionesRecientes(),
		]);
		const mes = etiquetaMes(inicioMes);
		const mesNumero = String(hoy.getMonth() + 1).padStart(2, '0');
		const anio = hoy.getFullYear();
		return {
			esResumen: true,
			mesActual: mes,
			tarjetas: {
				alumnosConCuotaPendiente: cuotas.alumnosConCuotaPendiente,
				montoPendiente: this.formatoMonedaService.getFormateador().format(cuotas.montoPendiente),
				alumnosConCuotaVencida: cuotas.alumnosConCuotaVencida,
				cursosEnCurso,
				enlaces: { pendientes: `/cuotas?anio=${anio}&mes=${mesNumero}`, vencidas: '/cuotas?soloConDeuda=on', cursos: '/gestionar-asistencias' },
			},
			inasistencias: inasistencias.slice(0, 10).map((fila) => ({ planificacionId: fila.planificacionId, alumno: `${fila.apellido}, ${fila.nombre}`, curso: fila.curso, cuatrimestre: `${etiquetaCuatrimestre(cuatrimestreDeFecha(fila.fechaInicio))} cuatrimestre`, ausencias: fila.ausencias })),
			totalInasistencias,
			hayMasInasistencias: totalInasistencias > 10,
			cantidadMasInasistencias: Math.max(0, totalInasistencias - 10),
			inscripcionesRecientes: recientes.map((fila) => ({ alumno: `${fila.apellido}, ${fila.nombre}`, curso: fila.curso, creadoEn: dayjs(fila.creadoEn).format('DD/MM/YYYY HH:mm') })),
		};
	}
}
