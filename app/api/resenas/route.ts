import { NextRequest, NextResponse } from "next/server";
import { getSesion } from "@/lib/session";
import { getResenas, addResena } from "@/lib/resenas-store";
import type { ResenaInput } from "@/lib/resenas-store";

export const dynamic = "force-dynamic";

// GET /api/resenas?local=Flores -> historial (más recientes primero)
export async function GET(req: NextRequest) {
  if (!getSesion()) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  const local = req.nextUrl.searchParams.get("local") ?? undefined;
  return NextResponse.json({ ok: true, resenas: getResenas(local) });
}

// POST /api/resenas -> guarda una reseña
export async function POST(req: NextRequest) {
  const s = getSesion();
  if (!s) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  try {
    const b = (await req.json()) as Partial<ResenaInput>;
    if (!b.local) return NextResponse.json({ ok: false, error: "Falta el local." }, { status: 400 });
    const guardada = addResena({
      fecha: b.fecha ?? new Date().toISOString().slice(0, 10),
      local: b.local,
      evaluador: b.evaluador || s.email,
      scores: b.scores ?? {},
      observaciones: b.observaciones ?? "",
      suma: b.suma ?? 0,
      max: b.max ?? 0,
      pct: b.pct ?? 0,
    });
    return NextResponse.json({ ok: true, resena: guardada });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." },
      { status: 500 }
    );
  }
}
