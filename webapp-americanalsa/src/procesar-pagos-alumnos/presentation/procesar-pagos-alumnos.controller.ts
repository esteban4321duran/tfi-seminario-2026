import { Controller, Get, ParseIntPipe, Query, Render } from '@nestjs/common';
import { ProcesarPagosAlumnosService } from '../application/procesar-pagos-alumnos.service.js';
import dayjs from 'dayjs';

//nest generate controller procesarPagosAlumnos procesarPagosAlumnos
@Controller('procesar-pagos-alumnos')
export class ProcesarPagosAlumnosController {
	constructor(private readonly service: ProcesarPagosAlumnosService) { }


	@Get('informe')
	@Render('cuenta-corriente-alumno-informe')
	async getInformePage() {
		const ID_ALUMNO_EJEMPLO = 1;
		const {conceptos, deudaTotal} = await this.service.getInformeDeudaAlumno(ID_ALUMNO_EJEMPLO);
		return { conceptos, deudaTotal};
	}

	@Get('informe-todos')
	@Render('cuenta-corriente-multialumno-informe')
	async getAllInformePage(
		@Query('anio', ParseIntPipe) anio: number,
	) {

		const { conceptos, cuentasAlumnos } = await this.service.getInformeDeudaTodos(anio);

		const ANIO_INICIAL = 2025;
		const ANIOS_DESDE_INICIAL = dayjs().diff(dayjs().year(ANIO_INICIAL), 'years') + 1; 
		const anios = Array.from(Array(ANIOS_DESDE_INICIAL).keys()).map(x => ANIO_INICIAL + x);

		return {
			conceptos,
			cuentasAlumnos,
			aniosOptions: anios.map(a=> {
				return {
					valor: a,
					esSeleccionado: a === anio
				}
			}),
		};
	}
}

