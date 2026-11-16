import { cookies } from "next/headers";
import { MfaForm } from "./mfa-form";

export const metadata = {
  title: "Verificación en dos pasos",
  robots: { index: false, follow: false },
};

export default async function MfaPage() {
  // Sin el paso pendiente (expiró o se llegó directo) solo se ofrece volver.
  const pending = Boolean((await cookies()).get("bestcoffee-mfa-pending")?.value);
  return <MfaForm pending={pending} />;
}
