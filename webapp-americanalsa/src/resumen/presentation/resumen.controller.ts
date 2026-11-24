import { Controller, Get, Render } from '@nestjs/common';
import { ResumenService } from '../application/resumen.service.js';

@Controller()
export class ResumenController {
	constructor(private readonly service: ResumenService) { }

	@Get()
	@Render('resumen')
	getResumen() {
		return this.service.getResumen();
	}
}
