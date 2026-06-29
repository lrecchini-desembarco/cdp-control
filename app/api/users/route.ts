import { NextRequest, NextResponse } from "next/server";
import { getSesion } from "@/lib/session";
import { getUsuarios, addUsuario, removeUsuario } from "@/lib/users-store";

export const dynamic = "force-dynamic";

function soloAdmin() {
  const s = getSesion();
  return s?.rol === "admin" ? s : null;
}

export async function GET() {
  if (!soloAdmin()) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  return NextResponse.json({ ok: true, usuarios: getUsuarios() });
}

export async function POST(req: NextRequest) {
  if (!soloAdmin()) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  try {
    const { email, rol } = (await req.json()) as { email?: string; rol?: string };
    const usuarios = addUsuario(String(email), rol as any);
    return NextResponse.json({ ok: true, usuarios });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "No se pudo agregar." },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!soloAdmin()) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ ok: false, error: "Falta email." }, { status: 400 });
  try {
    const usuarios = removeUsuario(email);
    return NextResponse.json({ ok: true, usuarios });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "No se pudo quitar." },
      { status: 400 }
    );
  }
}
