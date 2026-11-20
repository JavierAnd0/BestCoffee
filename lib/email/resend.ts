import { Resend } from "resend";
import { env } from "@/lib/env";

export const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export interface SendMagicLinkParams {
  to: string;
  magicLink: string;
  recipientName?: string;
}

export interface SendContactMessageParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Tienda del formulario: firma el pie del correo (sin dato, no se pone ubicación). */
  store?: EmailStore;
  /** Correo de contacto de la tienda: recibe el mensaje. Sin él, el dueño de la plataforma. */
  recipient?: string | null;
}

/** Datos de la tienda para el pie de los correos. */
export interface EmailStore {
  name: string;
  city?: string | null;
}

export interface SendOrderConfirmationParams {
  to: string;
  customerName: string;
  orderId: string;
  totalFormatted: string;
  items: Array<{ name: string; variant?: string; qty: number; priceFormatted: string }>;
  shippingAddress?: string;
}

// ── Email Styling Helper ───────────────────────────────────────────────────────
const brandColors = {
  bg: "#faf7f2",
  card: "#ffffff",
  text: "#1c1917",
  muted: "#78716c",
  primary: "#1c1917",
  accent: "#8c6239",
  border: "#e7e2db",
  buttonText: "#ffffff",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Pie con el nombre y la ciudad de la tienda si se conocen; sin dato, solo la marca. */
function footerLine(store?: EmailStore): string {
  if (!store?.name?.trim()) return "Bestkofi";
  return [store.name.trim(), store.city?.trim()].filter(Boolean).map((v) => escapeHtml(v as string)).join(" · ");
}

function baseTemplate(contentHtml: string, store?: EmailStore): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bestkofi</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${brandColors.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${brandColors.text}; }
    .container { max-width: 560px; margin: 40px auto; background: ${brandColors.card}; border: 1px solid ${brandColors.border}; border-radius: 12px; overflow: hidden; }
    .header { padding: 32px 40px 20px; border-bottom: 1px solid ${brandColors.border}; text-align: center; }
    .logo { font-size: 20px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${brandColors.text}; }
    .content { padding: 36px 40px; }
    .footer { padding: 24px 40px; border-top: 1px solid ${brandColors.border}; font-size: 12px; color: ${brandColors.muted}; text-align: center; background-color: #faf9f6; }
    .button { display: inline-block; background-color: ${brandColors.primary}; color: ${brandColors.buttonText} !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 24px 0; text-align: center; }
    p { line-height: 1.6; font-size: 15px; color: ${brandColors.text}; margin: 0 0 16px 0; }
    .meta { font-size: 13px; color: ${brandColors.muted}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Bestkofi</div>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0; font-size: 12px; color: ${brandColors.muted};">
        ${footerLine(store)}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ── 1. Enviar Enlace Mágico de Operador / Superadmin ───────────────────────────
export async function sendMagicLinkEmail({
  to,
  magicLink,
  recipientName,
}: SendMagicLinkParams): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.info(
      `[Resend notice] RESEND_API_KEY no configurada. Magic link para ${to}: ${magicLink}`,
    );
    return { success: false, error: "RESEND_API_KEY no configurada en las variables de entorno." };
  }

  const name = recipientName ? ` ${recipientName}` : "";
  const html = baseTemplate(`
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 16px; color: ${brandColors.text};">
      Tu enlace de acceso al panel
    </h2>
    <p>Hola${name},</p>
    <p>
      Recibimos una solicitud para acceder a tu panel de administración en <strong>Bestkofi</strong>.
      Haz clic en el botón a continuación para ingresar a tu cuenta de forma segura y sin contraseña:
    </p>
    <div style="text-align: center;">
      <a href="${magicLink}" class="button">Ingresar a mi panel →</a>
    </div>
    <p style="font-size: 13px; color: ${brandColors.muted}; margin-top: 20px;">
      Este enlace es de uso único y vence en <strong>15 minutos</strong> por seguridad. Si el botón no abre, puedes copiar y pegar el siguiente enlace en tu navegador:
    </p>
    <p style="font-size: 12px; word-break: break-all; color: ${brandColors.accent}; background: #f5f2ed; padding: 12px; border-radius: 6px;">
      ${magicLink}
    </p>
    <p style="font-size: 12px; color: ${brandColors.muted}; margin-top: 24px;">
      Si no solicitaste este acceso, puedes ignorar este mensaje; nadie puede ingresar a tu cuenta sin acceso a este correo.
    </p>
  `);

  try {
    const { error } = await resend.emails.send({
      from: env.resendFromEmail,
      to,
      subject: "Tu enlace de acceso a Bestkofi",
      html,
    });

    if (error) {
      console.error("[Resend error sending magic link]:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Resend exception sending magic link]:", message);
    return { success: false, error: message };
  }
}

// ── 2. Enviar Notificación de Contacto del Storefront ──────────────────────────
/**
 * Mensaje del formulario de contacto de una tienda, enviado a ESA tienda
 * (su correo de contacto). No se manda acuse al remitente: el formulario es
 * público y eso permitiría usarlo para enviar correos a cualquier dirección.
 */
export async function sendContactNotificationEmail({
  name,
  email,
  subject,
  message,
  store,
  recipient,
}: SendContactMessageParams): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.info(`[Resend notice] RESEND_API_KEY no configurada. Mensaje de contacto de ${name} (${email}).`);
    return { success: false, error: "RESEND_API_KEY no configurada." };
  }

  const to = recipient?.trim() || env.platformOwnerEmail;
  if (!to) {
    console.error("[Contacto] La tienda no tiene correo de contacto y no hay PLATFORM_OWNER_EMAIL.");
    return { success: false, error: "La tienda no tiene un correo de contacto configurado." };
  }

  const n = escapeHtml(name);
  const e = escapeHtml(email);
  const subj = escapeHtml(subject);
  const msg = escapeHtml(message);
  const storeName = store?.name ? escapeHtml(store.name) : "la tienda";
  const replySubject = encodeURIComponent(`Re: ${subject}`);

  const notificationHtml = baseTemplate(`
    <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">
      Nuevo mensaje de contacto
    </h2>
    <p>Recibiste una consulta desde el formulario de contacto de ${storeName}:</p>
    <div style="background: #f7f5f0; border: 1px solid ${brandColors.border}; padding: 16px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px;"><strong>Nombre:</strong> ${n}</p>
      <p style="margin: 0 0 8px;"><strong>Correo:</strong> ${e}</p>
      <p style="margin: 0 0 8px;"><strong>Motivo:</strong> ${subj}</p>
      <p style="margin: 12px 0 0;"><strong>Mensaje:</strong></p>
      <p style="margin: 4px 0 0; white-space: pre-wrap; color: ${brandColors.text};">${msg}</p>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="mailto:${encodeURIComponent(email)}?subject=${replySubject}" class="button">
        Responder a ${n}
      </a>
    </div>
  `, store);

  try {
    await resend.emails.send({
      from: env.resendFromEmail,
      to,
      replyTo: email,
      subject: `[Contacto${store?.name ? ` ${store.name}` : ""}] ${subject.slice(0, 120)} - ${name.slice(0, 80)}`,
      html: notificationHtml,
    });
    return { success: true };
  } catch (err) {
    const messageErr = err instanceof Error ? err.message : String(err);
    console.error("[Resend contact notification error]:", messageErr);
    return { success: false, error: messageErr };
  }
}

