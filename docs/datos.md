# Fuentes de datos

El dashboard cruza **dos fuentes reales**. No hay datos inventados en producción:
el mock existe solo como modo de desarrollo opcional.

```
                 ┌──────────── Raven (HTTP) ──────────┐
   /api/cruce ──▶│ pedidos al CDP por insumo/fecha     │
                 └─────────────────────────────────────┘
                 ┌──────────── Tango (SQL Server) ────┐
                 │ ventas por SKU/sucursal/fecha       │
                 └─────────────────────────────────────┘
                          │
                          ▼  construirCruce()  (lib/cruce.ts)
                 CruceRow[]  ──▶  /api/cruce  ──▶  CruceView
                          └──▶ detectarAlertas() ──▶ /api/alertas ──▶ AlertasView
```

## Cómo se elige la fuente

Variable de entorno **`DATA_SOURCE`**:

| Valor | Pedidos | Ventas | Uso |
|-------|---------|--------|-----|
| `live` (default) | Raven | Tango / SQL Server | **Producción** |
| `mock` | generador local | generador local | Desarrollo sin red |

Se cambia en `.env.local`. El resto de la app no se entera: todo pasa por
`getSources()` (`lib/sources/index.ts`).

## 1) Pedidos al CDP — Raven

- Endpoint: `RAVEN_BASE_URL/:code?date=AAAA-MM-DD` (default `https://api.ravenfood.app/data/items`).
- Devuelve, por insumo y fecha, las unidades pedidas **por sucursal** (`branch_code`).
- El adapter (`lib/sources/raven.ts`) consulta cada insumo del catálogo para cada
  día del rango, traduce `branch_code → código canónico` (vía Mapeos) y descarta
  sucursales sin mapear (que se reportan como punto ciego en Alertas).
- **Token:** el endpoint público solo expone algunos códigos (el resto da 404).
  Para traer todos los insumos hay que setear `RAVEN_TOKEN` (el catálogo pide auth).

## 2) Ventas por SKU — Tango (SQL Server)

Mismo patrón que el dashboard de facturación del grupo: la app **no** toca las
tablas internas de Tango, lee una **vista read-only**.

1. Crear `dbo.vw_VentasInsumoDiaria` en la base de Tango.
   Template comentado en [`lib/sources/tango.queries.sql`](../lib/sources/tango.queries.sql).
   Debe devolver: `fecha`, `sucursal_canonico`, `sku`, `unidades`.
   > `sucursal_canonico` tiene que coincidir EXACTO con el código canónico de Mapeos.
   > `sku` es el `skuVenta` de las reglas de producto.
2. Crear un usuario SQL **solo lectura** con `GRANT SELECT` sobre la vista.
3. Completar en `.env.local`:
   ```
   DATA_SOURCE=live
   TANGO_DB_HOST=...
   TANGO_DB_NAME=...
   TANGO_DB_USER=lectura_ventas
   TANGO_DB_PASSWORD=...
   TANGO_DB_TRUST_CERT=true   # red interna con certificado autofirmado
   ```
4. `npm run dev` (o build) — ahora lee de Tango. El paquete `mssql` se carga solo
   en este modo (import perezoso).

## Qué hace falta para quedar 100% productivo

- [ ] **`RAVEN_TOKEN`** para traer todos los insumos (hoy el público solo da `050027`).
- [ ] **Vista `vw_VentasInsumoDiaria`** creada en Tango + usuario solo-lectura.
- [ ] **Credenciales `TANGO_*`** de la red donde corre el dashboard.
- [ ] Revisar que los **códigos canónicos** de Mapeos coincidan con los que emite la vista.

Mientras tanto, `DATA_SOURCE=mock` deja la app 100% funcional para desarrollo y demo.

## Agregar una fuente nueva (Sheets, Supabase, web service…)

1. Crear `lib/sources/<nombre>.ts` que implemente `PedidosSource` y/o `VentasSource`
   (`lib/sources/types.ts`).
2. Registrarlo en el `switch` de `lib/sources/index.ts` bajo un nuevo `DATA_SOURCE`.
3. Nada más cambia: el motor de cruce y las alertas ya consumen el shape común.
