"use client";

import { useEffect, useMemo, useState } from "react";
import { brandById } from "@/lib/brands";
import type { ProblemaCatalogo, ProblemaCatalogoTipo, ResumenCatalogo, Severidad } from "@/lib/types";
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui/primitives";

const SEV: Record<Severidad, { rail: string; dot: string; tone: "bad" | "warn" | "neutral" }> = {
  critica: { rail: "border-l-bad", dot: "bg-bad", tone: "bad" },
  alta: { rail: "border-l-warn", dot: "bg-warn", tone: "warn" },
  media: { rail: "border-l-line", dot: "bg-faint", tone: "neutral" },
  info: { rail: "border-l-line", dot: "bg-faint", tone: "neutral" },
};

const TIPO: Record<ProblemaCatalogoTipo, { label: string; tone: "bad" | "warn" | "neutral" }> = {
  "precio-cero": { label: "Precio $0", tone: "bad" },
  "cross-brand": { label: "Cross-brand", tone: "warn" },
  "sin-marca": { label: "Sin marca", tone: "neutral" },
  "sin-venta": { label: "Sin venta", tone: "neutral" },
};

const RESUMEN_VACIO: ResumenCatalogo = {
  articulos: 0,
  conProblemas: 0,
  porTipo: { "precio-cero": 0, "cross-brand": 0, "sin-marca": 0, "sin-venta": 0 },
};

type Status = "loading" | "ok" | "error";
type FiltroTipo = "todos" | ProblemaCatalogoTipo;

