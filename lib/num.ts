// Parseo numérico tolerante a formato es-AR ("1.234,56", "1.200") e inglés ("1,234.56").
// Para leer números que vienen de CSV/Excel/scrape, donde "." y "," se confunden.
//
// Reglas (en este orden):
//  - Si están los DOS separadores, el ÚLTIMO es el decimal (es-AR: coma; inglés: punto).
//  - Si solo hay COMA: una coma = decimal es-AR ("12,5"); varias comas = miles inglés ("1,234,567").
//  - Si solo hay PUNTO(S): en es-AR suele ser separador de MILES. Es decimal solo si hay un
//    único punto seguido de 1 o 2 dígitos ("12.5"); con 3 dígitos o varios puntos = miles ("1.200").
export function parseNumero(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let t = String(v ?? "").replace(/[^0-9.,-]/g, "").trim();
  if (!t) return 0;
  const neg = t.startsWith("-");
  t = t.replace(/-/g, "");
  const c = t.lastIndexOf(","), d = t.lastIndexOf(".");
  if (c >= 0 && d >= 0) {
    t = c > d ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (c >= 0) {
    const comas = (t.match(/,/g) || []).length;
    t = comas > 1 ? t.replace(/,/g, "") : t.replace(",", ".");
  } else if (d >= 0) {
    const parts = t.split(".");
    if (parts.length > 2 || parts[parts.length - 1].length === 3) t = t.replace(/\./g, "");
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? (neg ? -n : n) : 0;
}
