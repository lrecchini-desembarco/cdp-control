import { brandById } from "./brands";
import { getCatalogoSource } from "./sources";
import type {
  ArticuloCatalogo,
  BrandId,
  ProblemaCatalogo,
  ProblemaCatalogoTipo,
  ResumenCatalogo,
  Severidad,
} from "./types";

// Activo sin vender hace más de N días => candidato a baja.
const SIN_VENTA_DIAS = 45;
const PESO: Record<Severidad, number> = { critica: 3, alta: 2, media: 1, info: 0 };

const marcaNombre = (m: BrandId | null) => (m ? brandById(m).name : "sin marca");

function diasDesde(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  const hoy = new Date();
  return Math.floor((hoy.getTime() - d.getTime()) / 86_400_000);
}

/**
 * Audita el maestro de artículos y devuelve los que tienen problemas de calidad
 * de datos, ordenados por gravedad. Función PURA. Solo mira artículos ACTIVOS:
 * un artículo dado de baja correctamente ya no ensucia el POS.
 */
export function detectarProblemasCatalogo(arts: ArticuloCatalogo[]): ProblemaCatalogo[] {
  const out: ProblemaCatalogo[] = [];

  for (const a of arts) {
    if (!a.activo) continue;
    const problemas: ProblemaCatalogo["problemas"] = [];

    // 1) Precio $0 o sin lista -> vendible a cero
    const listasCero = a.listas.filter((l) => l.precio <= 0);
    if (a.listas.length === 0) {
      problemas.push({
        tipo: "precio-cero",
        severidad: "critica",
        detalle: "Activo sin ninguna lista de precios asignada: se puede vender en $0.",
      });
    } else if (listasCero.length) {
      problemas.push({
        tipo: "precio-cero",
        severidad: "critica",
        detalle: `Precio $0 en ${listasCero.map((l) => l.nombre).join(", ")}. Vendible a cero en esa(s) caja(s).`,
      });
    }

    // 2) Cross-brand: lista de precios de otra marca
    if (a.marca) {
      const otras = a.listas.filter((l) => l.marca && l.marca !== a.marca);
      if (otras.length) {
        problemas.push({
          tipo: "cross-brand",
          severidad: "alta",
          detalle: `Marca ${marcaNombre(a.marca)} pero con lista de ${Array.from(
            new Set(otras.map((l) => marcaNombre(l.marca)))
          ).join(", ")} (${otras.map((l) => l.nombre).join(", ")}).`,
        });
      }
    }

    // 3) Sin clasificación de marca
    if (!a.marca) {
      problemas.push({
        tipo: "sin-marca",
        severidad: "media",
        detalle: "Sin clasificación de marca: aparece en el buscador de todas las marcas.",
      });
    }

    // 4) Activo sin ventas (candidato a baja)
    const d = diasDesde(a.ultimaVentaFecha);
    if (a.ultimaVentaFecha === null) {
      problemas.push({
        tipo: "sin-venta",
        severidad: "media",
        detalle: "Activo pero nunca registró ventas. Candidato a dar de baja.",
      });
    } else if (d !== null && d > SIN_VENTA_DIAS) {
      problemas.push({
        tipo: "sin-venta",
        severidad: "media",
        detalle: `Activo pero sin ventas hace ${d} días. Candidato a dar de baja.`,
      });
    }

    if (problemas.length) {
      const severidad = problemas.reduce<Severidad>(
        (m, p) => (PESO[p.severidad] > PESO[m] ? p.severidad : m),
        "media"
      );
      out.push({ sku: a.sku, nombre: a.nombre, marca: a.marca, activo: a.activo, severidad, problemas });
    }
  }

  return out.sort(
    (a, b) => PESO[b.severidad] - PESO[a.severidad] || b.problemas.length - a.problemas.length
  );
}

const TIPOS: ProblemaCatalogoTipo[] = ["precio-cero", "cross-brand", "sin-marca", "sin-venta"];

export function resumenCatalogo(probs: ProblemaCatalogo[], totalArticulos: number): ResumenCatalogo {
  const porTipo = Object.fromEntries(TIPOS.map((t) => [t, 0])) as Record<ProblemaCatalogoTipo, number>;
  for (const p of probs) for (const pr of p.problemas) porTipo[pr.tipo]++;
  return { articulos: totalArticulos, conProblemas: probs.length, porTipo };
}

/** Orquestador: trae el catálogo de la fuente configurada y corre la auditoría. */
export async function getControlCatalogo(): Promise<{
  problemas: ProblemaCatalogo[];
  resumen: ResumenCatalogo;
}> {
  const arts = await getCatalogoSource().getCatalogo();
  const problemas = detectarProblemasCatalogo(arts);
  return { problemas, resumen: resumenCatalogo(problemas, arts.length) };
}
