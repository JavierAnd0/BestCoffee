"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "../env";
import { resolveActiveTenantSlug } from "../tenant";
import {
  clearCustomerSessionCookies,
  clearNeonAndLegacyCookies,
  setCustomerSessionCookies,
} from "../auth/session-store";
import { sendPasswordResetEmail } from "../email/resend";

export type AuthState = { error: string } | null;
export type RegisterState = null | { error: string } | { success: true; message: string };
export type PasswordResetState = null | { error: string } | { sent: true };

// Esquemas mínimos que coinciden con los DTOs reales del backend
// (CustomerLoginDto / CustomerRegisterDto / ForgotPasswordDto).
const loginSchema = z.object({
  email: z.string().trim().min(1, "El correo es requerido.").email("Correo inválido."),
  password: z.string().min(1, "La contraseña es requerida."),
  next: z.string().trim().optional(),
});

const registerSchema = z.object({
  email: z.string().trim().min(1, "El correo es requerido.").email("Correo inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  terms: z.string().min(1, "Debes aceptar los Términos de uso y la Política de privacidad."),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1).email("Correo inválido."),
});

// ── Login ─────────────────────────────────────────────────────────────────────
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? "/cuenta"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos de ingreso inválidos." };
  }

  const { email, password } = parsed.data;
  const next = parsed.data.next ?? "/cuenta";

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
    // Limpiar sesiones previas de Neon Auth para evitar colisiones entre métodos de ingreso
    clearNeonAndLegacyCookies(store);
    setCustomerSessionCookies(store, tokenValue);
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
  const parsed = registerSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    firstName: String(formData.get("firstName") ?? "") || undefined,
    lastName: String(formData.get("lastName") ?? "") || undefined,
    terms: formData.get("terms") ? "on" : "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos de registro inválidos." };
  }

  const { email, password, firstName, lastName } = parsed.data;

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

// ── Password Recovery ─────────────────────────────────────────────────────────
export async function requestPasswordResetAction(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Por favor ingresa un correo electrónico válido." };
  }
  const { email } = parsed.data;

  const tenantSlug = await resolveActiveTenantSlug();
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  let backendHandled = false;
  try {
    const res = await fetch(`${env.apiUrlInternal}/v1/auth/customer/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    if (res.ok) backendHandled = true;
  } catch {
    // Fallback a envío por Resend
  }

  if (!backendHandled) {
    await sendPasswordResetEmail({
      to: email,
      resetLink: `${origin}/login?email=${encodeURIComponent(email)}`,
    });
  }

  return { sent: true };
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logoutAction(shouldRedirect: boolean | FormData = true) {
  const store = await cookies();
  const token = store.get("customer_token")?.value;
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

  clearCustomerSessionCookies(store);

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
