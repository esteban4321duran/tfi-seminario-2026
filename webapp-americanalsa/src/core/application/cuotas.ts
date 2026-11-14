export function calcularFechaCorteCuotas(fechaActual: Date): Date {
	return new Date(Date.UTC(fechaActual.getFullYear(), fechaActual.getMonth(), 1));
}

export function cuotaVencida(mesCuota: Date, fechaCorte: Date): boolean {
	return mesCuota.getTime() <= fechaCorte.getTime();
}
