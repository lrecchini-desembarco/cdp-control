import { NextResponse } from "next/server";
import { getSesion } from "@/lib/session";
import { ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSesion();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, email: s.email, rol: s.rol, rolLabel: ROLES[s.rol].label });
}
