import { readStore, writeStore } from "./store";
import seed from "./locales-seed.json";

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

// Locales sembrados (los 109 reales del Excel Maps). Es el default cuando el
// store está vacío — clave para que en prod (disco solo-lectura) igual se vean.
function semilla(): Local[] {
  return (seed as Local[]).map((l) => ({ ...l, marca: (l.marca as MarcaSlug) ?? marcaDeNombre(l.nombre) }));
}

function normalizar(raw: unknown): Local[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((x) => {
    const l = (typeof x === "string" ? { nombre: x } : { ...(x as Local) }) as Local;
    if (!l.marca) l.marca = marcaDeNombre(l.nombre);
    return l;
  });
}

export async function getLocales(): Promise<Local[]> {
  const base = normalizar(await readStore<unknown>("locales", null)) ?? semilla();
  return [...base].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function findLocal(nombre: string): Promise<Local | undefined> {
  const n = nombre.trim().toLowerCase();
  return (await getLocales()).find((l) => l.nombre.toLowerCase() === n);
}

export async function upsertLocal(nombre: string, googleUrl?: string, marca?: MarcaSlug): Promise<Local[]> {
  const n = nombre.trim();
  if (!n) throw new Error("Nombre vacío.");
  const actuales = await getLocales();
  const previo = actuales.find((l) => l.nombre.toLowerCase() === n.toLowerCase());
  const otros = actuales.filter((l) => l.nombre.toLowerCase() !== n.toLowerCase());
  const local: Local = {
    nombre: n,
    googleUrl: googleUrl !== undefined ? googleUrl.trim() : previo?.googleUrl,
    marca: marca ?? previo?.marca ?? marcaDeNombre(n),
  };
  if (!local.googleUrl) delete local.googleUrl;
  await writeStore("locales", [...otros, local]);
  return getLocales();
}

export async function removeLocal(nombre: string): Promise<Local[]> {
  const nuevos = (await getLocales()).filter((l) => l.nombre.toLowerCase() !== nombre.trim().toLowerCase());
  await writeStore("locales", nuevos);
  return nuevos;
}
