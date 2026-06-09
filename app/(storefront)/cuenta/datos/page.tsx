import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { getCurrentCustomer } from "@/lib/data/account";

export const metadata: Metadata = { title: "Mis datos" };

export default async function ProfilePage() {
  const customer = await getCurrentCustomer();
  return (
    <div className="space-y-8 max-w-xl">
      <header>
        <Eyebrow>Tu perfil</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Mis datos
        </h1>
      </header>
      <form className="space-y-4">
        <Field label="Nombre completo" value={customer.name} />
        <Field label="Email" value={customer.email} type="email" />
        <Field label="Teléfono" value={customer.phone} />
        <div className="pt-2">
          <Button>Guardar cambios</Button>
        </div>
      </form>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-xl font-semibold mb-3">Preferencias de correo</h2>
        <div className="space-y-2 text-sm">
          {[
            "Recordatorios de próximo envío",
            "Novedades y nuevos lanzamientos",
            "Promociones y descuentos",
            "Boletín del blog",
          ].map((p, i) => (
            <label key={p} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked={i < 2} className="size-4 accent-foreground" />
              <span>{p}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-xl font-semibold mb-3 text-destructive">
          Zona delicada
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Eliminar tu cuenta cancela todas tus suscripciones activas. Esta acción no se
          puede deshacer.
        </p>
        <Button variant="destructive" size="sm">
          Eliminar mi cuenta
        </Button>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  type = "text",
}: {
  label: string;
  value: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
        {label}
      </span>
      <input
        type={type}
        defaultValue={value}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-foreground/40"
      />
    </label>
  );
}
