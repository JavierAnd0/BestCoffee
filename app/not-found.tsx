import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4 py-20 text-center">
      <div className="max-w-md space-y-5">
        <Eyebrow>404</Eyebrow>
        <h1 className="font-display text-5xl font-semibold tracking-tight">
          Esta página se escapó del tostador
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          No encontramos lo que buscabas. Tal vez el enlace caducó o cambió de
          lugar. Vuelve al catálogo para seguir explorando.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button render={<Link href="/">Volver al inicio</Link>} />
          <Button variant="outline" render={<Link href="/catalogo">Ver catálogo</Link>} />
        </div>
      </div>
    </div>
  );
}
