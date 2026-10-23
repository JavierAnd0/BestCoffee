"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, Check, Copy } from "lucide-react";
import { toast } from "@/components/ui/toast";

export function NewsletterModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. Siempre escuchar eventos para abrir bajo demanda (click en footer, botón, etc.)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-newsletter-modal", handleOpen);
    return () => window.removeEventListener("open-newsletter-modal", handleOpen);
  }, []);

  // 2. Temporizador de auto-despliegue sutil en páginas de exploración
  useEffect(() => {
    // Evitar desplegar en checkout, cuenta del cliente, admin o rutas de plataforma
    if (
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/cuenta") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/platform") ||
      pathname.startsWith("/api")
    ) {
      return;
    }

    // Verificar si el usuario ya se suscribió o lo descartó en los últimos 7 días
    try {
      const status = localStorage.getItem("origen_newsletter_status");
      const dismissedAt = localStorage.getItem("origen_newsletter_dismissed_at");

      if (status === "subscribed") return;

      if (dismissedAt) {
        const elapsed = Date.now() - Number(dismissedAt);
        // 7 días de gracia para no saturar al usuario
        if (elapsed < 7 * 24 * 60 * 60 * 1000) return;
      }
    } catch {
      // Ignorar restricciones en entornos sin localStorage
    }

    // Mostrar modal con un delay natural de navegación (4.5 segundos)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 4500);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Manejar tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function handleDismiss() {
    setIsOpen(false);
    try {
      localStorage.setItem("origen_newsletter_dismissed_at", Date.now().toString());
    } catch {}
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Correo inválido",
        description: "Por favor ingresa una dirección de correo válida.",
      });
      return;
    }

    setIsSubscribed(true);
    try {
      localStorage.setItem("origen_newsletter_status", "subscribed");
    } catch {}

    toast({
      title: "¡Bienvenido a la comunidad!",
      description: "Tu cupón del 10% ha sido activado con éxito.",
    });
  }

  function handleCopyCoupon() {
    navigator.clipboard.writeText("BIENVENIDO");
    setCopied(true);
    toast({
      title: "¡Cupón copiado!",
      description: "El código 'BIENVENIDO' ya está en tu portapapeles.",
    });
    setTimeout(() => setCopied(false), 3000);
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/12 shadow-2xl bg-[#14110f] text-white animate-in zoom-in-95 duration-200">
        {/* Fondo atmosférico de café tostado */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay bg-cover bg-center"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 30%, rgba(184, 134, 11, 0.25), transparent 70%), linear-gradient(180deg, rgba(20,17,15,0.7) 0%, rgba(10,8,7,0.95) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Botón Cerrar (X) */}
        <button
          onClick={handleDismiss}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 z-20 size-8 rounded-full bg-black/40 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Contenido principal */}
        <div className="relative z-10 px-6 sm:px-9 pt-12 pb-7 text-center">
          {!isSubscribed ? (
            <>
              {/* Título en tipografía display gótica/editorial */}
              <h2
                id="newsletter-heading"
                className="font-display italic text-3xl sm:text-4xl font-bold tracking-tight text-stone-100 mb-3"
              >
                join our pilgrimage
              </h2>

              <p className="text-xs sm:text-[13px] text-stone-300/85 leading-relaxed max-w-sm mx-auto mb-7">
                Suscríbete para recibir acceso exclusivo a cosechas de edición
                limitada, guías de preparación y recetas de barismo, promociones
                especiales 👀 y un <strong>10% de descuento</strong> en tu primera orden.
              </p>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-3.5 text-left max-w-sm mx-auto">
                <div>
                  <label
                    htmlFor="newsletter-email"
                    className="block text-[11px] font-bold tracking-[0.16em] uppercase text-stone-300 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email"
                    className="w-full bg-white text-stone-900 placeholder:text-stone-400 font-medium px-4 py-3 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#8f6d45] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#8f6d45] hover:bg-[#7b5c36] active:scale-[0.99] text-white font-bold tracking-[0.2em] text-sm uppercase py-3.5 rounded-md transition-all shadow-md cursor-pointer"
                >
                  GO
                </button>
              </form>
            </>
          ) : (
            <div className="py-4 space-y-4">
              <span className="size-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 grid place-items-center mx-auto">
                <Check className="size-7" />
              </span>
              <h3 className="font-display text-2xl font-semibold text-white">
                ¡Bienvenido a la comunidad!
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed max-w-xs mx-auto">
                Usa este cupón en el checkout para disfrutar de un 10% de descuento inmediato:
              </p>
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 border border-white/15 max-w-xs mx-auto">
                <span className="font-mono font-bold text-base tracking-wider text-amber-300">
                  BIENVENIDO
                </span>
                <button
                  onClick={handleCopyCoupon}
                  className="inline-flex items-center gap-1 text-xs text-stone-300 hover:text-white transition-colors ml-2 bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-stone-400 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Explorar catálogo ahora
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Barra inferior estilo Onyx Coffee */}
        <div className="relative z-10 bg-black/60 border-t border-white/8 py-3 text-center">
          <Link
            href="/legal/privacidad"
            onClick={() => setIsOpen(false)}
            className="text-[11px] tracking-wider uppercase text-stone-400 hover:text-stone-200 transition-colors inline-flex items-center gap-1 underline-offset-2 hover:underline"
          >
            Coffee is better with cookies →
          </Link>
        </div>
      </div>
    </div>
  );
}
