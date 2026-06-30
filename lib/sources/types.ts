/**
 * Contratos de datos crudos. La app no sabe de dónde vienen (Raven, Tango/SQL,
 * Sheets…): cualquier adapter devuelve este shape y el motor de cruce los combina.
 */

/** Una línea de pedido al CDP: cuánto pidió una sucursal de un insumo, un día. */
export interface PedidoCdp {
  fecha: string;            // ISO AAAA-MM-DD
  codigoCdp: string;        // código del insumo
  sucursalCanonico: string; // código canónico de la sucursal (DS-FLO…)
  unidades: number;
}

/** Una línea de venta: unidades vendidas de un SKU en una sucursal, un día y turno. */
export interface VentaSku {
  fecha: string;            // ISO AAAA-MM-DD
  sku: string;              // Cód. Art. Tango del producto vendido
  nombre?: string;          // descripción del artículo (DESC_CTA_ARTICULO)
  sucursalCanonico: string; // código canónico de la sucursal
  unidades: number;
  turno?: string;           // mediodia | tarde | noche (slug de lib/turnos)
}

/** Rango de consulta común a todas las fuentes. */
export interface RangoQuery {
  desde: string; // ISO
  hasta: string; // ISO
}

/** Fuente de pedidos al CDP (hoy: Raven). */
export interface PedidosSource {
  getPedidos(q: RangoQuery): Promise<PedidoCdp[]>;
}

/** Fuente de ventas por SKU (hoy: Tango / SQL Server). */
export interface VentasSource {
  getVentas(q: RangoQuery): Promise<VentaSku[]>;
}

/** Fuente del maestro de artículos para auditar calidad de datos (hoy: Tango). */
export interface CatalogoSource {
  getCatalogo(): Promise<import("../types").ArticuloCatalogo[]>;
}
