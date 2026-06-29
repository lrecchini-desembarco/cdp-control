import { readStore, writeStore } from "./store";
import { getMapeos } from "./mapeos-store";

/**
 * Locales para Reseñas. Cada uno con su marca (para generar QR por marca) y su
 * link de "dejar reseña en Google" (opcional). Se siembran con las sucursales
 * activas y se editan/agregan desde la consola de reseñas (admin).
 */
export type MarcaSlug = "desembarco" | "tasty" | "mila" | "otros";

export interface Local {
  nombre: string;
  googleUrl?: string;
  marca?: MarcaSlug;
}

/** Deduce la marca por el nombre cuando no viene explícita. */
export function marcaDeNombre(nombre: string): MarcaSlug {
  const n = nombre.toLowerCase();
  if (n.includes("desembarco")) return "desembarco";
  if (n.includes("tasty")) return "tasty";
  if (n.includes("mila")) return "mila";
  return "otros";
}

function semilla(): Local[] {
  return getMapeos()
    .sucursales.filter((s) => s.activa)
    .map((s) => ({ nombre: s.nombre, marca: marcaDeNombre(s.nombre) }));
}

function normalizar(raw: unknown): Local[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((x) => {
    const l = (typeof x === "string" ? { nombre: x } : { ...(x as Local) }) as Local;
    if (!l.marca) l.marca = marcaDeNombre(l.nombre);
    return l;
  });
}

export function getLocales(): Local[] {
  const base = normalizar(readStore<unknown>("locales", null)) ?? semilla();
  return [...base].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function findLocal(nombre: string): Local | undefined {
  const n = nombre.trim().toLowerCase();
  return getLocales().find((l) => l.nombre.toLowerCase() === n);
}

export function upsertLocal(nombre: string, googleUrl?: string, marca?: MarcaSlug): Local[] {
  const n = nombre.trim();
  if (!n) throw new Error("Nombre vacío.");
  const previo = findLocal(n);
  const otros = getLocales().filter((l) => l.nombre.toLowerCase() !== n.toLowerCase());
  const local: Local = {
    nombre: n,
    googleUrl: googleUrl !== undefined ? googleUrl.trim() : previo?.googleUrl,
    marca: marca ?? previo?.marca ?? marcaDeNombre(n),
  };
  if (!local.googleUrl) delete local.googleUrl;
  writeStore("locales", [...otros, local]);
  return getLocales();
}

export function removeLocal(nombre: string): Local[] {
  const nuevos = getLocales().filter((l) => l.nombre.toLowerCase() !== nombre.trim().toLowerCase());
  writeStore("locales", nuevos);
  return nuevos;
}
