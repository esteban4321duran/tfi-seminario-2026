export const DIAS_SEMANA = [
	{ valor: 'lunes', etiqueta: 'Lunes' },
	{ valor: 'martes', etiqueta: 'Martes' },
	{ valor: 'miercoles', etiqueta: 'Miércoles' },
	{ valor: 'jueves', etiqueta: 'Jueves' },
	{ valor: 'viernes', etiqueta: 'Viernes' },
	{ valor: 'sabado', etiqueta: 'Sábado' },
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number]['valor'];

export function normalizarDias(dias?: string | string[]): DiaSemana[] {
	const lista = dias === undefined ? [] : Array.isArray(dias) ? dias : [dias];
	return DIAS_SEMANA.map((d) => d.valor).filter((d) => lista.includes(d));
}
