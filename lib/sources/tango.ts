import type { VentaSku, VentasSource, RangoQuery } from "./types";

// Fuente REAL de ventas: Tango sobre SQL Server (mismo patrón que el dashboard
// de facturación del grupo). La app NO consulta tablas de Tango directo: lee una
// VISTA read-only `dbo.vw_VentasInsumoDiaria` que mapea el esquema interno.
// Plantilla de la vista en lib/sources/tango.queries.sql.
//
// El paquete `mssql` se importa de forma perezosa: en modo mock nunca se carga,
// así el proyecto corre sin la dependencia nativa instalada.

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

export const tangoVentasSource: VentasSource = {
  async getVentas(q: RangoQuery): Promise<VentaSku[]> {
    if (!process.env.TANGO_DB_HOST) {
      throw new Error(
        "Tango no está configurado (falta TANGO_DB_HOST). Configurá las variables TANGO_* o usá DATA_SOURCE=mock."
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sql = require("mssql");
    const pool = await getPool();
    const result = await pool
      .request()
      .input("desde", sql.Date, q.desde)
      .input("hasta", sql.Date, q.hasta)
      .query(`
        SELECT
          CONVERT(varchar(10), fecha, 23) AS fecha,
          sucursal_canonico,
          sku,
          turno,
          unidades
        FROM dbo.vw_VentasInsumoDiaria
        WHERE fecha BETWEEN @desde AND @hasta
        ORDER BY fecha, sucursal_canonico, sku;
      `);

    return result.recordset.map((r: any) => ({
      fecha: r.fecha,
      sku: String(r.sku),
      sucursalCanonico: String(r.sucursal_canonico),
      unidades: Number(r.unidades) || 0,
      turno: r.turno ? String(r.turno) : undefined,
    }));
  },
};
