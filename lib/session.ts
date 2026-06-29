import { cookies } from "next/headers";
import { findUsuario } from "./users-store";
import { COOKIE } from "./auth-cookie";
import type { Rol } from "./roles";

export interface Sesion {
  email: string;
  rol: Rol;
}

/**
 * Sesión actual (server-only). La cookie guarda el email; el rol se deriva del
 * store de usuarios (fuente de verdad), así no se puede escalar tocando la cookie.
 */
export function getSesion(): Sesion | null {
  const email = cookies().get(COOKIE)?.value;
  if (!email) return null;
  const u = findUsuario(email);
  return u ? { email: u.email, rol: u.rol } : null;
}
