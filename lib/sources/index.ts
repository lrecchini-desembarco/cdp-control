import type { CatalogoSource, PedidosSource, VentasSource } from "./types";

/**
 * Selector de fuentes de datos según DATA_SOURCE.
 *
 *   live (default) -> Raven (pedidos) + Tango/SQL Server (ventas)   [producción]
 *   mock           -> generador local, sin red                       [desarrollo]
 *
 * Cambiar de fuente = cambiar una variable de entorno. El resto de la app
 * (motor de cruce, alertas, UI) no se entera de dónde salen los datos.
 */
export function getSources(): { pedidos: PedidosSource; ventas: VentasSource } {
  const source = process.env.DATA_SOURCE ?? "live";

  if (source === "mock") {
    const { mockPedidosSource, mockVentasSource } = require("./mock") as typeof import("./mock");
    return { pedidos: mockPedidosSource, ventas: mockVentasSource };
  }

  // live
  const { ravenPedidosSource } = require("./raven") as typeof import("./raven");
  const { tangoVentasSource } = require("./tango") as typeof import("./tango");
  return { pedidos: ravenPedidosSource, ventas: tangoVentasSource };
}

/** Fuente del maestro de artículos (catálogo) según DATA_SOURCE. */
export function getCatalogoSource(): CatalogoSource {
  const source = process.env.DATA_SOURCE ?? "live";
  if (source === "mock") {
    const { mockCatalogoSource } = require("./catalogo-mock") as typeof import("./catalogo-mock");
    return mockCatalogoSource;
  }
  const { tangoCatalogoSource } = require("./catalogo-tango") as typeof import("./catalogo-tango");
  return tangoCatalogoSource;
}

export const dataSourceName = () => process.env.DATA_SOURCE ?? "live";
