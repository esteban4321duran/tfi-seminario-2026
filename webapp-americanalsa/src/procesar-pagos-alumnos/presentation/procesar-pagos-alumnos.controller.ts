import { Controller, Get, Render } from '@nestjs/common';
import { ProcesarPagosAlumnosService } from '../application/procesar-pagos-alumnos.service.js';

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
	@Render('cuenta-corriente-alumno-informe')
	async getAllInformePage() {
		await this.service.getAllInformeDeudaAlumno();
		return { conceptos: [], deudaTotal: "20.000"};
	}
}

