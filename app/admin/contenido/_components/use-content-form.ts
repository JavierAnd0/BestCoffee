"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { ContentActionResult } from "@/lib/actions/admin-content";

type Action = (prev: ContentActionResult | null, fd: FormData) => Promise<ContentActionResult>;

/**
 * Envía el formulario a la acción sin el reinicio automático de React 19:
 * si la API rechaza los datos, lo escrito sigue en pantalla para corregirlo.
 */
export function useContentForm(action: Action) {
  const [state, dispatch, pending] = useActionState<ContentActionResult | null, FormData>(action, null);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return { error: state && !state.ok ? state.error : null, onSubmit, pending };
}
