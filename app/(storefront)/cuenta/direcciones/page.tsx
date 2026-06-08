import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_ADDRESSES } from "@/lib/mocks/account";

export const metadata: Metadata = { title: "Direcciones" };

export default function AddressesPage() {
  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Envío</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Mis direcciones
        </h1>
      </header>
      <div className="space-y-3">
        {MOCK_ADDRESSES.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-border bg-background p-5 flex items-start gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{a.label}</span>
                {a.isDefault && <Badge variant="outline">Predeterminada</Badge>}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{a.line}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Editar
              </Button>
              <Button variant="ghost" size="sm">
                Eliminar
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full">
          + Agregar dirección
        </Button>
      </div>
    </div>
  );
}
