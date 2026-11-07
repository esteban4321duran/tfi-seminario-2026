export type Cuatrimestre = 1 | 2;

export const CUATRIMESTRES: Record<Cuatrimestre, { mesInicio: number; mesFin: number }> = {
	1: { mesInicio: 2, mesFin: 5 },
	2: { mesInicio: 7, mesFin: 10 },
};

export function esCuatrimestre(value: number): value is Cuatrimestre {
	return value === 1 || value === 2;
}

export function cuatrimestreDeFecha(fecha: Date): Cuatrimestre {
	return fecha.getMonth() <= 5 ? 1 : 2;
}

export function etiquetaCuatrimestre(cuatrimestre: Cuatrimestre): string {
	return cuatrimestre === 1 ? '1er' : '2do';
}

export function etiquetaCuatrimestreFecha(fecha: Date): string {
	return `${etiquetaCuatrimestre(cuatrimestreDeFecha(fecha))} cuatrimestre ${fecha.getFullYear()}`;
}

export function calcularFechasCuatrimestre(anio: number, cuatrimestre: Cuatrimestre): { fechaInicio: Date; fechaFin: Date } {
	const { mesInicio, mesFin } = CUATRIMESTRES[cuatrimestre];
	return {
		fechaInicio: new Date(anio, mesInicio, 1, 9, 0),
		fechaFin: new Date(anio, mesFin + 1, 0, 12, 0),
	};
}
