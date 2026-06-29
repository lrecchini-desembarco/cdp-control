import { randomUUID } from "crypto";
import { readStore, writeStore } from "./store";

export interface ResenaGuardada {
  id: string;
  creadoEn: string; // ISO datetime
  fecha: string; // fecha de la visita
  local: string;
  evaluador: string;
  scores: Record<string, number>;
  observaciones: string;
  suma: number;
  max: number;
  pct: number;
}

export type ResenaInput = Omit<ResenaGuardada, "id" | "creadoEn">;

export function getResenas(local?: string): ResenaGuardada[] {
  const todas = readStore<ResenaGuardada[]>("resenas", []);
  const orden = [...todas].sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1));
  return local ? orden.filter((r) => r.local === local) : orden;
}

export function addResena(input: ResenaInput): ResenaGuardada {
  const todas = readStore<ResenaGuardada[]>("resenas", []);
  const nueva: ResenaGuardada = { ...input, id: randomUUID(), creadoEn: new Date().toISOString() };
  todas.push(nueva);
  writeStore("resenas", todas);
  return nueva;
}
