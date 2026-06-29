// Turnos de servicio. Editar acá cambia el desglose en toda la app.
// hastaHora > 24 representa pasada la medianoche (ej. 26 = 2 AM).

export interface Turno {
  slug: string;
  label: string;
  desdeHora: number;
  hastaHora: number;
}

export const TURNOS: Turno[] = [
  { slug: "mediodia", label: "Mediodía", desdeHora: 11, hastaHora: 16 },
  { slug: "tarde", label: "Tarde", desdeHora: 16, hastaHora: 20 },
  { slug: "noche", label: "Noche", desdeHora: 20, hastaHora: 26 },
];

export const TURNO_SLUGS = TURNOS.map((t) => t.slug);

export const turnoLabel = (slug: string) => TURNOS.find((t) => t.slug === slug)?.label ?? slug;

/** Asigna un turno a una hora (0-23). Lo que no cae en mediodía/tarde es noche. */
export function turnoDeHora(hora: number): string {
  for (const t of TURNOS) {
    const h = hora < t.desdeHora && t.hastaHora > 24 ? hora + 24 : hora;
    if (h >= t.desdeHora && h < t.hastaHora) return t.slug;
  }
  return "noche";
}
