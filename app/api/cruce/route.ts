import { NextRequest, NextResponse } from "next/server";
import { getCruce, rangoPorDefecto } from "@/lib/cruce";
import { dataSourceName } from "@/lib/sources";

export const dynamic = "force-dynamic";

// GET /api/cruce?desde=2026-06-23&hasta=2026-06-29
export async function GET(req: NextRequest) {
  const def = rangoPorDefecto();
  const desde = req.nextUrl.searchParams.get("desde") ?? def.desde;
  const hasta = req.nextUrl.searchParams.get("hasta") ?? def.hasta;
  try {
    const data = await getCruce({ desde, hasta });
    return NextResponse.json({ ok: true, source: dataSourceName(), desde, hasta, data });
  } catch (e) {
    console.error("[cruce] error:", e);
    return NextResponse.json(
      {
        ok: false,
        source: dataSourceName(),
        error:
          e instanceof Error
            ? e.message
            : "No se pudo construir el cruce desde las fuentes de datos.",
      },
      { status: 502 }
    );
  }
}
