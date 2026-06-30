// Generador de firma nativo — réplica del HTML email-safe del generador externo
// (tablas + estilos inline). Permite autocompletar campos y preview en la app.
import assets from "./firma-assets.json";

const ICONS = assets.icons as Record<string, string>;
const LOGOS = assets.logos as Record<string, string>;
export const LOGO_LABEL: Record<string, string> = {
  desembarco: "El Desembarco",
  tasty: "Mr. Tasty",
  milago: "Mila & Go",
};

export const REDES = [
  { key: "instagram", label: "Instagram", ph: "https://instagram.com/eldesembarco" },
  { key: "facebook", label: "Facebook", ph: "https://facebook.com/eldesembarco" },
  { key: "whatsapp", label: "WhatsApp", ph: "https://wa.me/5491154230955" },
  { key: "linkedin", label: "LinkedIn", ph: "https://linkedin.com/company/..." },
] as const;

export type MarcaLogo = "desembarco" | "tasty" | "milago";
export type RedKey = (typeof REDES)[number]["key"];

export interface FirmaState {
  nombre: string;
  puesto: string;
  tel: string;
  email: string;
  web: string;
  logos: Record<MarcaLogo, boolean>;
  redes: Record<RedKey, { on: boolean; url: string }>;
}

export function firmaInicial(): FirmaState {
  return {
    nombre: "",
    puesto: "",
    tel: "11 5423-0955",
    email: "",
    web: "www.eldesembarco.com",
    logos: { desembarco: true, tasty: true, milago: true },
    redes: {
      instagram: { on: false, url: "" },
      facebook: { on: false, url: "" },
      whatsapp: { on: false, url: "" },
      linkedin: { on: false, url: "" },
    },
  };
}

function esc(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function logoCells(state: FirmaState) {
  const order: MarcaLogo[] = ["desembarco", "tasty", "milago"];
  let cells = "";
  order.forEach((k) => {
    if (!state.logos[k]) return;
    const u = LOGOS[k];
    cells += `<td style="padding-right:18px;vertical-align:middle"><img src="${esc(
      u
    )}" alt="${esc(LOGO_LABEL[k])}" height="36" style="height:36px;display:block;border:0"></td>`;
  });
  return cells
    ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>${cells}</tr></table>`
    : "";
}

function contactRow(iconKey: string, html: string) {
  return `<tr>
    <td style="padding:3px 15px 3px 0;vertical-align:middle"><img src="${ICONS[iconKey]}" width="20" height="20" alt="" style="display:block;border:0"></td>
    <td style="padding:3px 0;vertical-align:middle;font:13px Arial,Helvetica,sans-serif;color:#EDEDED;letter-spacing:.01em">${html}</td>
  </tr>`;
}

function socialCell(state: FirmaState) {
  const active = REDES.filter((r) => state.redes[r.key].on && state.redes[r.key].url.trim());
  if (!active.length) return "";
  let imgs = "";
  active.forEach((r) => {
    const url = state.redes[r.key].url.trim();
    imgs += `<a href="${esc(url)}" style="text-decoration:none;margin-right:8px;display:inline-block"><img src="${ICONS[r.key]}" width="26" height="26" alt="${esc(
      r.label
    )}" style="display:inline-block;border:0"></a>`;
  });
  return `<tr><td colspan="2" style="padding:11px 0 1px 0">${imgs}</td></tr>`;
}

export function buildSignatureHTML(state: FirmaState): string {
  const tel = esc(state.tel),
    email = esc(state.email);
  const web = state.web.trim();
  const webHref = web ? (web.match(/^https?:\/\//) ? web : "https://" + web.replace(/^www\./, "www.")) : "";

  const contacto = `
      <table cellpadding="0" cellspacing="0" border="0" role="presentation">
        ${state.tel ? contactRow("phone", `<span style="color:#EDEDED">${tel}</span>`) : ""}
        ${state.email ? contactRow("mail", `<a href="mailto:${email}" style="color:#EDEDED;text-decoration:none">${email}</a>`) : ""}
        ${web ? contactRow("globe", `<a href="${esc(webHref)}" style="color:#EDEDED;text-decoration:none">${esc(web)}</a>`) : ""}
        ${socialCell(state)}
      </table>`;

  return `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#0E0E0E;border-radius:18px;font-family:Arial,Helvetica,sans-serif">
  <tr><td style="padding:24px 32px">
    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
      <tr>
        <td style="vertical-align:middle;padding-right:30px">
          <div style="font:bold 21px Arial,Helvetica,sans-serif;color:#FFFFFF;letter-spacing:-.01em">${esc(state.nombre)}</div>
          ${state.puesto ? `<div style="font:13px Arial,Helvetica,sans-serif;color:#AEABA2;padding-top:4px">${esc(state.puesto)}</div>` : ""}
          <div style="padding-top:18px">${logoCells(state)}</div>
        </td>
        <td style="vertical-align:middle;border-left:1px solid #2C2C2C;padding-left:20px">
          ${contacto}
        </td>
      </tr>
    </table>
  </td></tr>
</table>`.trim();
}
