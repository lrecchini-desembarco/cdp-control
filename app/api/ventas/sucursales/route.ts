import { NextRequest, NextResponse } from "next/server";
import { getSesion } from "@/lib/session";
import { getVentasPorSucursal } from "@/lib/ventas";
import { rangoPorDefecto } from "@/lib/cruce";
import { ventasSourceName } from "@/lib/sources";

export const dynamic = "force-dynamic";

// GET /api/ventas/sucursales?desde&hasta -> unidades vendidas por sucursal (para auditar cobertura)
export async function GET(req: NextRequest) {
  if (!(await getSesion())) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  const def = rangoPorDefecto();
  const desde = req.nextUrl.searchParams.get("desde") ?? def.desde;
  const hasta = req.nextUrl.searchParams.get("hasta") ?? def.hasta;
  try {
    const sucursales = await getVentasPorSucursal({ desde, hasta });
    return NextResponse.json({ ok: true, source: ventasSourceName(), desde, hasta, sucursales });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "No se pudieron leer las ventas." },
      { status: 502 }
    );
  }
}
