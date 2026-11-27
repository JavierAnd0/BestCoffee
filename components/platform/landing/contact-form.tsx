"use client";

import { useActionState } from "react";
import { DEMO_FEATURES, type DemoState } from "@/lib/demo-plan";
import { requestStoreAction, type StoreRequestState } from "@/lib/actions/platform-request";
import styles from "./landing.module.css";

/**
 * Formulario de contacto de la landing. Lleva lo que el visitante eligió en
 * "Arma tu sitio" y lo envía por correo a la plataforma (requestStoreAction).
 */
export function ContactForm({ state, labels }: { state: DemoState; labels: Record<string, string> }) {
  const [result, dispatch, pending] = useActionState<StoreRequestState | null, FormData>(requestStoreAction, null);
  const on = DEMO_FEATURES.filter((f) => state[f.key]);

  if (result?.success) {
    return (
      <div className={styles.formDone} role="status">
        <p className={styles.formDoneTitle}>¡Gracias! Recibimos tu mensaje.</p>
        <p>Te escribimos al correo que dejaste para hablar de tu café y de tu sitio.</p>
      </div>
    );
  }

  return (
    <form action={dispatch} className={styles.form}>
      <p className={styles.formPicked}>
        <span>Lo que elegiste</span>
        {on.length ? on.map((f) => labels[f.key] ?? f.label).join(" · ") : "Una página para tu marca"}
        <a href="#arma">Cambiar</a>
      </p>
      {on.map((f) => (
        <input key={f.key} type="hidden" name="features" value={f.key} />
      ))}
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Tu nombre</span>
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label className={styles.field}>
          <span>Correo</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" />
        </label>
        <label className={styles.field}>
          <span>Tu café o tostadora</span>
          <input name="cafe" required maxLength={120} autoComplete="organization" />
        </label>
        <label className={styles.field}>
          <span>Ciudad</span>
          <input name="city" maxLength={120} autoComplete="address-level2" />
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span>WhatsApp o teléfono (opcional)</span>
          <input name="phone" type="tel" maxLength={120} autoComplete="tel" />
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span>Cuéntanos de tu café (opcional)</span>
          <textarea name="message" rows={3} maxLength={3000} />
        </label>
        <label className={styles.trap} aria-hidden="true">
          Sitio web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {result?.error && (
        <p className={styles.formError} role="alert">
          {result.error}
        </p>
      )}
      <button type="submit" className={styles.btnDark} disabled={pending}>
        {pending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
