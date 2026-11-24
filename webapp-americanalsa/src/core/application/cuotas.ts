export type EstadoCuota = 'pagada' | 'parcial' | 'pendiente';

const aCentavos = (monto: number) => Math.round(monto * 100);

export function calcularSaldoCuota(precio: number, pagado: number): number {
	return Math.max(0, aCentavos(precio) - aCentavos(pagado)) / 100;
}

export function estadoCuota(precio: number, pagado: number): EstadoCuota {
	if (calcularSaldoCuota(precio, pagado) === 0) return 'pagada';
	return pagado > 0 ? 'parcial' : 'pendiente';
}
/**
 * `mes` es un día calendario (medianoche UTC), por eso se lee con getUTC*.
 * `hoy` es un instante: se interpreta en la zona horaria del servidor.
 */
export function esCuotaVencida(mes: Date, hoy: Date): boolean {
	const claveMesCuota = mes.getUTCFullYear() * 12 + mes.getUTCMonth();
	const claveMesActual = hoy.getFullYear() * 12 + hoy.getMonth();
	return claveMesCuota < claveMesActual;
}

export function esCuotaDelMesActual(mes: Date, hoy: Date): boolean {
	return mes.getUTCFullYear() === hoy.getFullYear()
		&& mes.getUTCMonth() === hoy.getMonth();
}

export function primerDiaMesActual(hoy: Date): Date {
	return new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), 1));
}
