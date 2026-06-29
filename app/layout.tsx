import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getSesion } from "@/lib/session";
import { ROLES, puedeVer, homeDe } from "@/lib/roles";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CDP · Control — DS Group",
  description: "Comparativa de pedidos al CDP contra ventas de sucursal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const sesion = getSesion();
  const pathname = headers().get("x-pathname") ?? "";
  const ruta = pathname === "/" ? "/" : "/" + (pathname.split("/").filter(Boolean)[0] ?? "");

  // Gating por rol (la fuente de verdad es el store, vía getSesion): si el rol
  // no puede ver esta ruta, lo mandamos a su home.
  if (sesion && pathname && !puedeVer(sesion.rol, ruta)) {
    redirect(homeDe(sesion.rol));
  }

  const body = (
    <html lang="es" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="font-sans">
        {sesion ? (
          <div className="flex h-screen overflow-hidden">
            <Sidebar rol={sesion.rol} />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Topbar email={sesion.email} rolLabel={ROLES[sesion.rol].label} />
              <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
  return body;
}
