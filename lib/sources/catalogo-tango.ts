import type { ArticuloCatalogo, BrandId, ListaPrecio } from "../types";
import type { CatalogoSource } from "./types";

// Fuente REAL del maestro de artículos: Tango sobre SQL Server. Lee la vista
// read-only `dbo.vw_ArticulosCatalogo` (plantilla en catalogo.queries.sql) que
// devuelve una fila por artículo×lista. Acá se agrega a un artículo por SKU.
//
// La vista mapea la clasificación de Tango a las marcas del dashboard
// (desembarco | tasty | mila) y deja NULL cuando el artículo no está clasificado.

let poolPromise: Promise<any> | null = null;

async function getPool() {
  if (!poolPromise) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sql = require("mssql");
    poolPromise = new sql.ConnectionPool({
      server: process.env.TANGO_DB_HOST!,
      port: Number(process.env.TANGO_DB_PORT ?? 1433),
      database: process.env.TANGO_DB_NAME!,
      user: process.env.TANGO_DB_USER!,
      password: process.env.TANGO_DB_PASSWORD!,
      options: {
        encrypt: process.env.TANGO_DB_ENCRYPT === "true",
        trustServerCertificate: process.env.TANGO_DB_TRUST_CERT === "true",
      },
      pool: { max: 5, min: 0, idleTimeoutMillis: 30_000 },
    }).connect();
  }
  return poolPromise;
}

const asBrand = (v: any): BrandId | null =>
  v === "desembarco" || v === "tasty" || v === "mila" ? v : null;

export const tangoCatalogoSource: CatalogoSource = {
  async getCatalogo(): Promise<ArticuloCatalogo[]> {
    if (!process.env.TANGO_DB_HOST) {
      throw new Error(
        "Tango no está configurado (falta TANGO_DB_HOST). Configurá las variables TANGO_* o usá DATA_SOURCE=mock."
      );
    }
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        sku,
        nombre,
        marca,
        activo,
        CONVERT(varchar(10), ultima_venta, 23) AS ultima_venta,
        lista,
        lista_nombre,
        lista_marca,
        precio
      FROM dbo.vw_ArticulosCatalogo
      ORDER BY sku, lista;
    `);

    // Agrupar filas artículo×lista -> ArticuloCatalogo
    const map = new Map<string, ArticuloCatalogo>();
    for (const r of result.recordset as any[]) {
      const sku = String(r.sku);
      let a = map.get(sku);
      if (!a) {
        a = {
          sku,
          nombre: String(r.nombre ?? sku),
          marca: asBrand(r.marca),
          activo: r.activo === true || r.activo === 1,
          ultimaVentaFecha: r.ultima_venta ?? null,
          listas: [],
        };
        map.set(sku, a);
      }
      if (r.lista != null) {
        const lista: ListaPrecio = {
          lista: Number(r.lista),
          nombre: String(r.lista_nombre ?? r.lista),
          marca: asBrand(r.lista_marca),
          precio: Number(r.precio) || 0,
        };
        a.listas.push(lista);
      }
    }
    return Array.from(map.values());
  },
};
