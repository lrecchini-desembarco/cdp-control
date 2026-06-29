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

function todasVigentes(): SilenciosMap {
  const map = readStore<SilenciosMap>("silencios", {});
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
  if (cambio) writeStore("silencios", map);
  return map;
}

/** Set de ids actualmente silenciados (vigentes). */
export function idsSilenciados(): Set<string> {
  return new Set(Object.keys(todasVigentes()));
}

export function listarSilencios(): Silencio[] {
  return Object.values(todasVigentes());
}

/** Silencia una alerta por N días (o indefinido si dias = null). */
export function silenciar(id: string, dias: number | null, motivo?: string): Silencio {
  const map = todasVigentes();
  let hasta: string | null = null;
  if (dias != null) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    hasta = d.toISOString().slice(0, 10);
  }
  map[id] = { id, hasta, motivo };
  writeStore("silencios", map);
  return map[id];
}

export function quitarSilencio(id: string): void {
  const map = todasVigentes();
  if (map[id]) {
    delete map[id];
    writeStore("silencios", map);
  }
}
