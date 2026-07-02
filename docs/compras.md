# Compras vs Ventas

Pantalla `/compras`: subís el **CSV de compras** (lo que cada local compró/recibió) y audita la
**cobertura contra las ventas de Tango** del mismo período — qué locales compraron mercadería pero
**no registran ventas** (y viceversa). Es el análogo de **Remitos vs Ventas** para el lado de compras.
Todo exportable a Sheets/Excel.

## Ingesta flexible (auto-detecta columnas)
No hay un formato fijo: la pantalla **detecta las columnas solas** por el encabezado y te muestra
cuáles reconoció (chips verdes). Reconoce (con sinónimos):

| Campo | Encabezados aceptados (ejemplos) |
|---|---|
| fecha | fecha, emision, dia |
| proveedor | proveedor, razon social, vendedor |
| local/sucursal | sucursal, local, boca, deposito, destino |
| código | codigo, cod, sku, ean |
| descripción | descripcion, detalle, articulo, producto, insumo |
| cantidad | cantidad, cant, unidades, bultos |
| importe $ | importe, total, monto, subtotal, neto |
| comprobante | comprobante, factura, remito, orden, oc, nro |

- Acepta separador **`;`** o **`,`** y números en formato **argentino** (`1.234,56`) o inglés (`1,234.56`).
- **Mínimo**: una columna de **código o descripción** + una de **cantidad o importe**.
- El **cruce contra ventas** (pestaña Cobertura) necesita la columna **local/sucursal**. Si el CSV no
  trae fecha, la pantalla pide el período a mano para traer las ventas de Tango.
- ¿Tenés Excel? Guardalo como **CSV** (Archivo → Guardar como → CSV) y subilo.

## Vistas (pestañas)
- **Cobertura (audit)** — local con compra ↔ con ventas (solo si hay columna local).
- **Por proveedor** — proveedor · líneas · insumos · cantidad · importe (solo si hay columna proveedor).
- **Por insumo** — código · insumo · cantidad · importe · # proveedores/locales.
- **Por local** — local · líneas · cantidad · importe (solo si hay columna local).

Cada pestaña tiene su botón **⬇ Exportar** (CSV `;` + coma decimal → abre en columnas en Excel/Sheets es-AR).

## Qué audita (Cobertura)
- **COMPRA SIN VENTAS** 🔴 — compró/recibió pero no registra ventas en Tango (revisar: merma, robo, o falta de carga).
- **VENTAS SIN COMPRA** 🟠 — vende pero no figura compra en el período (se abastece por otra vía).
- **OK** — tiene ambas.

El cruce es a nivel **local**. La reconciliación unidad-a-unidad **insumo↔producto** necesita la receta
(BOM) producto→insumo (no disponible como dato real).

## Estructura
- `components/views/ComprasView.tsx` + `app/compras/page.tsx` — pantalla (parsea el CSV client-side, ingesta flexible).
- `app/api/ventas/sucursales` (`lib/ventas.ts` → `getVentasPorSucursal`) — ventas por local (Tango), reusado del cruce de remitos.
- Nav: `lib/roles.ts` (`NAV_CATALOG` + defaults de admin y operaciones).

> Nota: si los roles ya tienen su nav **guardado en el store** (KV), `/compras` no aparece hasta
> habilitarlo en **/usuarios** (editor de permisos por rol). En instalaciones nuevas aparece solo.
