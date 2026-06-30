import { recentDates, unidadDe, nombreInsumo, brandDeInsumo } from "./catalogo";
import { getMapeos } from "./mapeos-store";
import { getSources } from "./sources";
import type { MapeosData } from "./mapeos-store";
import type { PedidoCdp, VentaSku, RangoQuery } from "./sources/types";
import type { CruceComponente, CruceRow } from "./types";

/**
 * Combina pedidos (Raven) y ventas (Tango) en las filas del cruce. Función PURA:
 * misma entrada, misma salida. La venta equivalente se arma sumando, por insumo,
 * cada SKU vendido x su factor (el desglose que después explica el detalle).
 * Usa los mapeos efectivos (defaults + lo guardado en la pantalla Mapeos).
 */
export function construirCruce(pedidos: PedidoCdp[], ventas: VentaSku[], mapeos: MapeosData): CruceRow[] {
  const sucPorCanonico = new Map(mapeos.sucursales.map((s) => [s.canonico, s]));
  const reglasPorSku = new Map(mapeos.productoMap.map((m) => [m.skuVenta, m]));

  // 1) Acumular componentes de venta por (fecha, sucursal, insumo)
  const comps = new Map<string, Map<string, CruceComponente>>();
  for (const v of ventas) {
    const regla = reglasPorSku.get(v.sku);
    if (!regla) continue; // SKU sin receta -> no aporta (se reporta como punto ciego)
    const key = `${v.fecha}::${v.sucursalCanonico}::${regla.codigoCdp}`;
    const porSku = comps.get(key) ?? new Map<string, CruceComponente>();
    const prev = porSku.get(v.sku);
    const vendidas = (prev?.vendidas ?? 0) + v.unidades;
    porSku.set(v.sku, {
      sku: v.sku,
      nombre: regla.skuNombre,
      vendidas,
      factor: regla.factor,
      subtotal: vendidas * regla.factor,
    });
    comps.set(key, porSku);
  }

  // 2) Acumular pedidos por (fecha, sucursal, insumo)
  const ped = new Map<string, number>();
  for (const p of pedidos) {
    const key = `${p.fecha}::${p.sucursalCanonico}::${p.codigoCdp}`;
    ped.set(key, (ped.get(key) ?? 0) + p.unidades);
  }

  // 3) Unión de claves: una línea aparece si tuvo pedido O venta
  const claves = new Set<string>([...Array.from(ped.keys()), ...Array.from(comps.keys())]);
  const rows: CruceRow[] = [];
  Array.from(claves).forEach((key) => {
    const [fecha, canonico, codigoCdp] = key.split("::");
    const suc = sucPorCanonico.get(canonico);
    const componentes = Array.from((comps.get(key) ?? new Map()).values());
    const ventaEquiv = componentes.reduce((a, c) => a + c.subtotal, 0);
    rows.push({
      fecha,
      brand: suc?.brand ?? brandDeInsumo(codigoCdp),
      sucursal: suc?.nombre ?? canonico,
      codigoCdp,
      producto: nombreInsumo(codigoCdp),
      pedidoCdp: ped.get(key) ?? 0,
      ventaEquiv,
      unidad: unidadDe(codigoCdp),
      componentes,
    });
  });

  // Orden estable: fecha desc, luego sucursal, luego producto
  rows.sort(
    (a, b) =>
      b.fecha.localeCompare(a.fecha) ||
      a.sucursal.localeCompare(b.sucursal) ||
      a.producto.localeCompare(b.producto)
  );
  return rows;
}

/** Rango por defecto: últimos 7 días (incluye hoy). */
export function rangoPorDefecto(): RangoQuery {
  const fechas = recentDates(7);
  return { desde: fechas[fechas.length - 1], hasta: fechas[0] };
}

/**
 * Orquestador: trae pedidos y ventas de las fuentes configuradas (Raven + Tango,
 * o mock) y devuelve el cruce ya armado. Se usa desde las API routes y el server.
 */
export async function getCruce(q: RangoQuery = rangoPorDefecto()): Promise<CruceRow[]> {
  const { pedidos, ventas } = getSources();
  const [p, v, mapeos] = await Promise.all([pedidos.getPedidos(q), ventas.getVentas(q), getMapeos()]);
  return construirCruce(p, v, mapeos);
}
