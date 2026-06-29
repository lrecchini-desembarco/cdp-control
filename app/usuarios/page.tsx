import { redirect } from "next/navigation";
import { getSesion } from "@/lib/session";
import { homeDe } from "@/lib/roles";
import UsuariosView from "@/components/views/UsuariosView";

export const dynamic = "force-dynamic";

export default function Page() {
  const s = getSesion();
  if (!s) redirect("/login");
  if (s.rol !== "admin") redirect(homeDe(s.rol));
  return <UsuariosView />;
}
