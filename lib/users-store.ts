import { readStore, writeStore } from "./store";
import { esRol } from "./roles";
import { hashPassword } from "./auth-hash";
import type { Rol } from "./roles";

export interface Usuario {
  email: string;
  rol: Rol;
  pass?: string; // hash de su clave propia; si falta, usa la clave genérica
}

// Usuarios sembrados (sirven de ejemplo y garantizan que siempre haya un admin).
const SEED: Usuario[] = [
  { email: "lrecchini@eldesembarco.com", rol: "admin" },
  { email: "polejavetzky@eldesembarco.com", rol: "admin" },
  { email: "operaciones@eldesembarco.com", rol: "operaciones" },
  { email: "encargado.flores@eldesembarco.com", rol: "local" },
];

const norm = (e: string) => e.trim().toLowerCase();

export function getUsuarios(): Usuario[] {
  const saved = readStore<Usuario[] | null>("usuarios", null);
  const base = Array.isArray(saved) && saved.length ? saved : SEED;
  // Garantía: siempre tiene que existir al menos un admin.
  return base.some((u) => u.rol === "admin") ? base : [...base, SEED[0]];
}

export function findUsuario(email: string): Usuario | undefined {
  const e = norm(email);
  return getUsuarios().find((u) => norm(u.email) === e);
}

export function addUsuario(email: string, rol: Rol, password?: string): Usuario[] {
  if (!email.includes("@") || !esRol(rol)) throw new Error("Email o rol inválido.");
  const e = norm(email);
  const previo = getUsuarios().find((u) => norm(u.email) === e);
  const users = getUsuarios().filter((u) => norm(u.email) !== e);
  // Clave nueva si la mandan; si no, conserva la que tenía (al editar el rol).
  const pass = password ? hashPassword(password) : previo?.pass;
  users.push({ email: norm(email), rol, ...(pass ? { pass } : {}) });
  writeStore("usuarios", users);
  return users;
}

export function removeUsuario(email: string): Usuario[] {
  const e = norm(email);
  let users = getUsuarios().filter((u) => norm(u.email) !== e);
  if (!users.some((u) => u.rol === "admin")) {
    throw new Error("No se puede quedar sin ningún administrador.");
  }
  writeStore("usuarios", users);
  return users;
}
