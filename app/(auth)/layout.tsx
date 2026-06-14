import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Iniciar sesión · ORÍGEN", template: "%s · ORÍGEN" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
