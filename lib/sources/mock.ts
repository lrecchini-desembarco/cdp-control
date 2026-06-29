import { SUCURSALES, PRODUCTO_MAP, recentDates, brandDeInsumo } from "../catalogo";
import type { PedidoCdp, VentaSku, PedidosSource, VentasSource, RangoQuery } from "./types";

// Fuente de DESARROLLO. No se usa en producción (DATA_SOURCE=live). Genera
// ventas por SKU y pedidos al CDP por separado, con el mismo shape que las
// fuentes reales, para poder iterar la UI y testear el motor de cruce sin red.

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function fechasEnRango(q: RangoQuery): string[] {
  // Reusa el helper de fechas recientes acotado al rango pedido.
  const todas = recentDates(60);
  return todas.filter((f) => f >= q.desde && f <= q.hasta).sort();
}

/** Sucursales que sí entran al cruce (activas y mapeadas). */
const mapeadas = () => SUCURSALES.filter((s) => s.activa && s.canonico);

export const mockVentasSource: VentasSource = {
  async getVentas(q: RangoQuery): Promise<VentaSku[]> {
    const fechas = fechasEnRango(q);
    const out: VentaSku[] = [];
    const r = rng(7); // un solo stream continuo (evita sesgo de primer valor)
    for (const s of mapeadas()) {
      // Solo SKUs cuyo insumo es de la misma marca que la sucursal.
      const reglas = PRODUCTO_MAP.filter((m) => brandDeInsumo(m.codigoCdp) === s.brand);
      for (const m of reglas) {
        for (const fecha of fechas) {
          const unidades = 40 + Math.floor(r() * 320);
          out.push({ fecha, sku: m.skuVenta, sucursalCanonico: s.canonico, unidades });
        }
      }
    }
    return out;
  },
};

export const mockPedidosSource: PedidosSource = {
  async getPedidos(q: RangoQuery): Promise<PedidoCdp[]> {
    // El pedido al CDP se deriva de la venta equivalente (ventas x factor) con
    // un desvío, para que el cruce muestre sub/sobre-pedidos realistas.
    const ventas = await mockVentasSource.getVentas(q);
    const factorPorSku = new Map(PRODUCTO_MAP.map((m) => [m.skuVenta, m]));

    // Venta equivalente por (fecha, sucursal, codigoCdp)
    const equiv = new Map<string, { fecha: string; suc: string; code: string; v: number }>();
    for (const venta of ventas) {
      const m = factorPorSku.get(venta.sku);
      if (!m) continue;
      const k = `${venta.fecha}::${venta.sucursalCanonico}::${m.codigoCdp}`;
      const acc = equiv.get(k) ?? {
        fecha: venta.fecha,
        suc: venta.sucursalCanonico,
        code: m.codigoCdp,
        v: 0,
      };
      acc.v += venta.unidades * m.factor;
      equiv.set(k, acc);
    }

    const out: PedidoCdp[] = [];
    const r = rng(99); // stream continuo
    for (const e of Array.from(equiv.values())) {
      const drift = (r() - 0.5) * 0.5; // -25%..+25%
      out.push({
        fecha: e.fecha,
        codigoCdp: e.code,
        sucursalCanonico: e.suc,
        unidades: Math.max(1, Math.round(e.v * (1 + drift))),
      });
    }
    return out;
  },
};
