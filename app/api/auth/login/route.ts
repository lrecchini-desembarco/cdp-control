import { NextRequest, NextResponse } from "next/server";
import { findUsuario } from "@/lib/users-store";
import { COOKIE } from "@/lib/auth-cookie";
import { homeDe } from "@/lib/roles";

export const dynamic = "force-dynamic";

// Clave genérica compartida (la define el admin por entorno).
const PASS = process.env.APP_PASSWORD ?? "cdp2026";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    const u = email ? findUsuario(email) : undefined;
    if (!u || password !== PASS) {
      return NextResponse.json({ ok: false, error: "Email no autorizado o clave incorrecta." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, rol: u.rol, redirect: homeDe(u.rol) });
    res.cookies.set(COOKIE, u.email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }
}
