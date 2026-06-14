import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { CreateTenantForm } from "@/components/platform/create-tenant-form";

export const metadata: Metadata = { title: "Nuevo tenant · Superadmin" };

export default function NewTenantPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/platform/superadmin/tenants"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Tenants
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo tenant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea la cafetería, su primer admin y el dominio en un solo paso.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-background p-6">
        <CreateTenantForm />
      </div>
    </div>
  );
}
