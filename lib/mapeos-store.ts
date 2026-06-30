import { SUCURSALES, PRODUCTO_MAP } from "./catalogo";
import { readStore, writeStore } from "./store";
import type { ProductoMap, Sucursal } from "./types";

/**
 * Mapeos efectivos = defaults del catálogo, pisados por lo que el usuario guardó
 * desde la pantalla Mapeos. Es la fuente de verdad que consumen el cruce y las
 * alertas (server-side), así editar un factor o mapear una sucursal cambia el
 * control de verdad.
 */
export interface MapeosData {
  sucursales: Sucursal[];
  productoMap: ProductoMap[];
}

const DEFAULTS = (): MapeosData => ({ sucursales: SUCURSALES, productoMap: PRODUCTO_MAP });

export async function getMapeos(): Promise<MapeosData> {
  const saved = await readStore<MapeosData | null>("mapeos", null);
  if (!saved || !Array.isArray(saved.sucursales) || !Array.isArray(saved.productoMap)) {
    return DEFAULTS();
  }
  return saved;
}

export async function saveMapeos(data: MapeosData): Promise<MapeosData> {
  const limpio: MapeosData = {
    sucursales: data.sucursales ?? [],
    productoMap: data.productoMap ?? [],
  };
  await writeStore("mapeos", limpio);
  return limpio;
}
