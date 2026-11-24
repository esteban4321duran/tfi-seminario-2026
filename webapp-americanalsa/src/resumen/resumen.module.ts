import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module.js';
import { ResumenController } from './presentation/resumen.controller.js';
import { ResumenService } from './application/resumen.service.js';
import { ResumenRepository } from './persistence/resumen.repository.js';

@Module({
	imports: [CoreModule],
	providers: [ResumenService, ResumenRepository],
	controllers: [ResumenController],
})
export class ResumenModule { }
