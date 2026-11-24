const MAX_INTEGER_POSTGRES = 2_147_483_647;

/**
 * Normaliza un valor que viene de afuera (query, body) a string.
 * Si llega repetido (array) o con otro tipo, se ignora: se considera ausente.
 */
export function leerTexto(valor: unknown): string | undefined {
	return typeof valor === 'string' ? valor : undefined;
}

/** Entero positivo que entra en una columna integer de Postgres. */
export function enteroPositivo(valor: unknown): number | undefined {
	const texto = leerTexto(valor)?.trim();
	if (!texto || !/^\d+$/.test(texto)) return undefined;
	const numero = Number(texto);
	return numero > 0 && numero <= MAX_INTEGER_POSTGRES ? numero : undefined;
}