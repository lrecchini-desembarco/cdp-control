"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CruceRow } from "@/lib/types";
import { fmtInt, fmtPct, severidad } from "@/lib/brands";
import { Badge, Button } from "@/components/ui/primitives";

type Row = CruceRow & { dev: number; pct: number; periodo?: string; dias?: number };

export default function DetalleModal({
  row,
  onClose,
}: {
  row: Row | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (row && !d.open) d.showModal();
    if (!row && d.open) d.close();
  }, [row]);

  if (!row) return null;

  const sev = severidad(row.pct);
  const subPedido = row.dev < 0;
  const tone = sev === "ok" ? "ok" : sev === "warn" ? "warn" : "bad";
  const interpretacion = subPedido
    ? "Sub-pedido — la sucursal vendió más de lo que pidió al CDP."
    : "Sobre-pedido — la sucursal pidió más de lo que vendió.";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // cerrar al hacer click fuera del contenido (Nielsen #3)
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[560px] max-w-[92vw] rounded-card border border-line bg-surface p-0 backdrop:bg-black/45"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="font-display text-base font-semibold text-ink">Detalle del desvío</p>
          <p className="mt-1 text-xs text-muted">
            {row.producto}{" "}
            <span className="font-mono text-faint">{row.codigoCdp}</span> · {row.sucursal} ·{" "}
            {row.periodo ?? row.fecha}
            {row.dias && row.dias > 1 ? ` · ${row.dias} días` : ""}
          </p>
        </div>
        <button onClick={onClose} aria-label="Cerrar" className="text-lg leading-none text-faint hover:text-ink">
          ✕
        </button>
      </div>

      <div className="px-5 py-4">
        <div
          className={`mb-4 flex items-center gap-3 rounded-lg px-3.5 py-3 ${
            tone === "ok" ? "bg-ok/10" : tone === "warn" ? "bg-warn/10" : "bg-bad/10"
          }`}
        >
          <span
            className={`font-mono text-2xl font-semibold ${
              tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-bad"
            }`}
          >
            {fmtPct(row.pct)}
          </span>
          <span
            className={`text-xs leading-snug ${
              tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-bad"
            }`}
          >
            {interpretacion}
          </span>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <Metric label="Pedido al CDP" value={fmtInt(row.pedidoCdp)} />
          <Metric label="Venta equivalente" value={fmtInt(row.ventaEquiv)} />
          <Metric
            label="Diferencia"
            value={`${row.dev > 0 ? "+" : ""}${fmtInt(row.dev)}`}
            tone={tone}
          />
        </div>

        <p className="mb-2 text-xs font-medium text-ink">Cómo se calcula la venta equivalente</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-2xs text-faint">
              <th className="py-1.5 font-normal">Producto vendido</th>
              <th className="py-1.5 text-right font-normal">Vendidas</th>
              <th className="py-1.5 text-right font-normal">Factor</th>
              <th className="py-1.5 text-right font-normal">Equivale a</th>
            </tr>
          </thead>
          <tbody>
            {row.componentes.map((c) => (
              <tr key={c.sku} className="border-t border-line">
                <td className="py-2">
                  {c.nombre} <span className="font-mono text-2xs text-faint">{c.sku}</span>
                </td>
                <td className="py-2 text-right font-mono tnum">{fmtInt(c.vendidas)}</td>
                <td className="py-2 text-right font-mono text-muted">×{c.factor}</td>
                <td className="py-2 text-right font-mono tnum">{fmtInt(c.subtotal)}</td>
              </tr>
            ))}
            <tr className="border-t border-ink/20">
              <td className="py-2 font-medium">Total venta equivalente</td>
              <td />
              <td />
              <td className="py-2 text-right font-mono font-medium tnum">{fmtInt(row.ventaEquiv)}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-3.5 text-2xs leading-relaxed text-faint">
          Un insumo puede usarse en varios productos; el factor pesa cada uno. Si el consumo supera lo
          pedido, la sucursal usó stock previo o faltó pedir.
        </p>
      </div>

      <div className="flex justify-end gap-2 border-t border-line bg-paper px-5 py-3">
        <Button
          variant="outline"
          className="!py-1.5 !text-xs"
          onClick={() => router.push(`/raven?code=${row.codigoCdp}&date=${row.fecha}`)}
        >
          Ver en Raven →
        </Button>
        <Button
          variant="outline"
          className="!py-1.5 !text-xs"
          onClick={() => router.push(`/mapeos?tab=prod&insumo=${row.codigoCdp}`)}
        >
          Reglas de producto →
        </Button>
      </div>
    </dialog>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "bad";
}) {
  const color =
    tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-ink";
  return (
    <div className="rounded-lg bg-paper px-3 py-2.5">
      <p className="text-2xs text-muted">{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold tnum ${color}`}>{value}</p>
    </div>
  );
}
