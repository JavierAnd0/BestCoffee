"use client";

import { useActionState, useEffect, useRef } from "react";
import { DEMO_FEATURES, summarize, type DemoState } from "@/lib/demo-plan";
import { requestStoreAction, type StoreRequestState } from "@/lib/actions/platform-request";
import styles from "./landing.module.css";

/**
 * Formulario de "Solicitar mi tienda". Lleva lo que el visitante armó en la
 * landing y lo envía por correo a la plataforma (requestStoreAction).
 */
export function RequestDialog({
  open,
  onClose,
  state,
}: {
  open: boolean;
  onClose: () => void;
  state: DemoState;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [result, dispatch, pending] = useActionState<StoreRequestState | null, FormData>(requestStoreAction, null);
  const summary = summarize(state);
  const on = DEMO_FEATURES.filter((f) => state[f.key]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="request-title"
      onClose={onClose}
      onClick={(e) => {
        // Clic en el fondo (fuera de la tarjeta) cierra.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialogCard}>
        <button type="button" className={styles.dialogClose} onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        {result?.success ? (
          <div className={styles.dialogDone} role="status">
            <p id="request-title" className={styles.dialogTitle}>
              Recibimos tu solicitud.
            </p>
            <p className={styles.dialogText}>
              Te escribimos al correo que dejaste para hablar de tu tienda y de cómo arrancar.
            </p>
            <button type="button" className={styles.btnDark} onClick={onClose}>
              Listo
            </button>
          </div>
        ) : (
          <form action={dispatch} className={styles.form}>
            <p id="request-title" className={styles.dialogTitle}>
              Solicita tu tienda.
            </p>
            <p className={styles.dialogText}>
              Cuéntanos de tu café y te escribimos para armarla contigo.
            </p>
            <p className={styles.dialogPlan}>
              <strong>{summary.title}</strong>
              {on.length ? ` · ${on.map((f) => f.label).join(", ")}` : " · sin funciones extra"}
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
                <span>¿Algo más que debamos saber? (opcional)</span>
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
              {pending ? "Enviando…" : "Enviar solicitud"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
