import { VerifyForm } from "./verify-form";

export const metadata = {
  title: "Verificando acceso",
  robots: { index: false, follow: false },
};

export default async function VerificarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token = "", email = "" } = await searchParams;
  return <VerifyForm token={token} email={email} />;
}
