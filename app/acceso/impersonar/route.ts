import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { clientIpHeaders } from "@/lib/api/client-ip";

// "Entrar como admin" desde el superadmin. El panel de la plataforma vive en
// otro dominio, así que trae aquí un pase de un minuto y un solo uso; se canjea
// en el backend y la sesión de impersonación queda en el dominio de ESTA tienda.

const SESSION_MAX_AGE = 60 * 60 * 2; // igual que la sesión que firma el backend

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const fail = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/acceso";
    url.search = "?motivo=impersonacion";
    return NextResponse.redirect(url);
  };
  if (!token || token.length > 2048) return fail();

  let data: { accessToken?: string; tenant?: { name?: string } } | null = null;
  try {
    const res = await fetch(`${env.apiUrlInternal}/v1/auth/impersonation`, {
      method: "POST",
      headers: { ...(await clientIpHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    if (res.ok) data = await res.json();
  } catch {
    /* backend sin conexión */
  }
  if (!data?.accessToken) return fail();

  const url = req.nextUrl.clone();
  url.pathname = "/admin";
  url.search = "";
  const res = NextResponse.redirect(url);
  const opts = {
    httpOnly: true,
    secure: !env.isDev,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
  res.cookies.set("bestcoffee-impersonation", data.accessToken, opts);
  res.cookies.set("bestcoffee-impersonation-tenant", data.tenant?.name ?? "Tienda", opts);
  // El pase va en la URL: que no se guarde en caché ni se reenvíe como Referer.
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
