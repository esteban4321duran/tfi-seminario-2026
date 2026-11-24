/**
 * Convención de fechas del proyecto:
 * - Las columnas `date` (por ej. cuota.mes) son días calendario, guardados como
 *   medianoche UTC. Se formatean y comparan SIEMPRE en UTC.
 * - "Hoy" es el día calendario local del servidor (ver esCuotaVencida).
 */
const formateadorMes = new Intl.DateTimeFormat('es-AR', {
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC',
});

const formateadorDia = new Intl.DateTimeFormat('es-AR', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	timeZone: 'UTC',
});

const formateadorDiaSemana = new Intl.DateTimeFormat('es-AR', {
	weekday: 'long',
	timeZone: 'UTC',
});

/** "agosto de 2026" */
export function etiquetaMes(mes: Date): string {
	return formateadorMes.format(mes);
}

/** "15/08/2026" */
export function formatearDia(dia: Date): string {
	return formateadorDia.format(dia);
}

export function formatearDiaConSemana(dia: Date): string {
	return `${formateadorDiaSemana.format(dia)}, ${formatearDia(dia)}`;
}

export function fechaLocalIso(fecha: Date): string {
	const anio = fecha.getFullYear();
	const mes = String(fecha.getMonth() + 1).padStart(2, '0');
	const dia = String(fecha.getDate()).padStart(2, '0');
	return `${anio}-${mes}-${dia}`;
}

export function inicioDiaLocal(fecha: Date): Date {
	return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function inicioDiaLocalSiguiente(fecha: Date): Date {
	return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
}

export function estaEnCursoHoy(inicioCurso: string, finCurso: string, hoy: string): boolean {
	return hoy >= inicioCurso && hoy <= finCurso;
}

/** "2026-08": sirve para comparar y filtrar por mes. */
export function claveMes(mes: Date): string {
	return mes.toISOString().slice(0, 7);
}
