"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "../env";
import { resolveActiveTenantSlug } from "../tenant";

export type AuthState = { error: string } | null;
export type RegisterState = null | { error: string } | { success: true; message: string };

// ── Login ─────────────────────────────────────────────────────────────────────
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/cuenta").trim();

  if (!email) return { error: "El correo es requerido." };

  const tenantSlug = await resolveActiveTenantSlug();

  // Login de cliente (storefront). Los operadores acceden por magic link en
  // /acceso; este flujo es solo para clientes finales.
  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/auth/customer/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return { error: "No se pudo conectar con el servidor. Intenta de nuevo." };
  }

  if (!res.ok) {
    let message = "Correo o contraseña incorrectos.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body?.message === "string") message = body.message;
    } catch { /* ignore */ }
    return { error: message };
  }

  // JWT is delivered in Set-Cookie or JSON body; store it under our session name
  const setCookieHeader = res.headers.get("set-cookie") ?? "";
  const rawPair = setCookieHeader.split(";")[0]; // e.g. "customer_token=eyJ..."
  const eqIdx = rawPair.indexOf("=");
  let tokenValue = eqIdx >= 0 ? rawPair.slice(eqIdx + 1).trim() : "";

  if (!tokenValue) {
    try {
      const clonedRes = res.clone();
      const body = (await clonedRes.json()) as { accessToken?: string; token?: string; customer_token?: string };
      tokenValue = body?.accessToken || body?.token || body?.customer_token || "";
    } catch { /* ignore */ }
  }

  if (tokenValue) {
    const store = await cookies();
    const cookieOpts = {
      httpOnly: true,
      secure: !env.isDev,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    };
    // Limpiar sesiones previas de Neon Auth para evitar colisiones entre métodos de ingreso
    clearNeonAndLegacyCookies(store);

    // bestcoffee-session: used by middleware (proxy.ts) for customer route protection
    store.set("bestcoffee-session", tokenValue, cookieOpts);
    // customer_token: forwarded verbatim to the backend for cookie-based auth guards
    store.set("customer_token", tokenValue, cookieOpts);
  }

  const isSafeRelative = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
  const target = isSafeRelative ? next : "/cuenta";
  redirect(target);
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim() || undefined;
  const lastName = String(formData.get("lastName") ?? "").trim() || undefined;

  const terms = formData.get("terms");
  if (!terms) return { error: "Debes aceptar los Términos de uso y la Política de privacidad." };
  if (!email || !password) return { error: "El correo y la contraseña son requeridos." };

  const tenantSlug = await resolveActiveTenantSlug();

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/auth/customer/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
      },
      body: JSON.stringify({ email, password, firstName, lastName }),
      cache: "no-store",
    });
  } catch {
    return { error: "No se pudo conectar con el servidor. Intenta de nuevo." };
  }

  if (!res.ok) {
    let error = "No se pudo crear la cuenta. Intenta de nuevo.";
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) error = body.message[0];
      else if (typeof body.message === "string") error = body.message;
    } catch { /* ignore */ }
    return { error };
  }

  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return {
    success: true,
    message:
      body.message ??
      "Cuenta creada. Revisa tu correo para verificar tu dirección.",
  };
}

function clearNeonAndLegacyCookies(store: Awaited<ReturnType<typeof cookies>>) {
  const secureCookies = [
    "__Secure-neon-auth.session_token",
    "__Secure-neon-auth.local.session_data",
    "__Secure-neon-auth.session_challenge",
    "__Secure-neon-auth.session_challange",
  ];
  for (const name of secureCookies) {
    store.set(name, "", {
      maxAge: 0,
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  const standardCookies = [
    "customer_email",
    "customer_name",
    "neon-auth.session_token",
    "neon-auth.local.session_data",
    "neon-auth.session_challenge",
    "neon-auth.session_challange",
    "better-auth.session_token",
    "better-auth.session_data",
    "better-auth.local.session_data",
  ];
  for (const name of standardCookies) {
    store.set(name, "", { maxAge: 0, path: "/" });
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logoutAction(shouldRedirect: boolean | FormData = true) {
  const store = await cookies();
  const token =
    store.get("bestcoffee-session")?.value ??
    store.get("customer_token")?.value;
  const tenantSlug = await resolveActiveTenantSlug();

  // Notify the backend (best effort — clear cookies regardless)
  try {
    await fetch(`${env.apiUrlInternal}/v1/auth/customer/logout`, {
      method: "POST",
      headers: {
        "X-Tenant-Slug": tenantSlug,
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
              Cookie: `customer_token=${token}`,
            }
          : {}),
      },
      cache: "no-store",
    });
  } catch { /* ignore */ }

  store.set("bestcoffee-session", "", { maxAge: 0, path: "/" });
  store.set("customer_token", "", { maxAge: 0, path: "/" });
  clearNeonAndLegacyCookies(store);

  if (env.neonAuthUrl) {
    try {
      const { auth } = await import("../auth/server");
      await auth.signOut();
    } catch { /* ignore */ }
  }

  if (shouldRedirect !== false) {
    redirect("/login");
  }

  return { success: true };
}