export default function CatalogoView() {
  const [problemas, setProblemas] = useState<ProblemaCatalogo[]>([]);
  const [resumen, setResumen] = useState<ResumenCatalogo>(RESUMEN_VACIO);
  const [status, setStatus] = useState<Status>("loading");
  const [errMsg, setErrMsg] = useState("");
  const [tipo, setTipo] = useState<FiltroTipo>("todos");

  async function cargar() {
    setStatus("loading");
    try {
      const r = await fetch("/api/catalogo");
      const j = await r.json();
      if (!j.ok) throw new Error(j.error ?? "No se pudo auditar el catálogo.");
      setProblemas(j.problemas as ProblemaCatalogo[]);
      setResumen(j.resumen as ResumenCatalogo);
      setStatus("ok");
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "Error desconocido.");
      setStatus("error");
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  const visibles = useMemo(
    () => (tipo === "todos" ? problemas : problemas.filter((p) => p.problemas.some((x) => x.tipo === tipo))),
    [problemas, tipo]
  );

  function exportarCSV() {
    const headers = ["SKU", "Artículo", "Marca", "Activo", "Problemas", "Detalle"];
    const filas = visibles.map((p) => [
      p.sku,
      p.nombre,
      p.marca ? brandById(p.marca).name : "(sin marca)",
      p.activo ? "Sí" : "No",
      p.problemas.map((x) => TIPO[x.tipo].label).join(" | "),
      p.problemas.map((x) => x.detalle).join(" | "),
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...filas].map((row) => row.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalogo-a-corregir.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Control de catálogo</h1>
          <p className="mt-0.5 text-sm text-muted">
            Audita el maestro de Tango y marca lo que ensucia el POS: precios en $0, marcas cruzadas,
            sin clasificar y artículos a dar de baja.
          </p>
        </div>
        {status === "ok" && visibles.length > 0 && (
          <Button variant="outline" className="!py-1.5 !text-xs" onClick={exportarCSV}>
            Exportar a corregir (CSV)
          </Button>
        )}
      </div>

      {/* Qué hace y qué no */}
      <Card className="border-l-4 border-l-action/50 p-4">
        <p className="text-sm text-ink">
          <span className="font-semibold">Qué es:</span> un radar de calidad de datos. No edita Tango
          (la corrección se hace allá), pero te dice <span className="font-medium">qué artículo</span>,{" "}
          <span className="font-medium">qué problema</span> y <span className="font-medium">cuánto urge</span>,
          y te exporta la lista para el equipo de sistemas.
        </p>
      </Card>

      {/* KPIs por tipo de problema */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Precio $0" value={resumen.porTipo["precio-cero"]} tone="bad" />
        <Kpi label="Cross-brand" value={resumen.porTipo["cross-brand"]} tone="warn" />
        <Kpi label="Sin marca" value={resumen.porTipo["sin-marca"]} tone="neutral" />
        <Kpi label="Sin venta (baja)" value={resumen.porTipo["sin-venta"]} tone="neutral" />
      </div>

      {/* Filtros */}
      <Card className="flex flex-wrap items-center gap-2 p-3">
        <span className="mr-1 text-2xs font-medium uppercase tracking-wide text-faint">Problema</span>
        {(["todos", ...Object.keys(TIPO)] as FiltroTipo[]).map((t) => (
          <Chip key={t} active={tipo === t} onClick={() => setTipo(t)}>
            {t === "todos" ? "Todos" : TIPO[t as ProblemaCatalogoTipo].label}
          </Chip>
        ))}
        {status === "ok" && (
          <span className="ml-auto text-2xs text-faint">
            {resumen.conProblemas} de {resumen.articulos} artículos activos con problemas
          </span>
        )}
      </Card>

      {/* Lista */}
      {status === "loading" ? (
        <Card className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </Card>
      ) : status === "error" ? (
        <ErrorState msg={errMsg} onRetry={cargar} />
      ) : visibles.length === 0 ? (
        <EmptyState
          title={problemas.length === 0 ? "Catálogo limpio" : "Sin artículos para este filtro"}
          desc={
            problemas.length === 0
              ? "Ningún artículo activo con precio en $0, marca cruzada, sin clasificar ni candidato a baja."
              : "Probá con otro tipo de problema."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-2xs uppercase tracking-wide text-faint">
                  <th className="px-4 py-2 font-medium">Artículo</th>
                  <th className="px-4 py-2 font-medium">Marca</th>
                  <th className="px-4 py-2 font-medium">Problemas</th>
                  <th className="px-4 py-2 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.sku} className={`border-l-4 ${SEV[p.severidad].rail} border-b border-line/70 last:border-0`}>
                    <td className="px-4 py-2.5 align-top">
                      <span className="text-ink">{p.nombre}</span>
                      <span className="ml-2 font-mono text-2xs text-faint">{p.sku}</span>
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      {p.marca ? (
                        <span className="inline-flex items-center gap-1.5 text-muted">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: brandById(p.marca).color }} />
                          {brandById(p.marca).name}
                        </span>
                      ) : (
                        <span className="text-faint">— sin marca</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <span className="flex flex-wrap gap-1">
                        {p.problemas.map((x) => (
                          <Badge key={x.tipo} tone={TIPO[x.tipo].tone}>
                            {TIPO[x.tipo].label}
                          </Badge>
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-top text-xs text-muted">
                      {p.problemas.map((x, i) => (
                        <div key={i}>{x.detalle}</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ComoArreglar />
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: "bad" | "warn" | "neutral" }) {
  const color = tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <Card className="p-4">
      <p className="text-2xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold tnum ${value === 0 ? "text-faint" : color}`}>{value}</p>
    </Card>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors ${
        active ? "border-action bg-action/10 text-action" : "border-line text-muted hover:bg-ink/5"
      }`}
    >
      {children}
    </button>
  );
}

/** Documentación embebida: cómo se corrige cada problema en Tango. */
function ComoArreglar() {
  const reglas = [
    { t: "Precio $0", d: "Cargar el precio en la lista que usa la caja (pestaña Precios del artículo) y activar el parámetro del POS \"no vender sin precio\"." },
    { t: "Cross-brand", d: "Sacar la lista de precios de otra marca y dejar solo la que corresponde (pestaña Precios)." },
    { t: "Sin marca", d: "Asignar la clasificación / rubro de marca (pestaña Clasificación) y que el POS filtre por marca/sucursal." },
    { t: "Sin venta (baja)", d: "Si ya no se vende, dar de baja o deshabilitar para venta; si corresponde, asignarlo solo a las sucursales que lo usan (pestaña Sucursales)." },
  ];
  return (
    <details className="rounded-card border border-line bg-surface">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-ink">
        ¿Cómo se corrige cada problema en Tango?
      </summary>
      <div className="space-y-3 border-t border-line px-4 py-3">
        {reglas.map((r) => (
          <div key={r.t}>
            <p className="text-xs font-semibold text-ink">{r.t}</p>
            <p className="mt-0.5 text-xs text-muted">{r.d}</p>
          </div>
        ))}
        <p className="border-t border-line pt-3 text-2xs text-faint">
          El dashboard solo lee Tango (no escribe). La corrección se hace en el maestro de artículos;
          acá controlás que quede limpio y no se vuelva a degradar.
        </p>
      </div>
    </details>
  );
}
