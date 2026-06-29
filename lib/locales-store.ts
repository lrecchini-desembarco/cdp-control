import { readStore, writeStore } from "./store";
import { getMapeos } from "./mapeos-store";

/**
 * Locales para Reseñas. Se siembran con las sucursales activas, pero se pueden
 * agregar nuevos desde la pantalla (un local de reseñas no tiene por qué existir
 * todavía como sucursal en el cruce).
 */
function semilla(): string[] {
  return getMapeos()
    .sucursales.filter((s) => s.activa)
    .map((s) => s.nombre);
}

export function getLocales(): string[] {
  const saved = readStore<string[] | null>("locales", null);
  const base = Array.isArray(saved) && saved.length ? saved : semilla();
  return Array.from(new Set(base)).sort((a, b) => a.localeCompare(b));
}

export function addLocal(nombre: string): string[] {
  const n = nombre.trim();
  if (!n) throw new Error("Nombre vacío.");
  const actuales = getLocales();
  if (actuales.some((l) => l.toLowerCase() === n.toLowerCase())) return actuales;
  const nuevos = [...actuales, n];
  writeStore("locales", nuevos);
  return getLocales();
}

export function removeLocal(nombre: string): string[] {
  const nuevos = getLocales().filter((l) => l.toLowerCase() !== nombre.trim().toLowerCase());
  writeStore("locales", nuevos);
  return nuevos;
}
