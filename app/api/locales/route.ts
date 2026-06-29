import { NextRequest, NextResponse } from "next/server";
import { getSesion } from "@/lib/session";
import { getLocales, addLocal, removeLocal } from "@/lib/locales-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!getSesion()) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  return NextResponse.json({ ok: true, locales: getLocales() });
}

export async function POST(req: NextRequest) {
  if (!getSesion()) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  try {
    const { nombre } = (await req.json()) as { nombre?: string };
    const locales = addLocal(String(nombre ?? ""));
    return NextResponse.json({ ok: true, locales });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "No se pudo agregar." },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!getSesion()) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  const nombre = req.nextUrl.searchParams.get("nombre");
  if (!nombre) return NextResponse.json({ ok: false, error: "Falta nombre." }, { status: 400 });
  return NextResponse.json({ ok: true, locales: removeLocal(nombre) });
}
