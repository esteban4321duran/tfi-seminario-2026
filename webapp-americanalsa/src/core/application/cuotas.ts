export type EstadoCuota = 'pagada' | 'parcial' | 'pendiente';

const aCentavos = (monto: number) => Math.round(monto * 100);

export function calcularSaldoCuota(precio: number, pagado: number): number {
	return Math.max(0, aCentavos(precio) - aCentavos(pagado)) / 100;
}

export function estadoCuota(precio: number, pagado: number): EstadoCuota {
	if (calcularSaldoCuota(precio, pagado) === 0) return 'pagada';
	return pagado > 0 ? 'parcial' : 'pendiente';
}

export function esCuotaVencida(mes: Date, hoy: Date): boolean {
	const claveMesCuota = mes.getUTCFullYear() * 12 + mes.getUTCMonth();
	const claveMesActual = hoy.getFullYear() * 12 + hoy.getMonth();
	return claveMesCuota <= claveMesActual;
}
