import type { ArticuloCatalogo, ListaPrecio } from "../types";
import type { CatalogoSource } from "./types";

// Catálogo de DESARROLLO. Reproduce los problemas reales vistos en Tango para
// poder iterar el Control de catálogo sin conexión. No se usa en producción.

function isoMinusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Listas de precios con su marca (como en Tango: "MR TASTY AMBA", "DESEMBARCO AMBA"…)
const L = {
  tastyAmba: (precio: number): ListaPrecio => ({ lista: 2, nombre: "MR TASTY AMBA", marca: "tasty", precio }),
  tastyPeya: (precio: number): ListaPrecio => ({ lista: 3, nombre: "PEYA MR TASTY AMBA", marca: "tasty", precio }),
  desemAmba: (precio: number): ListaPrecio => ({ lista: 4, nombre: "DESEMBARCO AMBA PEYA", marca: "desembarco", precio }),
  milaAmba: (precio: number): ListaPrecio => ({ lista: 7, nombre: "MILA & GO AMBA", marca: "mila", precio }),
};

const CATALOGO: ArticuloCatalogo[] = [
  // OK — bien cargados
  { sku: "138005", nombre: "Doble cuarto con queso carne Tasty sin papas", marca: "tasty", activo: true, ultimaVentaFecha: isoMinusDays(1), listas: [L.tastyAmba(5000), L.tastyPeya(5800)] },
  { sku: "210010", nombre: "Empanada de carne", marca: "desembarco", activo: true, ultimaVentaFecha: isoMinusDays(1), listas: [L.desemAmba(1800)] },
  { sku: "150001", nombre: "Milanesa clásica de carne", marca: "mila", activo: true, ultimaVentaFecha: isoMinusDays(2), listas: [L.milaAmba(2200)] },

  // precio $0 (vendibles a cero)
  { sku: "138078", nombre: "Doble cuarto con queso 55gr", marca: "tasty", activo: true, ultimaVentaFecha: isoMinusDays(3), listas: [L.tastyAmba(0)] },
  { sku: "508005", nombre: "Doble cuarto + estuche de papas Tasty", marca: "tasty", activo: true, ultimaVentaFecha: null, listas: [L.tastyAmba(0)] },

  // precio $0 + sin venta hace mucho (discontinuado que sigue activo)
  { sku: "138093", nombre: "Burger doble cuarto con queso 55g + papas", marca: "tasty", activo: true, ultimaVentaFecha: isoMinusDays(80), listas: [L.tastyAmba(0)] },

  // cross-brand: artículo Tasty con lista de Desembarco (caso 198006 de la captura)
  { sku: "198006", nombre: "Adicional medallón carne 80g Tasty", marca: "tasty", activo: true, ultimaVentaFecha: isoMinusDays(2), listas: [L.tastyAmba(1200), L.desemAmba(1200)] },

  // sin marca (sin clasificar) — ensucia el filtro
  { sku: "305010", nombre: "Agua sin gas 500ml", marca: null, activo: true, ultimaVentaFecha: isoMinusDays(1), listas: [L.tastyAmba(900), L.desemAmba(900)] },

  // basura: sin marca + sin venta hace 200 días + precio $0 (todo junto)
  { sku: "999001", nombre: "Promo invierno 2024 (vieja)", marca: null, activo: true, ultimaVentaFecha: isoMinusDays(200), listas: [L.tastyAmba(0)] },

  // candidato a baja: activo, con precio, pero sin ventas hace rato
  { sku: "138003", nombre: "Burger bacon de carne", marca: "tasty", activo: true, ultimaVentaFecha: isoMinusDays(60), listas: [L.tastyAmba(4800)] },

  // dado de baja (no se audita: ya no se vende)
  { sku: "100099", nombre: "Combo verano 2023 (baja)", marca: "tasty", activo: false, ultimaVentaFecha: isoMinusDays(400), listas: [L.tastyAmba(0)] },
];

export const mockCatalogoSource: CatalogoSource = {
  async getCatalogo(): Promise<ArticuloCatalogo[]> {
    return CATALOGO;
  },
};
