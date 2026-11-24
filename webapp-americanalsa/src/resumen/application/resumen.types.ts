export interface ResumenTarjetas {
	alumnosConCuotaPendiente: number;
	montoPendiente: string;
	alumnosConCuotaVencida: number;
	cursosEnCurso: number;
}

export interface AlumnoConInasistencias {
	planificacionId: number;
	alumno: string;
	curso: string;
	cuatrimestre: string;
	ausencias: number;
}

export interface InscripcionReciente {
	alumno: string;
	curso: string;
	creadoEn: string;
}

export interface ResumenVista {
	esResumen: true;
	mesActual: string;
	tarjetas: ResumenTarjetas & { enlaces: { pendientes: string; vencidas: string; cursos: string } };
	inasistencias: AlumnoConInasistencias[];
	totalInasistencias: number;
	hayMasInasistencias: boolean;
	cantidadMasInasistencias: number;
	inscripcionesRecientes: InscripcionReciente[];
}
