"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import assets from "@/lib/firma-assets.json";
import { Card, inputClass } from "@/components/ui/primitives";

// ============================================================================
// Config editable — marcas, mails sugeridos y datos de pie del comunicado.
// ============================================================================
const LOGOS = assets.logos as Record<string, string>;

// Presets de marca: precargan logo (base64, sin hosting) + color de acento.
// El color es editable con el color picker; estos son solo el punto de partida.
const MARCAS: Record<string, { label: string; color: string; logo: string }> = {
  desembarco: { label: "El Desembarco", color: "#C1121F", logo: LOGOS.desembarco ?? "" },
  tasty: { label: "Mr. Tasty", color: "#E4572E", logo: LOGOS.tasty ?? "" },
  mila: { label: "Mila & Go", color: "#E84A80", logo: LOGOS.milago ?? "" },
  ds: { label: "DS Group", color: "#155E63", logo: "" }, // sin logo -> texto de marca
};

// Sugeridos para el email de contacto del pie (datalist).
const MAILS_SUGERIDOS = [
  "sistemas@eldesembarco.com",
  "marketing@eldesembarco.com",
  "rrhh@eldesembarco.com",
  "administracion@eldesembarco.com",
];

// Valores por defecto del pie.
const FOOTER_DEFAULT = {
  grupo: "DS Group",
  marcasLinea: "El Desembarco · Mr. Tasty · Mila & Go",
  area: "",
  email: "sistemas@eldesembarco.com",
  web: "www.eldesembarco.com",
  ubicacion: "Buenos Aires, Argentina",
  legal: "Este mensaje es de uso interno de DS Group.",
};

const LS_KEY = "cdp_comunicados_v1";

interface Estado {
  marca: string;
  logoCustom: string; // base64; si está, pisa el logo de la marca
  color: string;
  etiquetaLateral: string;
  asunto: string;
  eyebrow: string;
  titulo: string;
  saludo: string;
  cuerpo: string; // un párrafo por línea
  botonTexto: string;
  botonLink: string;
  grupo: string;
  marcasLinea: string;
  area: string;
  email: string;
  web: string;
  ubicacion: string;
  legal: string;
}

function estadoInicial(): Estado {
  return {
    marca: "ds",
    logoCustom: "",
    color: MARCAS.ds.color,
    etiquetaLateral: "SISTEMAS",
    asunto: "Comunicado interno · DS Group",
    eyebrow: "Comunicado",
    titulo: "Título del comunicado",
    saludo: "Hola equipo,",
    cuerpo: "Escribí acá el mensaje.\nCada línea es un párrafo.",
    botonTexto: "",
    botonLink: "",
    ...FOOTER_DEFAULT,
  };
}

