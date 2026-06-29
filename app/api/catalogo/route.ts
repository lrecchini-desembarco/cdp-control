import { NextResponse } from "next/server";
import { getControlCatalogo } from "@/lib/catalogo-control";
import { dataSourceName } from "@/lib/sources";

export const dynamic = "force-dynamic";

// GET /api/catalogo -> { ok, problemas, resumen }
export async function GET() {
  try {
    const { problemas, resumen } = await getControlCatalogo();
    return NextResponse.json({ ok: true, source: dataSourceName(), problemas, resumen });
  } catch (e) {
    console.error("[catalogo] error:", e);
    return NextResponse.json(
      {
        ok: false,
        source: dataSourceName(),
        error: e instanceof Error ? e.message : "No se pudo auditar el catálogo.",
      },
      { status: 502 }
    );
  }
}
