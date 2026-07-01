/* ============================================================
   vw_PreciosProducto — precio vigente por producto y sucursal
   ------------------------------------------------------------
   Base: CENTRAL_ESTADISTICA (Tango Restô). Las LISTAS de precios están vacías
   en esta base, así que el "precio vigente" se toma del PRECIO EFECTIVO de la
   última venta de cada producto en cada sucursal (CTA_DETALLE_COMANDA).

   Salida (las columnas que lee lib/sources/tango.ts):
     sku          VARCHAR  -> COD_ARTICULO
     nombre       VARCHAR  -> DESC_CTA_ARTICULO
     sucursal     VARCHAR  -> DESC_SUCURSAL
     precio       DECIMAL  -> PVP unitario CON impuestos (IMPORTE_CON_IMPUESTOS/CANTIDAD)
     precio_neto  DECIMAL  -> precio unitario NETO (IMPORTE_NETO/CANTIDAD)
     actualizado  DATE     -> fecha de la venta que fijó el precio
   ============================================================ */

USE [CENTRAL_ESTADISTICA];
GO

CREATE OR ALTER VIEW dbo.vw_PreciosProducto AS
WITH ult AS (
  SELECT
    d.ID_CTA_ARTICULO,
    d.ID_SUCURSAL,
    d.IMPORTE_NETO,
    d.IMPORTE_CON_IMPUESTOS,
    d.CANTIDAD,
    d.FECHA,
    ROW_NUMBER() OVER (
      PARTITION BY d.ID_CTA_ARTICULO, d.ID_SUCURSAL
      ORDER BY d.FECHA DESC
    ) AS rn
  FROM dbo.CTA_DETALLE_COMANDA d
  WHERE d.ESTADO = 'P'                 -- venta válida
    AND d.CANTIDAD > 0
    AND d.IMPORTE_CON_IMPUESTOS > 0    -- ignora combos/promos con importe 0
)
SELECT
  a.COD_ARTICULO                                              AS sku,
  a.DESC_CTA_ARTICULO                                         AS nombre,
  s.DESC_SUCURSAL                                             AS sucursal,
  CAST(ult.IMPORTE_CON_IMPUESTOS / ult.CANTIDAD AS decimal(18,2)) AS precio,
  CAST(ult.IMPORTE_NETO / ult.CANTIDAD AS decimal(18,2))         AS precio_neto,
  CAST(ult.FECHA AS date)                                     AS actualizado
FROM   ult
JOIN   dbo.CTA_ARTICULO a ON a.ID_CTA_ARTICULO = ult.ID_CTA_ARTICULO
JOIN   dbo.SUCURSAL     s ON s.ID_SUCURSAL     = ult.ID_SUCURSAL
WHERE  ult.rn = 1;
GO

-- Permiso para el usuario de la app:
GRANT SELECT ON dbo.vw_PreciosProducto TO cdp_lectura;
GO

/* Probar:
   SELECT TOP 30 * FROM dbo.vw_PreciosProducto ORDER BY nombre, sucursal;
*/
