import { readStore, writeStore } from "./store";

/**
 * Silenciados: alertas que el usuario pospuso. Se guardan por id con una fecha
 * "hasta" (ISO). Mientras estén vigentes, se ocultan de la lista, del contador
 * urgente y de las notificaciones. Al vencer, vuelven a aparecer solas.
 */
export interface Silencio {
  id: string;
  hasta: string | null; // ISO date; null = indefinido
  motivo?: string;
}

type SilenciosMap = Record<string, Silencio>;

async function todasVigentes(): Promise<SilenciosMap> {
  const map = await readStore<SilenciosMap>("silencios", {});
  const hoy = new Date().toISOString().slice(0, 10);
  // Limpia los vencidos al leer (así no se acumulan).
  let cambio = false;
  for (const id of Object.keys(map)) {
    const h = map[id].hasta;
    if (h && h < hoy) {
      delete map[id];
      cambio = true;
    }
  }
  if (cambio) await writeStore("silencios", map);
  return map;
}

/** Set de ids actualmente silenciados (vigentes). */
export async function idsSilenciados(): Promise<Set<string>> {
  return new Set(Object.keys(await todasVigentes()));
}

export async function listarSilencios(): Promise<Silencio[]> {
  return Object.values(await todasVigentes());
}

/** Silencia una alerta por N días (o indefinido si dias = null). */
export async function silenciar(id: string, dias: number | null, motivo?: string): Promise<Silencio> {
  const map = await todasVigentes();
  let hasta: string | null = null;
  if (dias != null) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    hasta = d.toISOString().slice(0, 10);
  }
  map[id] = { id, hasta, motivo };
  await writeStore("silencios", map);
  return map[id];
}

export async function quitarSilencio(id: string): Promise<void> {
  const map = await todasVigentes();
  if (map[id]) {
    delete map[id];
    await writeStore("silencios", map);
  }
}
