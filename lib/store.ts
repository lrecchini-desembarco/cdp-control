import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

/**
 * Persistencia (server-only). Dos backends, misma interfaz async:
 *   - Vercel KV  : si está la env KV_REST_API_URL (producción / serverless).
 *   - Archivos   : .data/*.json (local / server con disco persistente).
 * Cambiar de backend no toca el resto de la app.
 */

const DIR = join(process.cwd(), ".data");
const usaKV = () => Boolean(process.env.KV_REST_API_URL);

// import perezoso: @vercel/kv solo se carga si hay KV configurado.
function getKv() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return (require("@vercel/kv") as typeof import("@vercel/kv")).kv;
}

export async function readStore<T>(name: string, fallback: T): Promise<T> {
  if (usaKV()) {
    try {
      const v = await getKv().get<T>(`cdp:${name}`);
      return v ?? fallback;
    } catch {
      return fallback;
    }
  }
  try {
    return JSON.parse(await readFile(join(DIR, `${name}.json`), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeStore<T>(name: string, value: T): Promise<void> {
  if (usaKV()) {
    await getKv().set(`cdp:${name}`, value as any);
    return;
  }
  if (!existsSync(DIR)) await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, `${name}.json`), JSON.stringify(value, null, 2), "utf8");
}
