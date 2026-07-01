import { getSources } from "./sources";
import { rangoPorDefecto } from "./cruce";
import { getMapeos } from "./mapeos-store";
import { brandDeInsumo } from "./catalogo";
import type { RangoQuery } from "./sources/types";

export interface ArticuloVentas {
  sku: string;
  nombre: string;
  marca: string;
  porTurno: Record<string, number>;
  total: number;
}

export interface VentasPorTurno {
  articulos: ArticuloVentas[];
  totalPorTurno: Record<string, number>;
  total: number;
  sucursales: { canonico: string; nombre: string }[];
}

/**
 * Agrupa las ventas (de la fuente configurada) por artículo y turno, con
 * filtros opcionales por sucursal y marca. La marca de cada SKU se deduce
 * del mapeo (skuVenta -> insumo CDP -> marca).
 */
export async function getVentasPorTurno(
  q: RangoQuery = rangoPorDefecto(),
  filtros?: { sucursal?: string; marca?: string }
): Promise<VentasPorTurno> {
  const { ventas } = getSources();
  const [data, mapeos] = await Promise.all([ventas.getVentas(q), getMapeos()]);
  const reglaPorSku = new Map(mapeos.productoMap.map((m) => [m.skuVenta, m]));
  const sucursales = mapeos.sucursales
    .filter((s) => s.activa && s.canonico)
    .map((s) => ({ canonico: s.canonico, nombre: s.nombre }));

  const map = new Map<string, ArticuloVentas>();
  const totalPorTurno: Record<string, number> = {};
  let total = 0;

  for (const v of data) {
    if (filtros?.sucursal && v.sucursalCanonico !== filtros.sucursal) continue;
    const regla = reglaPorSku.get(v.sku);
    const marca = regla ? brandDeInsumo(regla.codigoCdp) : "otros";
    if (filtros?.marca && marca !== filtros.marca) continue;

    const turno = v.turno ?? "noche";
    let a = map.get(v.sku);
    if (!a) {
      a = { sku: v.sku, nombre: regla?.skuNombre ?? v.nombre ?? v.sku, marca, porTurno: {}, total: 0 };
      map.set(v.sku, a);
    }
    a.porTurno[turno] = (a.porTurno[turno] ?? 0) + v.unidades;
    a.total += v.unidades;
    totalPorTurno[turno] = (totalPorTurno[turno] ?? 0) + v.unidades;
    total += v.unidades;
  }

  const articulos = Array.from(map.values()).sort((a, b) => b.total - a.total);
  return { articulos, totalPorTurno, total, sucursales };
}

/** Unidades vendidas totales por sucursal en el rango (para auditar cobertura vs remitos). */
export async function getVentasPorSucursal(q: RangoQuery = rangoPorDefecto()): Promise<{ sucursal: string; unidades: number }[]> {
  const { ventas } = getSources();
  const data = await ventas.getVentas(q);
  const map = new Map<string, number>();
  for (const v of data) map.set(v.sucursalCanonico, (map.get(v.sucursalCanonico) ?? 0) + v.unidades);
  return Array.from(map, ([sucursal, unidades]) => ({ sucursal, unidades })).sort((a, b) => b.unidades - a.unidades);
}
