import { AccesoForm } from "./acceso-form";

export const metadata = {
  title: "Acceso de operadores",
  robots: { index: false, follow: false },
};

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;
  return (
    <AccesoForm
      notice={
        motivo === "2fa"
          ? "Tu cuenta tiene la verificación en dos pasos activa. Vuelve a entrar con el enlace y el código de tu app."
          : undefined
      }
    />
  );
}
