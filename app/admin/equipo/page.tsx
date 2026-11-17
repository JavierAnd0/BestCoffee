import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { getCurrentOperator } from "@/lib/data/admin";
import { listTeamMembers } from "@/lib/data/members";
import { getOperatorTenantRole, isOwnerRole } from "@/lib/data/operator-role";
import { AddMemberDialog, RoleGuide, TeamTable } from "./team-client";

export const metadata: Metadata = { title: "Equipo · Admin" };

const NOT_OWNER = "Solo quien tiene el rol de dueño puede ver y cambiar el equipo de la tienda.";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Equipo" />
      <div className="rounded-lg border border-border bg-background p-8 text-sm text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export default async function AdminTeamPage() {
  // Quien no es dueño ve un aviso (no un error) aunque entre por la URL.
  const role = await getOperatorTenantRole();
  if (role.ok && !isOwnerRole(role.role)) return <Notice>{NOT_OWNER}</Notice>;

  const [team, operator] = await Promise.all([listTeamMembers(), getCurrentOperator()]);

  if (!team.ok) {
    return (
      <Notice>
        {team.reason === "forbidden"
          ? NOT_OWNER
          : "No pudimos cargar el equipo. Recarga la página en un momento."}
      </Notice>
    );
  }

  const count = team.members.length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo"
        description={`${count} ${count === 1 ? "persona" : "personas"} con acceso al panel`}
        actions={<AddMemberDialog />}
      />
      <TeamTable members={team.members} currentEmail={operator?.email ?? null} />
      <RoleGuide />
      <p className="text-xs text-muted-foreground max-w-prose">
        No se envía invitación automática. Al agregar a alguien te damos el enlace
        de acceso para que se lo compartas: entra con su correo y recibe ahí un
        enlace de un solo uso para iniciar sesión, sin contraseña.
      </p>
    </div>
  );
}
