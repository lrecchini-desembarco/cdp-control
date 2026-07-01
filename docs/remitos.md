# Remitos vs Ventas

Pantalla `/remitos`: subís el **CSV de remitos** (lo entregado por el CDP) y audita la
**cobertura contra las ventas de Tango** del mismo período — qué sucursales recibieron
mercadería pero **no registran ventas** (y viceversa). Todo exportable a Sheets/Excel.

## Flujo (2 pasos)
1. **Generar el CSV de remitos desde los PDFs** (repetible, para cualquier período):
   ```bash
   pip install pypdf            # una vez
   python scripts/parsear-remitos.py --desde 2026-06-16 --hasta 2026-06-30
   ```
   Deja `remitos_consolidado.csv` en Descargas (columnas: fecha, marca, sucursal,
   codigo, descripcion, cantidad, remito). Sin `--desde/--hasta` toma todos los PDFs
   de la carpeta; con `--dir` apuntás a otra carpeta.
2. **Subirlo en el dashboard** → `/remitos` → *Elegir CSV…*. La pantalla:
   - Deriva el período (min/max fecha) y trae las ventas de Tango por sucursal.
   - Muestra 3 vistas: **Cobertura (audit)**, **Por sucursal**, **Por insumo**.
   - Botón **⬇ Exportar (Sheets/Excel)** en cada vista.

## Qué audita
- **REMITO SIN VENTAS** 🔴 — recibió del CDP pero no registra ventas en Tango (revisar).
- **VENTAS SIN REMITO** 🟠 — vende pero no recibió del CDP en el período (franquicias del
  interior, se abastecen por otra vía).
- **OK** — tiene ambas.

El cruce es a nivel **sucursal**. La reconciliación unidad-a-unidad **insumo↔producto**
necesita la receta (BOM) producto→insumo (no disponible como dato real).

## Estructura
- `scripts/parsear-remitos.py` — PDFs → CSV.
- `components/views/RemitosView.tsx` + `app/remitos/page.tsx` — pantalla (parsea el CSV client-side).
- `app/api/ventas/sucursales` (`lib/ventas.ts` → `getVentasPorSucursal`) — ventas por sucursal (Tango).
- Nav: `Sidebar.tsx` + `lib/roles.ts` (admin y operaciones).
