import type { CatalogoSource, PedidosSource, VentasSource, PreciosSource } from "./types";

/**
 * Selector de fuentes de datos.
 *
 *   live (default) -> Raven (pedidos) + Tango/SQL Server (ventas)   [producción]
 *   mock           -> generador local, sin red                       [desarrollo]
 *
 * DATA_SOURCE fija el default global, pero cada fuente se puede pisar por
 * separado para prender una sola sin las demás (ej. Tango ventas live mientras
 * Raven/catálogo siguen en mock hasta tener token / vista):
 *   PEDIDOS_SOURCE, VENTAS_SOURCE, CATALOGO_SOURCE  (live | mock)
 */
function resolver(especifica: string): "live" | "mock" {
  const v = process.env[especifica] ?? process.env.DATA_SOURCE ?? "live";
  return v === "mock" ? "mock" : "live";
}

export function getSources(): { pedidos: PedidosSource; ventas: VentasSource } {
  const m = require("./mock") as typeof import("./mock");
  const pedidos =
    resolver("PEDIDOS_SOURCE") === "mock"
      ? m.mockPedidosSource
      : (require("./raven") as typeof import("./raven")).ravenPedidosSource;
  const ventas =
    resolver("VENTAS_SOURCE") === "mock"
      ? m.mockVentasSource
      : (require("./tango") as typeof import("./tango")).tangoVentasSource;
  return { pedidos, ventas };
}

/** Fuente de precios de productos (Tango, o mock). Pisable con PRECIOS_SOURCE. */
export function getPreciosSource(): PreciosSource {
  if (resolver("PRECIOS_SOURCE") === "mock") {
    return (require("./mock") as typeof import("./mock")).mockPreciosSource;
  }
  return (require("./tango") as typeof import("./tango")).tangoPreciosSource;
}

/** Fuente del maestro de artículos (catálogo). */
export function getCatalogoSource(): CatalogoSource {
  if (resolver("CATALOGO_SOURCE") === "mock") {
    return (require("./catalogo-mock") as typeof import("./catalogo-mock")).mockCatalogoSource;
  }
  return (require("./catalogo-tango") as typeof import("./catalogo-tango")).tangoCatalogoSource;
}

export const dataSourceName = () => process.env.DATA_SOURCE ?? "live";
/** Fuente efectiva por dominio (para el badge "en vivo / ejemplo"). */
export const preciosSourceName = () => resolver("PRECIOS_SOURCE");
