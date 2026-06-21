"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "../env";

export type AuthState = { error: string } | null;
export type RegisterState = null | { error: string } | { success: true; message: string };

// ── Login ─────────────────────────────────────────────────────────────────────
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/cuenta");

  if (!email) return { error: "El correo es requerido." };

  // Login de cliente (storefront). Los operadores acceden por magic link en
  // /acceso; este flujo es solo para clientes finales.
  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/auth/customer/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": env.defaultTenantSlug,
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

  // JWT is delivered in Set-Cookie; store it under our session name
  const setCookieHeader = res.headers.get("set-cookie") ?? "";
  const rawPair = setCookieHeader.split(";")[0]; // e.g. "customer_token=eyJ..."
  const eqIdx = rawPair.indexOf("=");
  const tokenValue = eqIdx >= 0 ? rawPair.slice(eqIdx + 1).trim() : "";

  if (tokenValue) {
    const store = await cookies();
    const cookieOpts = {
      httpOnly: true,
      secure: !env.isDev,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    };
    // bestcoffee-session: used by middleware (proxy.ts) for route protection
    store.set("bestcoffee-session", tokenValue, cookieOpts);
    // customer_token: forwarded verbatim to the backend for cookie-based auth guards
    store.set("customer_token", tokenValue, cookieOpts);
  }

  const target = next.startsWith("/") ? next : "/cuenta";
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

  let res: Response;
  try {
    res = await fetch(`${env.apiUrlInternal}/v1/auth/customer/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": env.defaultTenantSlug,
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

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logoutAction() {
  const store = await cookies();
  const token = store.get("bestcoffee-session")?.value;

  // Notify the backend (best effort — clear cookies regardless)
  try {
    await fetch(`${env.apiUrlInternal}/v1/auth/customer/logout`, {
      method: "POST",
      headers: {
        "X-Tenant-Slug": env.defaultTenantSlug,
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

  redirect("/login");
}
