/**
 * Utilidades de formateo numérico y regional para Livora Eco
 */

/**
 * Formatea una cantidad numérica a formato de LIVOs con decimales fijos
 */
export function formatLivos(amount: number | string | undefined | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return "0.00 LIVO";
  return `${num.toFixed(2)} LIVO`;
}

export const formatEcoTokens = formatLivos;

/**
 * Convierte un balance de LIVOs a su valor aproximado en Soles Peruanos (PEN)
 */
export function formatFiatPEN(amount: number | string | undefined | null, rate: number = 3.75): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return "S/ 0.00 PEN";
  return `S/ ${(num * rate).toFixed(2)} PEN`;
}

/**
 * Formatea una fecha ISO a formato legible regional peruano (DD/MM/YYYY)
 */
export function formatRegionalDate(isoDate: string | Date | undefined | null): string {
  if (!isoDate) return "---";
  const date = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
  if (isNaN(date.getTime())) return "Fecha inválida";
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Valida si un código correlativo de reclamo cumple el estándar XXXXX-AAAA
 */
export function isValidCorrelative(code: string): boolean {
  return /^\d{5}-\d{4}$/.test(code);
}
