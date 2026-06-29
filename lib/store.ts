import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

/**
 * Persistencia simple en archivos JSON (server-only). Es la "costura" de
 * persistencia: hoy escribe en `.data/` (sirve en local y en un server con disco
 * persistente). Para serverless (Vercel) se reemplaza esta única pieza por un
 * KV/DB (Vercel KV, Postgres, etc.) sin tocar el resto de la app.
 */

const DIR = join(process.cwd(), ".data");

export function readStore<T>(name: string, fallback: T): T {
  try {
    const raw = readFileSync(join(DIR, `${name}.json`), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(name: string, value: T): void {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  writeFileSync(join(DIR, `${name}.json`), JSON.stringify(value, null, 2), "utf8");
}
