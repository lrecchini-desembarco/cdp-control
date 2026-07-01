import { NextRequest, NextResponse } from "next/server";
import { getSesion } from "@/lib/session";
import { getPrecios } from "@/lib/precios";
import { dataSourceName } from "@/lib/sources";

export const dynamic = "force-dynamic";

// GET /api/precios[?sucursal=] -> precios generales (+ de una sucursal si se pide)
export async function GET(req: NextRequest) {
  if (!(await getSesion())) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  const sucursal = req.nextUrl.searchParams.get("sucursal") ?? undefined;
  try {
    const data = await getPrecios(sucursal);
    return NextResponse.json({ ok: true, source: dataSourceName(), ...data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, source: dataSourceName(), error: e instanceof Error ? e.message : "No se pudieron leer los precios." },
      { status: 502 }
    );
  }
}
