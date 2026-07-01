import { recentDates, brandDeInsumo } from "../catalogo";
import { getMapeos } from "../mapeos-store";
import { TURNOS } from "../turnos";
import type {
  PedidoCdp,
  VentaSku,
  PedidosSource,
  VentasSource,
  RangoQuery,
  PrecioProducto,
  PreciosSource,
} from "./types";

// Peso de cada turno (la noche concentra más venta en gastronomía).
const PESO_TURNO: Record<string, number> = { mediodia: 0.4, tarde: 0.15, noche: 0.45 };

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

export const mockVentasSource: VentasSource = {
  async getVentas(q: RangoQuery): Promise<VentaSku[]> {
    const { sucursales, productoMap } = await getMapeos();
    const mapeadas = sucursales.filter((s) => s.activa && s.canonico);
    const fechas = fechasEnRango(q);
    const out: VentaSku[] = [];
    const r = rng(7); // un solo stream continuo (evita sesgo de primer valor)
    for (const s of mapeadas) {
      // Solo SKUs cuyo insumo es de la misma marca que la sucursal.
      const reglas = productoMap.filter((m) => brandDeInsumo(m.codigoCdp) === s.brand);
      for (const m of reglas) {
        for (const fecha of fechas) {
          const diario = 40 + Math.floor(r() * 320);
          for (const t of TURNOS) {
            const peso = PESO_TURNO[t.slug] ?? 1 / TURNOS.length;
            const unidades = Math.max(0, Math.round(diario * peso * (0.7 + r() * 0.6)));
            out.push({ fecha, sku: m.skuVenta, sucursalCanonico: s.canonico, unidades, turno: t.slug });
          }
        }
      }
    }
    return out;
  },
};

export const mockPreciosSource: PreciosSource = {
  async getPrecios(): Promise<PrecioProducto[]> {
    const { sucursales, productoMap } = await getMapeos();
    const mapeadas = sucursales.filter((s) => s.activa && s.canonico);
    const hoy = recentDates(1)[0];
    const r = rng(31);
    const out: PrecioProducto[] = [];
    for (const m of productoMap) {
      const base = 1500 + Math.floor(r() * 8000); // PVP base con impuestos
      for (const s of mapeadas.filter((su) => su.brand === brandDeInsumo(m.codigoCdp))) {
        const precio = Math.round((base * (0.95 + r() * 0.15)) / 10) * 10; // varía por sucursal
        out.push({
          sku: m.skuVenta,
          nombre: m.skuNombre ?? m.skuVenta,
          sucursal: s.nombre,
          precio,
          precioNeto: Math.round(precio / 1.21),
          actualizado: hoy,
        });
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
    const factorPorSku = new Map((await getMapeos()).productoMap.map((m) => [m.skuVenta, m]));

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
