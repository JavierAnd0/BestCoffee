import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { platformFetch } from "@/lib/api/platform";
import { ImpersonateButton } from "@/components/platform/impersonate-button";

interface TenantDetail {
  id: string;
  slug: string;
  name: string;
  tier: string;
  features: Record<string, unknown>;
  branding: Record<string, unknown>;
  createdAt: string;
  _count: { orders: number; customers: number; subscriptions: number };
  domains: Array<{ id: string; domain: string; isPrimary: boolean; verified: boolean }>;
  memberships: Array<{
    role: string;
    user: { id: string; email: string; name: string | null };
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const t = await platformFetch<{ name: string }>(`/v1/platform/tenants/${id}`);
    return { title: `${t.name} · Superadmin` } satisfies Metadata;
  } catch {
    return { title: "Tenant · Superadmin" } satisfies Metadata;
  }
}

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await platformFetch<TenantDetail>(`/v1/platform/tenants/${id}`);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/platform/superadmin/tenants"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Tenants
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">{tenant.slug}</p>
          </div>
          <ImpersonateButton tenantId={tenant.id} tenantName={tenant.name} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pedidos", value: tenant._count.orders },
          { label: "Clientes", value: tenant._count.customers },
          { label: "Suscripciones", value: tenant._count.subscriptions },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-background p-4">
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Info general */}
        <Section title="Configuración">
          <Row label="Tier">
            <Badge>{tenant.tier}</Badge>
          </Row>
          <Row label="Creado">
            {new Date(tenant.createdAt).toLocaleDateString("es-CO", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </Row>
          <Row label="Features">
            <pre className="text-xs bg-muted rounded p-2 max-h-32 overflow-auto">
              {JSON.stringify(tenant.features, null, 2)}
            </pre>
          </Row>
        </Section>

        {/* Dominios */}
        <Section title="Dominios">
          {tenant.domains.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin dominios configurados</p>
          ) : (
            tenant.domains.map((d) => (
              <Row key={d.id} label={d.isPrimary ? "Principal" : "Adicional"}>
                <span className="font-mono text-xs">{d.domain}</span>
                {d.verified ? (
                  <Badge className="ml-2 bg-green-500/10 text-green-700 border-green-500/20">Verificado</Badge>
                ) : (
                  <Badge className="ml-2 bg-muted text-muted-foreground border-border">Pendiente</Badge>
                )}
              </Row>
            ))
          )}
        </Section>
      </div>

      {/* Miembros */}
      <Section title="Miembros del equipo">
        <div className="divide-y divide-border">
          {tenant.memberships.map((m) => (
            <div key={m.user.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{m.user.name ?? m.user.email}</p>
                {m.user.name && (
                  <p className="text-xs text-muted-foreground">{m.user.email}</p>
                )}
              </div>
              <Badge className="bg-muted text-muted-foreground border-border">{m.role}</Badge>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
