import { getPreciosSource } from "./sources";
import type { PrecioProducto } from "./sources/types";

// Precio "general" por producto: agrega las sucursales (precio representativo =
// el de la sucursal con la venta más reciente) + rango min/max entre sucursales.
export interface PrecioGeneral {
  sku: string;
  nombre: string;
  precio: number; // representativo (más reciente) con impuestos
  precioNeto: number;
  min: number; // menor PVP entre sucursales
  max: number; // mayor PVP entre sucursales
  sucursales: number; // en cuántas sucursales hay precio
  actualizado?: string;
}

export interface PreciosData {
  general: PrecioGeneral[];
  sucursales: string[]; // sucursales con precios (para el filtro)
  porSucursal?: PrecioProducto[]; // solo si se pide una sucursal
}

export async function getPrecios(sucursal?: string): Promise<PreciosData> {
  const rows = await getPreciosSource().getPrecios();

  const bySku = new Map<string, PrecioProducto[]>();
  for (const r of rows) {
    const arr = bySku.get(r.sku);
    if (arr) arr.push(r);
    else bySku.set(r.sku, [r]);
  }

  const general: PrecioGeneral[] = [];
  bySku.forEach((list, sku) => {
    const precios = list.map((l) => l.precio).filter((p) => p > 0);
    const latest = [...list].sort((a, b) => (b.actualizado ?? "").localeCompare(a.actualizado ?? ""))[0];
    general.push({
      sku,
      nombre: latest.nombre,
      precio: latest.precio,
      precioNeto: latest.precioNeto,
      min: precios.length ? Math.min(...precios) : 0,
      max: precios.length ? Math.max(...precios) : 0,
      sucursales: list.length,
      actualizado: latest.actualizado,
    });
  });
  general.sort((a, b) => a.nombre.localeCompare(b.nombre));

  const sucursales = Array.from(new Set(rows.map((r) => r.sucursal))).sort((a, b) => a.localeCompare(b));
  const porSucursal = sucursal
    ? rows.filter((r) => r.sucursal === sucursal).sort((a, b) => a.nombre.localeCompare(b.nombre))
    : undefined;

  return { general, sucursales, porSucursal };
}