function esc(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============================================================================
// Armado del email HTML (Gmail-safe: tablas 600px, estilos inline, text-align:left)
// ============================================================================
function construirEmailHTML(e: Estado): string {
  const logo = e.logoCustom || MARCAS[e.marca]?.logo || "";
  const color = e.color || "#155E63";
  const parrafos = e.cuerpo.split("\n").map((l) => l.trim()).filter(Boolean);
  const link = e.botonLink.trim();
  const href = link ? (/^https?:\/\//.test(link) ? link : "https://" + link) : "";

  const logoCell = logo
    ? `<img src="${esc(logo)}" alt="${esc(MARCAS[e.marca]?.label ?? "")}" height="34" style="height:34px;display:block;border:0" />`
    : `<span style="font:700 20px Arial,Helvetica,sans-serif;color:${color}">${esc(MARCAS[e.marca]?.label ?? e.grupo)}</span>`;

  const etiqueta = e.etiquetaLateral.trim()
    ? `<span style="display:inline-block;font:700 10px Arial,Helvetica,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#ffffff;background:${color};border-radius:5px;padding:5px 9px">${esc(
        e.etiquetaLateral
      )}</span>`
    : "";

  const filaFooter = (html: string, extra = "") =>
    `<div style="text-align:left;${extra}">${html}</div>`;

  const footer = [
    e.grupo ? filaFooter(esc(e.grupo), "font-weight:700;color:#6b6860") : "",
    e.marcasLinea ? filaFooter(esc(e.marcasLinea)) : "",
    e.area ? filaFooter(esc(e.area)) : "",
    e.email ? filaFooter(`<a href="mailto:${esc(e.email)}" style="color:${color};text-decoration:none">${esc(e.email)}</a>`) : "",
    e.web ? filaFooter(esc(e.web)) : "",
    e.ubicacion ? filaFooter(esc(e.ubicacion)) : "",
    e.legal ? filaFooter(esc(e.legal), "padding-top:8px;color:#c8c5bd") : "",
  ]
    .filter(Boolean)
    .join("");

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f7f5;padding:24px 0;margin:0">
  <tr><td align="center" style="text-align:center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e6e3db;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif">
      <tr><td style="height:6px;background:${color};font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td style="padding:24px 32px 0 32px;text-align:left">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="text-align:left;vertical-align:middle">${logoCell}</td>
          <td style="text-align:right;vertical-align:middle">${etiqueta}</td>
        </tr></table>
      </td></tr>
      ${e.eyebrow ? `<tr><td style="padding:22px 32px 0 32px;text-align:left"><span style="font:700 12px Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${color}">${esc(e.eyebrow)}</span></td></tr>` : ""}
      ${e.titulo ? `<tr><td style="padding:6px 32px 0 32px;text-align:left"><h1 style="margin:0;font:700 24px Arial,Helvetica,sans-serif;line-height:1.25;color:#18181b">${esc(e.titulo)}</h1></td></tr>` : ""}
      ${e.saludo ? `<tr><td style="padding:16px 32px 0 32px;text-align:left;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#3f3f46">${esc(e.saludo)}</td></tr>` : ""}
      ${parrafos
        .map(
          (p) =>
            `<tr><td style="padding:12px 32px 0 32px;text-align:left;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#3f3f46">${esc(p)}</td></tr>`
        )
        .join("")}
      ${
        e.botonTexto.trim()
          ? `<tr><td style="padding:24px 32px 0 32px;text-align:left"><a href="${esc(href)}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font:600 15px Arial,Helvetica,sans-serif;padding:12px 22px;border-radius:8px">${esc(e.botonTexto)}</a></td></tr>`
          : ""
      }
      <tr><td style="padding:28px 32px 0 32px"><div style="border-top:1px solid #e6e3db;font-size:0;line-height:0">&nbsp;</div></td></tr>
      <tr><td style="padding:16px 32px 28px 32px;text-align:left;font:400 12px/1.7 Arial,Helvetica,sans-serif;color:#9c998f">${footer}</td></tr>
    </table>
  </td></tr>
</table>`.trim();
}

// ============================================================================
export default function ComunicadosView() {
  const [e, setE] = useState<Estado>(estadoInicial);
  const [copiado, setCopiado] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  // Cargar de localStorage (guard SSR).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setE({ ...estadoInicial(), ...(JSON.parse(raw) as Estado) });
    } catch {}
  }, []);
  // Persistir.
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(e));
    } catch {}
  }, [e]);

  const html = useMemo(() => construirEmailHTML(e), [e]);
  const set = (patch: Partial<Estado>) => setE((s) => ({ ...s, ...patch }));

  function elegirMarca(k: string) {
    const m = MARCAS[k];
    set({ marca: k, logoCustom: "", color: m.color });
  }

  function subirLogo(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ logoCustom: String(reader.result) });
    reader.readAsDataURL(file);
  }

  function flash(k: string) {
    setCopiado(k);
    setTimeout(() => setCopiado(""), 1600);
  }

  // Copiar con formato para pegar en Gmail: selección + execCommand, con fallback a ClipboardItem.
  async function copiarGmail() {
    const node = previewRef.current;
    if (node) {
      try {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(node);
        sel?.removeAllRanges();
        sel?.addRange(range);
        const ok = document.execCommand("copy");
        sel?.removeAllRanges();
        if (ok) return flash("gmail");
      } catch {}
    }
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([e.asunto], { type: "text/plain" }),
        }),
      ]);
      flash("gmail");
    } catch {}
  }
  function copiarHTML() {
    navigator.clipboard?.writeText(html).then(() => flash("html"));
  }
  function copiarAsunto() {
    navigator.clipboard?.writeText(e.asunto).then(() => flash("asunto"));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Comunicados</h1>
        <p className="mt-0.5 max-w-2xl text-sm text-muted">
          Armá un email con la identidad de la marca, editá encabezado y pie, y copialo con formato para pegar en Gmail.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ---------------- Formulario ---------------- */}
        <div className="space-y-4">
          {/* Encabezado / marca */}
          <Card className="space-y-3 p-4">
            <p className="text-2xs font-medium uppercase tracking-wide text-faint">Encabezado</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MARCAS).map(([k, m]) => (
                <button
                  key={k}
                  onClick={() => elegirMarca(k)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    e.marca === k && !e.logoCustom
                      ? "border-action bg-action/10 text-action"
                      : "border-line bg-surface text-muted hover:text-ink"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:border-action/40 hover:text-action">
                Subir logo
                <input type="file" accept="image/*" className="hidden" onChange={(ev) => subirLogo(ev.target.files?.[0])} />
              </label>
              {e.logoCustom && (
                <button onClick={() => set({ logoCustom: "" })} className="text-2xs text-faint underline">
                  quitar logo subido
                </button>
              )}
              <label className="flex items-center gap-2 text-2xs text-faint">
                Color de acento
                <input
                  type="color"
                  value={e.color}
                  onChange={(ev) => set({ color: ev.target.value })}
                  className="h-7 w-9 cursor-pointer rounded border border-line bg-surface"
                />
              </label>
            </div>
            <Campo label="Etiqueta lateral (opcional)" value={e.etiquetaLateral} onChange={(v) => set({ etiquetaLateral: v })} />
          </Card>

          {/* Contenido */}
          <Card className="space-y-3 p-4">
            <p className="text-2xs font-medium uppercase tracking-wide text-faint">Contenido</p>
            <div>
              <span className="mb-0.5 block text-2xs font-medium uppercase tracking-wide text-faint">Asunto</span>
              <div className="flex gap-2">
                <input className={inputClass} value={e.asunto} onChange={(ev) => set({ asunto: ev.target.value })} />
                <button
                  onClick={copiarAsunto}
                  title="En Gmail el asunto va en otro campo"
                  className="shrink-0 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink hover:border-action/40 hover:text-action"
                >
                  {copiado === "asunto" ? "✓" : "Copiar"}
                </button>
              </div>
            </div>
            <Campo label="Etiqueta (eyebrow)" value={e.eyebrow} onChange={(v) => set({ eyebrow: v })} />
            <Campo label="Título" value={e.titulo} onChange={(v) => set({ titulo: v })} />
            <Campo label="Saludo" value={e.saludo} onChange={(v) => set({ saludo: v })} />
            <label className="block">
              <span className="mb-0.5 block text-2xs font-medium uppercase tracking-wide text-faint">Cuerpo (un párrafo por línea)</span>
              <textarea
                className={`${inputClass} h-28 resize-y`}
                value={e.cuerpo}
                onChange={(ev) => set({ cuerpo: ev.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Botón (texto)" value={e.botonTexto} onChange={(v) => set({ botonTexto: v })} />
              <Campo label="Botón (link)" value={e.botonLink} onChange={(v) => set({ botonLink: v })} />
            </div>
          </Card>

          {/* Pie */}
          <Card className="space-y-3 p-4">
            <p className="text-2xs font-medium uppercase tracking-wide text-faint">Pie</p>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Grupo" value={e.grupo} onChange={(v) => set({ grupo: v })} />
              <Campo label="Línea de marcas" value={e.marcasLinea} onChange={(v) => set({ marcasLinea: v })} />
              <Campo label="Área / firma" value={e.area} onChange={(v) => set({ area: v })} />
              <div>
                <span className="mb-0.5 block text-2xs font-medium uppercase tracking-wide text-faint">Email de contacto</span>
                <input className={inputClass} list="mails-sugeridos" value={e.email} onChange={(ev) => set({ email: ev.target.value })} />
                <datalist id="mails-sugeridos">
                  {MAILS_SUGERIDOS.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
              <Campo label="Sitio web" value={e.web} onChange={(v) => set({ web: v })} />
              <Campo label="Ubicación" value={e.ubicacion} onChange={(v) => set({ ubicacion: v })} />
            </div>
            <Campo label="Línea legal" value={e.legal} onChange={(v) => set({ legal: v })} />
          </Card>
        </div>

        {/* ---------------- Preview + acciones ---------------- */}
        <div className="space-y-3">
          <Card className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-2xs font-medium uppercase tracking-wide text-faint">Preview</p>
              <div className="flex flex-wrap gap-2">
                <Accion primary onClick={copiarGmail}>{copiado === "gmail" ? "✓ copiado" : "Copiar para Gmail"}</Accion>
                <Accion onClick={copiarHTML}>{copiado === "html" ? "✓ copiado" : "Copiar HTML"}</Accion>
                <Accion onClick={() => setE(estadoInicial())}>Restablecer</Accion>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-line">
              <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
            </div>
            <p className="text-2xs text-faint">
              “Copiar para Gmail” pega el email con formato en el cuerpo del mail. El <b>asunto</b> se copia aparte
              (en Gmail va en otro campo).
            </p>
          </Card>
        </div>
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

function Accion({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
        primary
          ? "bg-action text-white hover:bg-action-700"
          : "border border-line bg-surface text-ink hover:border-action/40 hover:text-action"
      }`}
    >
      {children}
    </button>
  );
}
