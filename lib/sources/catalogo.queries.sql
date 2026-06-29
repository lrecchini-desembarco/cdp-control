/* ============================================================
   vw_ArticulosCatalogo — vista read-only sobre el maestro de Tango
   ------------------------------------------------------------
   Alimenta el "Control de catálogo". Devuelve UNA FILA POR
   ARTÍCULO × LISTA DE PRECIOS (el dashboard las agrupa por SKU).

   >>> ESTE ES UN TEMPLATE. Mapeá los nombres reales de tu base. <<<

   Salida esperada:
     sku           VARCHAR   -> Cód. Art. Tango
     nombre        VARCHAR   -> descripción del artículo
     marca         VARCHAR   -> 'desembarco' | 'tasty' | 'mila' | NULL (sin clasificar)
     activo        BIT       -> 1 si está habilitado para venta
     ultima_venta  DATE      -> fecha de la última venta del SKU (NULL si nunca vendió)
     lista         INT       -> código de lista de precios
     lista_nombre  VARCHAR   -> descripción de la lista ("MR TASTY AMBA"…)
     lista_marca   VARCHAR   -> marca a la que pertenece la lista (misma codificación que `marca`)
     precio        DECIMAL   -> precio del artículo en esa lista

   Notas para mapear tu esquema:
   - `marca` y `lista_marca` deben salir traducidos a los códigos del dashboard.
     Lo más limpio es una tablita de equivalencia (rubro/clasificación -> marca,
     y lista de precios -> marca) y hacer el JOIN acá.
   - `ultima_venta` se puede calcular con un MAX sobre los renglones de venta
     (o reutilizar vw_VentasInsumoDiaria). Si es caro, materializala.
   - Incluí TODOS los artículos (activos e inactivos): el dashboard ya filtra
     los inactivos, pero tener el flag permite auditar.
   ============================================================ */

CREATE VIEW dbo.vw_ArticulosCatalogo AS
SELECT
    a.cod_articulo                         AS sku,
    a.descripcion                          AS nombre,
    mm.marca                               AS marca,         -- << equivalencia clasificación -> marca
    CASE WHEN a.inhabilitado = 0 THEN 1 ELSE 0 END AS activo, -- << ajustar a tu flag
    uv.ultima_venta                        AS ultima_venta,
    lp.cod_lista                           AS lista,
    lp.descripcion                         AS lista_nombre,
    lm.marca                               AS lista_marca,    -- << equivalencia lista -> marca
    p.precio                               AS precio
FROM        dbo.ARTICULOS            a
LEFT JOIN   dbo.MARCA_POR_RUBRO      mm ON mm.id_rubro   = a.id_rubro       -- << tu equivalencia
LEFT JOIN   dbo.PRECIOS_ARTICULO     p  ON p.cod_articulo = a.cod_articulo
LEFT JOIN   dbo.LISTAS_PRECIOS       lp ON lp.cod_lista   = p.cod_lista
LEFT JOIN   dbo.MARCA_POR_LISTA      lm ON lm.cod_lista   = lp.cod_lista    -- << tu equivalencia
LEFT JOIN  (
    SELECT cod_articulo, MAX(CAST(fecha_emision AS DATE)) AS ultima_venta
    FROM   dbo.RENGLONES_VENTA r
    JOIN   dbo.COMPROBANTES_VENTA c ON c.id = r.id_comprobante
    WHERE  c.anulado = 0
    GROUP  BY cod_articulo
) uv ON uv.cod_articulo = a.cod_articulo;
GO

-- GRANT SELECT ON dbo.vw_ArticulosCatalogo TO lectura_ventas;
