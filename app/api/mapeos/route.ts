import { NextRequest, NextResponse } from "next/server";
import { getMapeos, saveMapeos } from "@/lib/mapeos-store";
import type { MapeosData } from "@/lib/mapeos-store";

export const dynamic = "force-dynamic";

// GET /api/mapeos -> mapeos efectivos (defaults + lo guardado)
export async function GET() {
  return NextResponse.json({ ok: true, ...getMapeos() });
}

// PUT /api/mapeos -> persiste sucursales + recetas editadas
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<MapeosData>;
    if (!Array.isArray(body.sucursales) || !Array.isArray(body.productoMap)) {
      return NextResponse.json({ ok: false, error: "Faltan sucursales o productoMap." }, { status: 400 });
    }
    const guardado = saveMapeos({ sucursales: body.sucursales, productoMap: body.productoMap });
    return NextResponse.json({ ok: true, ...guardado });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." },
      { status: 500 }
    );
  }
}