// ── 3. Confirmación de Pedido ──────────────────────────────────────────────────
export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderId,
  totalFormatted,
  items,
  shippingAddress,
}: SendOrderConfirmationParams): Promise<{ success: boolean; error?: string }> {
  if (!resend) return { success: false, error: "RESEND_API_KEY no configurada." };

  const itemsHtml = items
    .map(
      (it) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #f0ece6;">
        <strong>${it.name}</strong>${it.variant ? `<br/><span style="font-size: 12px; color: ${brandColors.muted};">${it.variant}</span>` : ""}
      </td>
      <td style="padding: 10px 0; text-align: center; border-bottom: 1px solid #f0ece6; color: ${brandColors.muted};">
        x${it.qty}
      </td>
      <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #f0ece6; font-weight: 500;">
        ${it.priceFormatted}
      </td>
    </tr>
  `,
    )
    .join("");

  const html = baseTemplate(`
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 12px;">¡Gracias por tu compra, ${customerName}!</h2>
    <p>Hemos recibido tu pedido <strong>#${orderId}</strong> y nuestro equipo de tueste comenzará a prepararlo en breve.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
      <thead>
        <tr style="border-bottom: 2px solid ${brandColors.border}; text-align: left; font-size: 12px; text-transform: uppercase; color: ${brandColors.muted};">
          <th style="padding-bottom: 8px;">Producto</th>
          <th style="padding-bottom: 8px; text-align: center;">Cant.</th>
          <th style="padding-bottom: 8px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding-top: 16px; font-weight: 600; font-size: 16px;">Total pagado:</td>
          <td style="padding-top: 16px; text-align: right; font-weight: 700; font-size: 18px; color: ${brandColors.accent};">
            ${totalFormatted}
          </td>
        </tr>
      </tfoot>
    </table>

    ${
      shippingAddress
        ? `<div style="background: #faf8f5; border: 1px solid ${brandColors.border}; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; font-weight: 600; color: ${brandColors.muted};">Dirección de entrega:</p>
      <p style="margin: 4px 0 0; font-size: 14px;">${shippingAddress}</p>
    </div>`
        : ""
    }

    <p style="font-size: 14px; color: ${brandColors.muted}; margin-top: 24px;">
      Te enviaremos el número de guía de mensajería tan pronto como tu café esté empacado y en camino.
    </p>
  `);

  try {
    const { error } = await resend.emails.send({
      from: env.resendFromEmail,
      to,
      subject: `Confirmación de pedido #${orderId} - Bestkofi`,
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ── 4. Recuperación de Contraseña de Cliente ───────────────────────────────────
export async function sendPasswordResetEmail({
  to,
  resetLink,
}: {
  to: string;
  resetLink: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.info(
      `[Resend notice] RESEND_API_KEY no configurada. Enlace de recuperación para ${to}: ${resetLink}`,
    );
    return { success: false, error: "RESEND_API_KEY no configurada." };
  }

  const html = baseTemplate(`
    <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 16px; color: ${brandColors.text};">
      Restablece tu contraseña
    </h2>
    <p>Hola,</p>
    <p>
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Bestkofi</strong>.
      Haz clic en el siguiente botón para continuar:
    </p>
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Restablecer contraseña →</a>
    </div>
    <p style="font-size: 13px; color: ${brandColors.muted}; margin-top: 20px;">
      Si no solicitaste este cambio, puedes ignorar este correo de forma segura; tu contraseña actual seguirá funcionando.
    </p>
  `);

  try {
    const { error } = await resend.emails.send({
      from: env.resendFromEmail,
      to,
      subject: "Recuperación de contraseña - Bestkofi",
      html,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}


