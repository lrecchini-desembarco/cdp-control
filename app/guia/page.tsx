import Link from "next/link";
import { Card } from "@/components/ui/primitives";

export const metadata = { title: "Guía · CDP Control" };

type Capacidad = {
  titulo: string;
  paraQue: string;
  pasos: string[];
  href: string;
  cta: string;
};

const CAPACIDADES: Capacidad[] = [
  {
    titulo: "Ver el cruce de un período",
    paraQue: "Detectar dónde una sucursal pidió de más o de menos al CDP frente a lo que vendió.",
    pasos: [
      "Entrá a Cruce CDP vs ventas.",
      "Elegí el rango con Desde/Hasta, o un atajo: Hoy · 7 · 14 · 30 días.",
      'Ordená por "Mayor desvío" para ver primero lo que más se desvía.',
      "Tocá una fila para ver el desglose (qué productos lo explican) y saltar a Raven o a la receta.",
    ],
    href: "/cruce",
    cta: "Ir al cruce",
  },
  {
    titulo: "Atender las alertas",
    paraQue: "Que el sistema te diga qué mirar primero: quiebres, sobre-pedidos y puntos ciegos.",
    pasos: [
      "Entrá a Alertas. Mirá las críticas (rojo) primero.",
      'Usá "Ver en el cruce" o "Revisar la regla" para ir directo a resolverlo.',
      'Si algo no aplica ahora, tocá "Silenciar 7d": deja de molestar y vuelve solo al vencer.',
      'Lo silenciado queda en la sección "Silenciadas", con "Reactivar".',
    ],
    href: "/alertas",
    cta: "Ir a alertas",
  },
  {
    titulo: "Avisar al equipo (resumen)",
    paraQue: "Que lo urgente llegue solo, sin que nadie tenga que entrar a mirar.",
    pasos: [
      'En Alertas, tocá "Enviar resumen ahora" para mandarlo en el momento.',
      "Junta las alertas urgentes + los problemas críticos de catálogo.",
      "Para que salga automático (Slack, todas las mañanas): lo configura sistemas (ver docs/notificaciones).",
    ],
    href: "/alertas",
    cta: "Probar el resumen",
  },
  {
    titulo: "Controlar el catálogo",
    paraQue: "Encontrar artículos en $0, con marca cruzada, sin clasificar o que conviene dar de baja.",
    pasos: [
      "Entrá a Control de catálogo.",
      "Filtrá por tipo de problema (precio $0, cross-brand, sin marca, sin venta).",
      'Tocá "Exportar a corregir (CSV)" y pasásela al equipo de sistemas.',
      'Cómo se arregla cada uno está al pie, en "¿Cómo se corrige en Tango?".',
    ],
    href: "/catalogo",
    cta: "Ir al catálogo",
  },
  {
    titulo: "Editar los mapeos",
    paraQue: "Enseñarle al sistema qué insumo consume cada producto (la receta) y qué sucursal es cuál.",
    pasos: [
      "Entrá a Mapeos.",
      'Pestaña "Productos · BOM" para los factores; "Sucursales" para los códigos.',
      "Editá el valor que haga falta.",
      '"Guardar cambios" — queda guardado y cambia el cruce y las alertas al instante.',
    ],
    href: "/mapeos",
    cta: "Ir a mapeos",
  },
  {
    titulo: "Consultar Raven",
    paraQue: "Ver el pedido de un insumo para una fecha, desglosado por sucursal.",
    pasos: ["Entrá a Consultar Raven.", "Escribí el código del insumo y la fecha de entrega.", "Tocá Consultar."],
    href: "/raven",
    cta: "Consultar Raven",
  },
];

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">¿Qué puedo hacer acá?</h1>
        <p className="mt-0.5 max-w-2xl text-sm text-muted">
          Este tablero compara lo que cada sucursal <span className="font-medium">pide al CDP</span> contra
          lo que <span className="font-medium">vende</span> (traducido a insumo), vigila los desvíos y la
          calidad de datos, y te avisa qué resolver. Acá tenés todo lo que podés hacer y cómo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {CAPACIDADES.map((c, i) => (
          <Card key={c.titulo} className="flex flex-col p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-action/10 font-mono text-2xs font-semibold text-action">
                {i + 1}
              </span>
              <h2 className="font-display text-sm font-semibold text-ink">{c.titulo}</h2>
            </div>
            <p className="mb-2 text-xs text-muted">{c.paraQue}</p>
            <ol className="mb-3 space-y-1">
              {c.pasos.map((p, j) => (
                <li key={j} className="flex gap-2 text-xs text-ink">
                  <span className="text-faint">{j + 1}.</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
            <Link
              href={c.href}
              className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-action/40 hover:text-action"
            >
              {c.cta} →
            </Link>
          </Card>
        ))}
      </div>

      {/* Límite honesto */}
      <Card className="border-l-4 border-l-line p-4">
        <h2 className="font-display text-sm font-semibold text-ink">Lo que se hace en Tango (no acá)</h2>
        <p className="mt-1 text-xs text-muted">
          El tablero <span className="font-medium">lee</span> Tango y Raven, no los modifica. Cargar o cambiar
          precios, dar de baja un artículo, clasificar su marca o asignarle sucursales se hace en el maestro de
          Tango. Acá los <span className="font-medium">detectás y exportás</span> (Control de catálogo) para que
          el equipo de sistemas los corrija, y controlás que queden limpios.
        </p>
      </Card>
    </div>
  );
}
