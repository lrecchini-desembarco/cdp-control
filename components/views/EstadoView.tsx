"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";

interface Estado {
  bridgeHost: string | null;
  endpoints: { metodo: string; ruta: string; desc: string; estado: { ok: boolean; ms: number; detail: string } | null }[];
  fuentes: { nombre: string; valor: string }[];
  config: { nombre: string; ok: boolean; detalle: string }[];
}

export default function EstadoView() {
  const [data, setData] = useState<Estado | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true); setError("");
    try {
      const j = await (await fetch("/api/estado", { cache: "no-store" })).json();
      if (j.ok) setData(j); else setError(j.error || "No se pudo leer el estado.");
    } catch (e) { setError(String(e)); } finally { setCargando(false); }
  }
  useEffect(() => { cargar(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Sistema · Endpoints y estado</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted">
            Endpoints del bridge de Tango y chequeo en vivo de las fuentes de datos. Solo visible para admin.
          </p>
        </div>
        <button onClick={cargar} disabled={cargando}
          className="shrink-0 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:border-action/40 hover:text-action disabled:opacity-40">
          {cargando ? "Chequeando…" : "↻ Re-chequear"}
        </button>
      </div>

      {error && <Card className="p-3 text-sm text-bad">{error}</Card>}

      {data && (
        <>
          {/* Endpoints del bridge */}
          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-2.5">
              <p className="text-2xs font-medium uppercase tracking-wide text-faint">
                Bridge Tango {data.bridgeHost ? <span className="ml-1 font-mono text-faint">· {data.bridgeHost}</span> : <span className="ml-1 text-warn">· SQL directo (dev, sin bridge)</span>}
              </p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  {["Método", "Endpoint", "Descripción", "Estado"].map((c, i) => (
                    <th key={c} className={`px-4 py-2 text-2xs font-medium uppercase tracking-wide text-faint ${i === 3 ? "text-right" : ""}`}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.endpoints.map((e) => (
                  <tr key={e.ruta} className="border-b border-line last:border-0">
                    <td className="px-4 py-2"><span className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-2xs text-muted">{e.metodo}</span></td>
                    <td className="px-4 py-2 font-mono text-xs text-ink">{e.ruta}</td>
                    <td className="px-4 py-2 text-sm text-muted">{e.desc}</td>
                    <td className="px-4 py-2 text-right">
                      {e.estado
                        ? <Semaforo ok={e.estado.ok} texto={e.estado.ok ? `${e.estado.detail} · ${e.estado.ms}ms` : e.estado.detail} />
                        : <span className="text-2xs text-faint">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="grid gap-3 lg:grid-cols-2">
            {/* Fuentes de datos */}
            <Card className="overflow-hidden">
              <div className="border-b border-line px-4 py-2.5"><p className="text-2xs font-medium uppercase tracking-wide text-faint">Fuentes de datos</p></div>
              <div className="divide-y divide-line">
                {data.fuentes.map((f) => (
                  <div key={f.nombre} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-ink">{f.nombre}</span>
                    <span className={`rounded-full px-2 py-0.5 text-2xs font-medium ${f.valor === "live" ? "bg-ok/10 text-ok" : "bg-warn/10 text-warn"}`}>
                      {f.valor === "live" ? "en vivo" : "ejemplo (mock)"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Configuración */}
            <Card className="overflow-hidden">
              <div className="border-b border-line px-4 py-2.5"><p className="text-2xs font-medium uppercase tracking-wide text-faint">Configuración</p></div>
              <div className="divide-y divide-line">
                {data.config.map((c) => (
                  <div key={c.nombre} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-sm text-ink">{c.nombre}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-2xs text-faint">{c.detalle}</span>
                      <Semaforo ok={c.ok} texto="" />
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <p className="text-2xs text-faint">
            "Pedidos en mock" = falta el token de Raven → el <b>Cruce</b> muestra desvíos irreales (pedido simulado vs venta real).
            Para números reales: cargar <code className="rounded bg-paper px-1">RAVEN_TOKEN</code> y mapear las sucursales de Tango a su código canónico.
          </p>
        </>
      )}
    </div>
  );
}

function Semaforo({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-medium ${ok ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-ok" : "bg-bad"}`} />
      {texto || (ok ? "OK" : "falta")}
    </span>
  );
}
