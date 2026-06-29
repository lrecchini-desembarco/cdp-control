// Plantilla del QA de local (reseña). Editar acá los criterios cambia el
// formulario y el imprimible en toda la app.

export interface CategoriaQA {
  nombre: string;
  criterios: string[];
}

export const ESCALA = [1, 2, 3, 4, 5] as const;
export const ESCALA_LABEL: Record<number, string> = {
  1: "Malo",
  2: "Regular",
  3: "Bien",
  4: "Muy bien",
  5: "Excelente",
};

export const QA_CATEGORIAS: CategoriaQA[] = [
  {
    nombre: "Limpieza",
    criterios: ["Salón y mesas", "Cocina", "Baños"],
  },
  {
    nombre: "Atención",
    criterios: ["Amabilidad", "Tiempo de espera", "Presentación del personal"],
  },
  {
    nombre: "Producto",
    criterios: ["Temperatura", "Presentación", "Porción según receta"],
  },
];

/** Todos los criterios aplanados (para inicializar puntajes y totales). */
export const TODOS_CRITERIOS = QA_CATEGORIAS.flatMap((c) =>
  c.criterios.map((cr) => `${c.nombre} · ${cr}`)
);
