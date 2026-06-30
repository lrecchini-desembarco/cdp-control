/* ============================================================
   vw_VentasInsumoDiaria — vista read-only sobre Tango (Restô)
   ------------------------------------------------------------
   Base: CENTRAL_ESTADISTICA (consolida las ventas de TODOS los locales).
   Motor: Tango Restô (Axoft) sobre SQL Server (SRVTANGO\AXSQLEXPRESS).

   La app NO consulta las tablas de Tango directo: consulta esta vista.
   Eso desacopla el código del esquema interno de Tango.

   Esquema real descubierto (junio 2026):
   - dbo.CTA_DETALLE_COMANDA : renglones de venta. Trae FECHA (timestamp),
     FECHA_COMERCIAL (día comercial), ID_SUCURSAL, ID_CTA_ARTICULO, CANTIDAD,
     IMPORTE_NETO, ESTADO. (La columna HORA viene en 0 → el turno se calcula
     de FECHA, no de HORA.)
   - dbo.CTA_ARTICULO : maestro de artículos. ID_CTA_ARTICULO -> COD_ARTICULO
     (SKU) + DESC_CTA_ARTICULO.
   - dbo.SUCURSAL : maestro de sucursales. ID_SUCURSAL -> DESC_SUCURSAL.
   - ESTADO: 'P' = venta válida (~5,3M filas). 'X'/'D'/'I' = anulado/devolución/
     invitación -> se excluyen.

   Salida (5 columnas, las que espera lib/sources/tango.ts):
     fecha              DATE      -> día comercial de la venta
     sucursal_canonico  VARCHAR   -> nombre de la sucursal (DESC_SUCURSAL)
     sku                VARCHAR   -> COD_ARTICULO de Tango
     turno              VARCHAR   -> 'mediodia' | 'tarde' | 'noche' (de la hora; ver lib/turnos.ts)
     unidades           DECIMAL   -> unidades vendidas (SUM CANTIDAD)
   ============================================================ */

USE [CENTRAL_ESTADISTICA];
GO

CREATE OR ALTER VIEW dbo.vw_VentasInsumoDiaria AS
SELECT
    CAST(d.FECHA_COMERCIAL AS date)  AS fecha,
    s.DESC_SUCURSAL                  AS sucursal_canonico,
    a.COD_ARTICULO                   AS sku,
    t.turno                          AS turno,
    SUM(d.CANTIDAD)                  AS unidades
FROM   dbo.CTA_DETALLE_COMANDA d
JOIN   dbo.CTA_ARTICULO a ON a.ID_CTA_ARTICULO = d.ID_CTA_ARTICULO
JOIN   dbo.SUCURSAL     s ON s.ID_SUCURSAL     = d.ID_SUCURSAL
CROSS APPLY (SELECT CASE
        WHEN DATEPART(HOUR, d.FECHA) >= 11 AND DATEPART(HOUR, d.FECHA) < 16 THEN 'mediodia'
        WHEN DATEPART(HOUR, d.FECHA) >= 16 AND DATEPART(HOUR, d.FECHA) < 20 THEN 'tarde'
        ELSE 'noche' END) AS t(turno)
WHERE  d.ESTADO = 'P'                -- solo ventas válidas (excluye X/D/I)
GROUP BY CAST(d.FECHA_COMERCIAL AS date), s.DESC_SUCURSAL, a.COD_ARTICULO, t.turno;
GO

/* Probar:
   SELECT TOP 50 * FROM dbo.vw_VentasInsumoDiaria
   WHERE fecha = CAST(GETDATE() AS date) ORDER BY unidades DESC;
*/

-- Usuario SQL solo-lectura para la app:
-- USE [master];
-- CREATE LOGIN cdp_lectura WITH PASSWORD = '...';
-- USE [CENTRAL_ESTADISTICA];
-- CREATE USER  cdp_lectura FOR LOGIN cdp_lectura;
-- GRANT SELECT ON dbo.vw_VentasInsumoDiaria TO cdp_lectura;
