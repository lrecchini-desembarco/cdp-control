"use client";

import { useEffect, useMemo, useState } from "react";
import { QA_CATEGORIAS, ESCALA, ESCALA_LABEL, TODOS_CRITERIOS } from "@/lib/resenas-template";
import { Badge, Button, Card, Field, inputClass } from "@/components/ui/primitives";

const hoyISO = () => new Date().toISOString().slice(0, 10);
const k = (cat: string, cr: string) => `${cat} · ${cr}`;

type Paso = "bienvenida" | "calificar" | "listo";
interface ResenaHist {
  id: string;
  creadoEn: string;
  fecha: string;
  local: string;
  evaluador: string;
  pct: number;
}

export default function ResenasView() {
  const [paso, setPaso] = useState<Paso>("bienvenida");
  const [locales, setLocales] = useState<string[]>([]);
  const [local, setLocal] = useState("");
  const [nuevoLocal, setNuevoLocal] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [evaluador, setEvaluador] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [obs, setObs] = useState("");
  const [hist, setHist] = useState<ResenaHist[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/locales")
      .then((r) => r.json())
      .then((j) => j.ok && setLocales(j.locales))
      .catch(() => {});
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => j.ok && setEvaluador(j.email))
      .catch(() => {});
  }, []);

  const totales = useMemo(() => {
    const vals = TODOS_CRITERIOS.map((c) => scores[c]).filter((v): v is number => typeof v === "number");
    const suma = vals.reduce((a, v) => a + v, 0);
    const max = vals.length * 5;
    return { completados: vals.length, total: TODOS_CRITERIOS.length, suma, max, pct: max ? suma / max : 0 };
  }, [scores]);

  const tono = totales.pct >= 0.8 ? "text-ok" : totales.pct >= 0.6 ? "text-warn" : "text-bad";
  const completa = totales.completados === totales.total;

  async function agregarLocal() {
    const nombre = nuevoLocal.trim();
    if (!nombre) return;
    const j = await (
      await fetch("/api/locales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      })
    ).json();
    if (j.ok) {
      setLocales(j.locales);
      setLocal(nombre);
      setNuevoLocal("");
    }
  }

  function comenzar() {
    setScores({});
    setObs("");
    setFecha(hoyISO());
    setPaso("calificar");
  }

  async function subir() {
    setGuardando(true);
    try {
      const j = await (
        await fetch("/api/resenas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            local,
            fecha,
            evaluador,
            scores,
            observaciones: obs,
            suma: totales.suma,
            max: totales.max,
            pct: totales.pct,
          }),
        })
      ).json();
      if (j.ok) {
        const h = await (await fetch(`/api/resenas?local=${encodeURIComponent(local)}`)).json();
        if (h.ok) setHist(h.resenas);
        setPaso("listo");
      }
    } finally {
      setGuardando(false);
    }
  }

  // ───────────────────────── Paso 1: bienvenida ─────────────────────────
  if (paso === "bienvenida") {
    return (
      <div className="mx-auto max-w-xl py-6">
        <Card className="p-6 text-center">
          <p className="text-2xs font-medium uppercase tracking-wide text-faint">DS Group</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
            Bienvenidos al sistema de reseñas
          </h1>
          <p className="mt-1 text-sm text-muted">
            {local ? `Local: ${local}` : "Seleccioná tu local para empezar."}
          </p>

          <div className="mx-auto mt-5 max-w-sm space-y-3 text-left">
            <Field label="Local">
              <select className={inputClass} value={local} onChange={(e) => setLocal(e.target.value)}>
                <option value="">— Elegí un local —</option>
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>

            <details className="rounded-lg border border-line bg-paper px-3 py-2">
              <summary className="cursor-pointer select-none text-2xs font-medium text-muted">
                ¿No está tu local? Agregalo
              </summary>
              <div className="mt-2 flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Nombre del local"
                  value={nuevoLocal}
                  onChange={(e) => setNuevoLocal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregarLocal())}
                />
                <Button variant="outline" className="!py-2 !text-xs" onClick={agregarLocal} disabled={!nuevoLocal.trim()}>
                  Agregar
                </Button>
              </div>
            </details>

            <Button className="w-full" onClick={comenzar} disabled={!local}>
              Comenzar reseña →
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ──────────────────── Paso 2 y 3: calificar / listo ────────────────────
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Reseña — {local}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {paso === "listo"
              ? "Reseña guardada. Podés imprimirla o cargar una nueva."
              : "Calificá cada punto del 1 al 5 y subila."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {paso === "listo" && <Badge tone="ok">Subida ✓</Badge>}
          <Button variant="ghost" className="!py-1.5 !text-xs" onClick={() => setPaso("bienvenida")}>
            ← Cambiar local
          </Button>
          <Button variant="outline" className="!py-1.5 !text-xs" onClick={() => window.print()}>
            Imprimir
          </Button>
          {paso === "calificar" ? (
            <Button className="!py-1.5 !text-xs" onClick={subir} disabled={guardando || totales.completados === 0}>
              {guardando ? "Subiendo…" : "Subir reseña"}
            </Button>
          ) : (
            <Button className="!py-1.5 !text-xs" onClick={comenzar}>
              Nueva reseña
            </Button>
          )}
        </div>
      </div>

      {paso === "calificar" && !completa && (
        <p className="no-print text-2xs text-faint">
          {totales.completados}/{totales.total} puntos calificados. Podés subir igual, pero lo ideal es
          completar todos.
        </p>
      )}

      {/* Planilla imprimible */}
      <div id="print-area">
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between border-b border-line pb-3">
            <div>
              <p className="font-display text-base font-semibold text-ink">Reseña de calidad — {local}</p>
              <p className="mt-0.5 text-xs text-muted">
                Fecha: {fecha} · Evaluador: {evaluador || "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xs uppercase tracking-wide text-faint">Puntaje</p>
              <p className={`font-display text-2xl font-semibold tnum ${tono}`}>{Math.round(totales.pct * 100)}%</p>
              <p className="text-2xs text-faint">
                {totales.suma}/{totales.max || 0} · {totales.completados}/{totales.total} ítems
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {QA_CATEGORIAS.map((cat) => (
              <div key={cat.nombre}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{cat.nombre}</p>
                <div className="divide-y divide-line">
                  {cat.criterios.map((cr) => {
                    const key = k(cat.nombre, cr);
                    const val = scores[key];
                    return (
                      <div key={cr} className="flex items-center justify-between gap-3 py-2">
                        <span className="text-sm text-ink">{cr}</span>
                        <div className="flex items-center gap-1">
                          {ESCALA.map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setScores((s) => ({ ...s, [key]: n }))}
                              title={ESCALA_LABEL[n]}
                              className={`grid h-8 w-8 place-items-center rounded-md border text-xs font-medium transition-colors ${
                                val === n ? "border-action bg-action text-white" : "border-line text-muted hover:bg-ink/5"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Observaciones</p>
            <textarea
              className={`${inputClass} min-h-[64px] resize-y`}
              placeholder="Comentarios, pendientes, compromisos para la próxima visita…"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-8 pt-6 text-2xs text-faint">
            <div className="border-t border-ink/30 pt-1 text-center">Firma evaluador</div>
            <div className="border-t border-ink/30 pt-1 text-center">Firma encargado del local</div>
          </div>
          <p className="mt-3 text-2xs text-faint">Escala: 1 Malo · 2 Regular · 3 Bien · 4 Muy bien · 5 Excelente</p>
        </Card>
      </div>

      {/* Historial del local */}
      {paso === "listo" && hist.length > 0 && (
        <Card className="no-print overflow-hidden">
          <div className="border-b border-line px-4 py-2 text-2xs font-medium uppercase tracking-wide text-faint">
            Historial de {local}
          </div>
          <table className="w-full text-sm">
            <tbody>
              {hist.slice(0, 8).map((h) => (
                <tr key={h.id} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-2 text-ink">{h.fecha}</td>
                  <td className="px-4 py-2 text-2xs text-muted">{h.evaluador}</td>
                  <td className="px-4 py-2 text-right">
                    <Badge tone={h.pct >= 0.8 ? "ok" : h.pct >= 0.6 ? "warn" : "bad"}>
                      {Math.round(h.pct * 100)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
