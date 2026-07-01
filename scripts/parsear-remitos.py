# -*- coding: utf-8 -*-
"""
Parsea los PDFs de remitos de entrega -> un CSV consolidado para la pantalla
"Remitos vs Ventas" del dashboard (subís ese CSV ahí).

Requiere: pip install pypdf

Uso:
  python scripts/parsear-remitos.py                         # PDFs de la carpeta Descargas
  python scripts/parsear-remitos.py --dir "C:\\ruta\\pdfs"    # otra carpeta
  python scripts/parsear-remitos.py --desde 2026-06-16 --hasta 2026-06-30
  python scripts/parsear-remitos.py --out "C:\\ruta\\remitos.csv"

Salida (columnas): fecha, marca, sucursal, codigo, descripcion, cantidad, remito
"""
import argparse, csv, glob, os, re, sys, datetime

try:
    from pypdf import PdfReader
except ImportError:
    print("Falta pypdf. Instalalo con:  pip install pypdf")
    sys.exit(1)

CODELINE = re.compile(r'^(\d{6})\s+(.+?)\s+(\d+(?:[.,]\d+)?)$')

def parse_pdf(path):
    try:
        txt = "\n".join((p.extract_text() or "") for p in PdfReader(path).pages)
    except Exception as e:
        print(f"  (salteo {os.path.basename(path)}: {e})")
        return []
    out = []
    for b in re.split(r'REMITO\s+R', txt)[1:]:
        mnro = re.search(r'N[°º\W]\s*([\d\-]{8,})', b)
        mfec = re.search(r'FECHA:\s*(\d{2}/\d{2}/\d{4})', b)
        mdes = re.search(r'DESTINO\s*\n\s*(.+)', b)
        nro = mnro.group(1) if mnro else ""
        fecha = mfec.group(1) if mfec else ""
        dest = mdes.group(1).strip() if mdes else ""
        parts = re.split(r'\s[–—�‒\-]\s', dest, maxsplit=1)
        marca = parts[0].strip() if parts else dest
        suc = parts[1].strip() if len(parts) > 1 else ""
        for line in b.split("\n"):
            m = CODELINE.match(line.strip())
            if not m:
                continue
            try:
                q = float(m.group(3).replace(".", "").replace(",", "."))
            except ValueError:
                continue
            out.append({"fecha": fecha, "marca": marca, "sucursal": suc,
                        "codigo": m.group(1), "descripcion": m.group(2).strip(),
                        "cantidad": q, "remito": nro})
    return out

def in_range(fecha, desde, hasta):
    if not (desde or hasta):
        return True
    try:
        d = datetime.datetime.strptime(fecha, "%d/%m/%Y").date()
    except ValueError:
        return False
    if desde and d < datetime.date.fromisoformat(desde): return False
    if hasta and d > datetime.date.fromisoformat(hasta): return False
    return True

def main():
    downloads = os.path.join(os.path.expanduser("~"), "Downloads")
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=downloads, help="carpeta con los PDF de remitos")
    ap.add_argument("--out", default=os.path.join(downloads, "remitos_consolidado.csv"))
    ap.add_argument("--desde", help="AAAA-MM-DD (opcional)")
    ap.add_argument("--hasta", help="AAAA-MM-DD (opcional)")
    a = ap.parse_args()

    pdfs = sorted(glob.glob(os.path.join(a.dir, "*.pdf")))
    if not pdfs:
        print(f"No hay PDFs en {a.dir}"); sys.exit(1)
    print(f"Parseando {len(pdfs)} PDFs de {a.dir} ...")
    rows = []
    for p in pdfs:
        rows += [r for r in parse_pdf(p) if in_range(r["fecha"], a.desde, a.hasta)]

    with open(a.out, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["fecha", "marca", "sucursal", "codigo", "descripcion", "cantidad", "remito"])
        w.writeheader(); w.writerows(rows)

    sucs = len({r["sucursal"] for r in rows})
    rems = len({r["remito"] for r in rows})
    print(f"OK: {len(rows)} lineas | {rems} remitos | {sucs} sucursales")
    print(f"CSV: {a.out}")
    print("Subilo en el dashboard -> Remitos vs Ventas.")

if __name__ == "__main__":
    main()
