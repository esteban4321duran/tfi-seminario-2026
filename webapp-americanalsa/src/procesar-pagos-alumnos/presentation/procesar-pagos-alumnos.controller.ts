import { Controller, Get, Render } from '@nestjs/common';
import { ProcesarPagosAlumnosService } from '../application/procesar-pagos-alumnos.service.js';

@Controller('procesar-pagos-alumnos')
export class ProcesarPagosAlumnosController {
	constructor(private readonly service: ProcesarPagosAlumnosService) { }


	@Get()
	@Render('cuenta-corriente-alumno-informe')
	getInformePage() {
		const ID_ALUMNO_EJEMPLO = 1;
		const {conceptos, deudaTotal} = this.service.getInformeDeudaAlumno(ID_ALUMNO_EJEMPLO);
		return { conceptos, deudaTotal};
	}
}

