"use client";

import { useMemo, useState } from "react";
import organigrama from "@/lib/organigrama-seed.json";
import { Card, inputClass } from "@/components/ui/primitives";
import {
  buildSignatureHTML,
  firmaInicial,
  LOGO_LABEL,
  REDES,
  type FirmaState,
  type MarcaLogo,
  type RedKey,
} from "@/lib/firma";

const FIRMAS_URL =
  process.env.NEXT_PUBLIC_FIRMAS_URL ?? "https://lrecchini-desembarco.github.io/firmas-eldesembarco/";

interface Persona {
  area: string;
  nombre: string;
  apellido: string;
  cargo: string;
  mail: string;
}
const GENTE = organigrama as Persona[];

export default function FirmasView() {
  const [st, setSt] = useState<FirmaState>(firmaInicial);
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState("");

  const sugeridos = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = t
      ? GENTE.filter(
          (p) =>
            `${p.nombre} ${p.apellido}`.toLowerCase().includes(t) ||
            p.cargo.toLowerCase().includes(t) ||
            p.area.toLowerCase().includes(t) ||
            p.mail.toLowerCase().includes(t)
        )
      : GENTE;
    return base.slice(0, 8);
  }, [q]);

  const html = useMemo(() => buildSignatureHTML(st), [st]);
  const set = (patch: Partial<FirmaState>) => setSt((s) => ({ ...s, ...patch }));

  function elegir(p: Persona) {
    set({ nombre: `${p.nombre} ${p.apellido}`.trim(), puesto: p.cargo, email: p.mail });
    setQ(`${p.nombre} ${p.apellido}`);
    setAbierto(false);
  }

  async function copiarFirma() {
    try {
      const blobHtml = new Blob([html], { type: "text/html" });
      const blobTxt = new Blob([st.nombre], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blobHtml, "text/plain": blobTxt }),
      ]);
      flash("firma");
    } catch {
      try {
        await navigator.clipboard.writeText(html);
        flash("firma");
      } catch {}
    }
  }
  function copiarHTML() {
    navigator.clipboard?.writeText(html).then(() => flash("html"));
  }
  function flash(k: string) {
    setCopiado(k);
    setTimeout(() => setCopiado(""), 1500);
  }
  function descargar() {
    const doc = `<!doctype html><meta charset="utf-8"><body style="margin:24px;background:#f3f3f1">${html}</body>`;
    const url = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `firma-${st.nombre.replace(/\s+/g, "-").toLowerCase() || "ds"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Firmas de empleados</h1>
          <p className="mt-0.5 text-sm text-muted">
            Elegí la persona del organigrama: se completan todos los campos y el preview. Después copiás y pegás en Gmail.
          </p>
        </div>
        <a
          href={FIRMAS_URL}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-action/40 hover:text-action"
        >
          Generador externo ↗
        </a>
      </div>

      {/* Buscador compacto (dropdown flotante: no ocupa alto) */}
      <div className="relative max-w-md">
        <input
          className={inputClass}
          placeholder={`🔎 Autocompletar desde organigrama (${GENTE.length})…`}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
        />
        {abierto && sugeridos.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-line bg-surface shadow-lg">
            {sugeridos.map((p) => (
              <button
                key={p.mail}
                onMouseDown={() => elegir(p)}
                className="block w-full border-b border-line px-3 py-2 text-left last:border-0 hover:bg-ink/5"
              >
                <span className="text-sm text-ink">
                  {p.nombre} {p.apellido}
                </span>
                <span className="ml-2 text-2xs text-faint">
                  {p.cargo} · {p.area}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Campos */}
        <Card className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Nombre" value={st.nombre} onChange={(v) => set({ nombre: v })} />
            <Campo label="Puesto" value={st.puesto} onChange={(v) => set({ puesto: v })} />
            <Campo label="Teléfono" value={st.tel} onChange={(v) => set({ tel: v })} />
            <Campo label="Email" value={st.email} onChange={(v) => set({ email: v })} />
            <Campo label="Web" value={st.web} onChange={(v) => set({ web: v })} />
          </div>

          <div>
            <p className="mb-1 text-2xs font-medium uppercase tracking-wide text-faint">Logos</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(st.logos) as MarcaLogo[]).map((k) => (
                <Toggle
                  key={k}
                  label={LOGO_LABEL[k]}
                  on={st.logos[k]}
                  onClick={() => set({ logos: { ...st.logos, [k]: !st.logos[k] } })}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-2xs font-medium uppercase tracking-wide text-faint">Redes (opcional)</p>
            <div className="space-y-1.5">
              {REDES.map((r) => {
                const red = st.redes[r.key as RedKey];
                return (
                  <div key={r.key} className="flex items-center gap-2">
                    <Toggle
                      label={r.label}
                      on={red.on}
                      onClick={() => set({ redes: { ...st.redes, [r.key]: { ...red, on: !red.on } } })}
                    />
                    {red.on && (
                      <input
                        className="flex-1 rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink placeholder:text-faint focus:border-action"
                        placeholder={r.ph}
                        value={red.url}
                        onChange={(e) =>
                          set({ redes: { ...st.redes, [r.key]: { ...red, url: e.target.value } } })
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Preview + acciones */}
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-medium uppercase tracking-wide text-faint">Preview</p>
            <div className="flex gap-2">
              <Accion onClick={copiarFirma}>{copiado === "firma" ? "✓ copiado" : "Copiar firma"}</Accion>
              <Accion onClick={copiarHTML}>{copiado === "html" ? "✓ copiado" : "Copiar HTML"}</Accion>
              <Accion onClick={descargar}>Descargar</Accion>
              <Accion onClick={() => { setSt(firmaInicial()); setQ(""); }}>Reset</Accion>
            </div>
          </div>
          <div className="grid place-items-center overflow-x-auto rounded-lg bg-[#f3f3f1] p-5">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
          <p className="text-2xs text-faint">
            “Copiar firma” pega con formato en Gmail (Configuración → Firma). “Copiar HTML” copia el código.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-2xs font-medium uppercase tracking-wide text-faint">{label}</span>
      <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        on ? "border-action bg-action/10 text-action" : "border-line bg-surface text-muted hover:text-ink"
      }`}
    >
      {on ? "● " : "○ "}
      {label}
    </button>
  );
}

function Accion({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-action/40 hover:text-action"
    >
      {children}
    </button>
  );
}
