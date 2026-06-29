# Control de catálogo

Radar de **calidad de datos del maestro de Tango**. No corrige Tango (eso se hace
allá), pero detecta y prioriza lo que ensucia el POS y te exporta la lista exacta
para el equipo de sistemas.

Nace de un problema real: el buscador de la caja muestra artículos en **$0**, mezcla
**marcas** (un artículo Tasty con lista de Desembarco) y sigue mostrando cosas que
**ya no se venden**. La raíz está en el maestro de artículos; este módulo lo hace
visible y medible.

## Qué detecta

| Problema | Regla | Severidad | Cómo se corrige (en Tango) |
|---|---|---|---|
| **Precio $0** | Artículo activo con precio 0 en alguna lista, o sin lista asignada | Crítica | Cargar precio (pestaña Precios) + parámetro POS "no vender sin precio" |
| **Cross-brand** | Marca del artículo ≠ marca de alguna de sus listas de precios | Alta | Sacar la lista de otra marca (pestaña Precios) |
| **Sin marca** | Artículo activo sin clasificación de marca | Media | Asignar clasificación/rubro (pestaña Clasificación) |
| **Sin venta** | Activo sin ventas hace más de 45 días (o nunca) | Media | Dar de baja / deshabilitar, o asignar a sus sucursales (pestaña Sucursales) |

Solo se auditan artículos **activos**: uno dado de baja correctamente ya no aparece
en el POS, así que no es problema. Un artículo puede tener varios problemas a la vez.

## Dónde se ve

- **`/catalogo`** — KPIs por tipo de problema, filtro, tabla priorizada por gravedad
  y botón **"Exportar a corregir (CSV)"** para pasarle al equipo de Tango.
- Al pie, "¿Cómo se corrige cada problema en Tango?" documenta la remediación.

## Qué se puede desde acá y qué no

- **Desde el dashboard (sí):** detectar, priorizar, exportar y monitorear que no se
  vuelva a degradar. Es **solo lectura**.
- **En Tango (sí, y solo allá):** dar de baja, cargar precios, clasificar marca,
  asignar sucursales, configurar la lista de precios por caja. El dashboard no
  escribe en Tango.

## Fuente de datos

- `DATA_SOURCE=mock` → catálogo de ejemplo (reproduce los casos de dolor).
- `DATA_SOURCE=live` → vista read-only **`dbo.vw_ArticulosCatalogo`** en Tango
  (plantilla: [`lib/sources/catalogo.queries.sql`](../lib/sources/catalogo.queries.sql)),
  una fila por artículo×lista. El adapter (`lib/sources/catalogo-tango.ts`) la agrupa
  por SKU. La detección vive en `lib/catalogo-control.ts` (pura).

## Umbral

`SIN_VENTA_DIAS = 45` en `lib/catalogo-control.ts` — días sin venta para marcar un
artículo activo como candidato a baja. Se ajusta en un solo lugar.
