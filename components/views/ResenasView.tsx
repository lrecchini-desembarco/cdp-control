"use client";

import { useEffect, useMemo, useState } from "react";
import { QA_CATEGORIAS, ESCALA, ESCALA_LABEL, TODOS_CRITERIOS } from "@/lib/resenas-template";
import { Button, Card, Field, inputClass } from "@/components/ui/primitives";

const hoyISO = () => new Date().toISOString().slice(0, 10);
const k = (cat: string, cr: string) => `${cat} · ${cr}`;

export default function ResenasView() {
  const [locales, setLocales] = useState<string[]>([]);
  const [local, setLocal] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [evaluador, setEvaluador] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [obs, setObs] = useState("");

  // Locales = sucursales activas y mapeadas (las que operan).
  useEffect(() => {
    fetch("/api/mapeos")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          const nombres = (j.sucursales as { nombre: string; activa: boolean }[])
            .filter((s) => s.activa)
            .map((s) => s.nombre);
          setLocales(nombres);
          setLocal((prev) => prev || nombres[0] || "");
        }
      })
      .catch(() => {});
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => j.ok && setEvaluador(j.email))
      .catch(() => {});
  }, []);

  const totales = useMemo(() => {
    const vals = TODOS_CRITERIOS.map((c) => scores[c]).filter((v): v is number => typeof v === "number");
    const completados = vals.length;
    const suma = vals.reduce((a, v) => a + v, 0);
    const max = completados * 5;
    const pct = max ? suma / max : 0;
    return { completados, total: TODOS_CRITERIOS.length, suma, max, pct };
  }, [scores]);

  const tono = totales.pct >= 0.8 ? "text-ok" : totales.pct >= 0.6 ? "text-warn" : "text-bad";

  return (
    <div className="space-y-5">
      <div className="no-print flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Reseñas de local</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted">
            Elegí un local, calificá cada punto del 1 al 5 y generá la planilla imprimible. Se usa para la
            visita / auditoría de calidad de cada sucursal.
          </p>
        </div>
        <Button variant="outline" className="!py-1.5 !text-xs" onClick={() => window.print()} disabled={!local}>
          Imprimir planilla
        </Button>
      </div>

      {/* Selección (no se imprime) */}
      <Card className="no-print p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Local">
            <select className={inputClass} value={local} onChange={(e) => setLocal(e.target.value)}>
              {locales.length === 0 && <option value="">Cargando…</option>}
              {locales.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha de visita">
            <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
          <Field label="Evaluador">
            <input
              className={inputClass}
              placeholder="Tu nombre o email"
              value={evaluador}
              onChange={(e) => setEvaluador(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* Planilla (esto es lo que se imprime) */}
      <div id="print-area">
        <Card className="p-5">
          {/* Encabezado del imprimible */}
          <div className="mb-4 flex items-start justify-between border-b border-line pb-3">
            <div>
              <p className="font-display text-base font-semibold text-ink">Reseña de calidad — {local || "—"}</p>
              <p className="mt-0.5 text-xs text-muted">
                Fecha: {fecha} · Evaluador: {evaluador || "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xs uppercase tracking-wide text-faint">Puntaje</p>
              <p className={`font-display text-2xl font-semibold tnum ${tono}`}>
                {Math.round(totales.pct * 100)}%
              </p>
              <p className="text-2xs text-faint">
                {totales.suma}/{totales.max || 0} · {totales.completados}/{totales.total} ítems
              </p>
            </div>
          </div>

          {/* Categorías y criterios */}
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
                              className={`grid h-7 w-7 place-items-center rounded-md border text-xs font-medium transition-colors ${
                                val === n
                                  ? "border-action bg-action text-white"
                                  : "border-line text-muted hover:bg-ink/5"
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

          {/* Observaciones */}
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Observaciones</p>
            <textarea
              className={`${inputClass} min-h-[70px] resize-y`}
              placeholder="Comentarios, pendientes, compromisos para la próxima visita…"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-8 pt-6 text-2xs text-faint">
            <div className="border-t border-ink/30 pt-1 text-center">Firma evaluador</div>
            <div className="border-t border-ink/30 pt-1 text-center">Firma encargado del local</div>
          </div>

          <p className="mt-3 text-2xs text-faint">
            Escala: 1 Malo · 2 Regular · 3 Bien · 4 Muy bien · 5 Excelente
          </p>
        </Card>
      </div>
    </div>
  );
}
