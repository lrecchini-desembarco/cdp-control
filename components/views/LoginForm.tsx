"use client";

import { useState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui/primitives";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error ?? "No se pudo ingresar.");
      window.location.href = j.redirect ?? "/";
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al ingresar.");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar font-display text-sm font-bold text-white">
            DS
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold text-ink">CDP · Control</p>
            <p className="text-2xs text-faint">DS Group</p>
          </div>
        </div>

        <form onSubmit={entrar} className="space-y-3">
          <Field label="Email">
            <input
              type="email"
              autoFocus
              className={inputClass}
              placeholder="tu.email@eldesembarco.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Clave" hint="Clave genérica provista por el administrador.">
            <input
              type="password"
              className={inputClass}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {err && <p className="text-xs text-bad">{err}</p>}
          <Button type="submit" disabled={busy || !email || !password} className="w-full">
            {busy ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
