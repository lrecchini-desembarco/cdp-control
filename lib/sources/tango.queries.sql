/* ============================================================
   vw_VentasInsumoDiaria — vista read-only sobre la base de Tango
   ------------------------------------------------------------
   La app NO consulta las tablas de Tango directo: consulta esta vista.
   Eso desacopla el código del esquema interno de Tango (que cambia entre
   versiones Gestión / Restô y por módulos).

   >>> ESTE ES UN TEMPLATE. Mapeá los nombres reales de tu base. <<<

   Salida esperada (4 columnas, sí o sí):
     fecha              DATE       -> fecha del comprobante de venta
     sucursal_canonico  VARCHAR    -> MISMO código canónico que en Mapeos (DS-FLO, MT-PIL…)
     sku                VARCHAR    -> Cód. Art. Tango del producto vendido (el skuVenta del mapeo)
     unidades           DECIMAL    -> unidades vendidas de ese SKU, esa fecha, esa sucursal

   Notas para mapear tu esquema Tango:
   - Las ventas con detalle por artículo viven en los RENGLONES de los
     comprobantes de venta (facturas A/B, tickets), no en la cabecera.
   - `sucursal_canonico` debe coincidir EXACTO con el código canónico que
     cargás en la pantalla Mapeos (no el nombre, no el código Raven). Si en
     Tango la boca sale como depósito / punto de venta, traducila acá.
   - Excluí comprobantes anulados y los que no son venta (presupuestos, etc.).
   - Si querés netear devoluciones/NC, restalas; si no, filtralas.
   ============================================================ */

CREATE VIEW dbo.vw_VentasInsumoDiaria AS
SELECT
    CAST(c.fecha_emision AS DATE)              AS fecha,
    map.codigo_canonico                        AS sucursal_canonico,  -- << traducí tu boca al canónico
    r.cod_articulo                             AS sku,
    SUM(r.cantidad)                            AS unidades
FROM   dbo.RENGLONES_VENTA      r          -- << reemplazar por tu tabla de renglones
JOIN   dbo.COMPROBANTES_VENTA   c          -- << cabecera de comprobantes
       ON c.id = r.id_comprobante
JOIN   dbo.MAP_SUCURSAL_CANONICO map       -- << tu tabla/auxiliar de equivalencia de bocas
       ON map.id_sucursal = c.id_sucursal
WHERE  c.anulado = 0                       -- << ajustar a tu flag de anulación
   AND c.tipo IN ('FAC', 'TKT')            -- << tipos que son venta
GROUP BY
    CAST(c.fecha_emision AS DATE),
    map.codigo_canonico,
    r.cod_articulo;
GO

-- Usuario SQL solo-lectura para la app:
-- CREATE LOGIN lectura_ventas WITH PASSWORD = '...';
-- CREATE USER  lectura_ventas FOR LOGIN lectura_ventas;
-- GRANT SELECT ON dbo.vw_VentasInsumoDiaria TO lectura_ventas;
