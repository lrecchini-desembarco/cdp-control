import { redirect } from "next/navigation";
import { getSesion } from "@/lib/session";
import { homeDe } from "@/lib/roles";
import LoginForm from "@/components/views/LoginForm";

export const dynamic = "force-dynamic";

export default function Page() {
  const s = getSesion();
  if (s) redirect(homeDe(s.rol));
  return <LoginForm />;
}
