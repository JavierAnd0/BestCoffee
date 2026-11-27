import { env } from "../env";
import { operatorFetch } from "../api/gateway";

export type MemberRole = "TENANT_OWNER" | "TENANT_EDITOR" | "TENANT_ORDERS";

export interface TeamMember {
  userId: string;
  email: string;
  name: string | null;
  role: MemberRole;
  createdAt: string | null;
  /** Último inicio de sesión. Null: aún no ha entrado al panel. */
  lastLoginAt?: string | null;
}

export type TeamResult =
  | { ok: true; members: TeamMember[] }
  /** `forbidden`: el operador no es dueño de la tienda. */
  | { ok: false; reason: "forbidden" | "error" };

const MOCK_TEAM: TeamMember[] = [
  {
    userId: "mock_owner",
    email: "hola@cafeorigen.co",
    name: "María R.",
    role: "TENANT_OWNER",
    createdAt: "2026-01-12T00:00:00.000Z",
    lastLoginAt: new Date().toISOString(),
  },
  {
    userId: "mock_orders",
    email: "despachos@cafeorigen.co",
    name: "Andrés P.",
    role: "TENANT_ORDERS",
    createdAt: "2026-03-02T00:00:00.000Z",
    lastLoginAt: null,
  },
];

/** Equipo de la tienda. Solo lo puede leer un dueño (el backend responde 403 al resto). */
export async function listTeamMembers(): Promise<TeamResult> {
  if (env.useMocks) return { ok: true, members: MOCK_TEAM };
  const r = await operatorFetch<TeamMember[]>("/v1/admin/members");
  if (!r.ok) return { ok: false, reason: r.status === 403 ? "forbidden" : "error" };
  return { ok: true, members: Array.isArray(r.data) ? r.data : [] };
}
