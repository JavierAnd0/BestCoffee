"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Coffee,
  MessageCircle,
  Package,
  Repeat,
  ShoppingBag,
  Star,
  TicketPercent,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  ALL_OFF,
  ALL_ON,
  DEMO_FEATURES,
  DEMO_PRESETS,
  matchPreset,
  toggleFeature,
  type DemoKey,
  type DemoState,
} from "@/lib/demo-plan";
import { ContactForm } from "./contact-form";
import { SampleStore } from "./sample-store";
import styles from "./landing.module.css";

/**
 * Landing de Bestkofi (bestkofi.com). El mensaje: hacemos sitios a la medida
 * para marcas de café y nos encargamos de todo lo técnico; el cliente elige lo
 * que quiere en su sitio. La plataforma que hay detrás y los planes no se
 * nombran aquí: el nivel solo viaja, como dato interno, en el correo de
 * contacto.
 *
 * Rendimiento en celular: el parallax del hero es una animación de CSS ligada
 * al scroll (animation-timeline), que corre en el compositor y no se atrasa
 * frente al scroll nativo. Sin filtros sobre fotos grandes y solo dos maquetas
 * de tienda en toda la página.
 */

/** Las funciones dichas como beneficio para quien tiene la cafetería. */
const FEATURE_COPY: Record<DemoKey, { label: string; help: string; icon: LucideIcon }> = {
  catalog: { label: "Catálogo", help: "Tus cafés con origen, notas y precio", icon: Coffee },
  accessories: { label: "Accesorios", help: "Molinos, métodos y más", icon: Package },
  blog: { label: "Blog y newsletter", help: "Guías y novedades para tu comunidad", icon: BookOpen },
  checkout: { label: "Ventas en línea", help: "Carrito y pago con Mercado Pago, ePayco o transferencia", icon: ShoppingBag },
  customerAccounts: { label: "Cuentas de cliente", help: "Historial y compras más rápidas", icon: UserRound },
  subscriptions: { label: "Suscripciones", help: "Su café cada mes, sin tener que pedirlo", icon: Repeat },
  discountCodes: { label: "Cupones", help: "Promociones y descuentos", icon: TicketPercent },
  reviews: { label: "Reseñas", help: "Opiniones en cada producto", icon: Star },
};

const LABELS = Object.fromEntries(DEMO_FEATURES.map((f) => [f.key, FEATURE_COPY[f.key].label])) as Record<
  DemoKey,
  string
>;

/** Puntos de partida, con nombres de lo que hace el negocio (no de planes). */
const STARTS: { id: string; label: string }[] = [
  { id: "landing", label: "Solo mi marca" },
  { id: "catalog", label: "Vitrina de cafés" },
  { id: "orders", label: "Tienda en línea" },
  { id: "full", label: "Todo" },
];
const PRESET = Object.fromEntries(DEMO_PRESETS.map((p) => [p.id, p.state])) as Record<string, DemoState>;

/** Quién pone qué: el reparto es el mensaje de la sección. */
const YOURS = ["Tu café y la historia detrás de cada origen.", "Tus fotos, tu logo y tus colores.", "Lo que quieres ofrecer y a quién."];
const OURS = [
  "El diseño, a la medida de tu marca.",
  "La publicación, con tu dominio.",
  "Los cobros, los correos y la seguridad.",
  "Los cambios: nos escribes y quedan hechos.",
];

const PROCESS = [
  { title: "Hablamos", body: "Nos cuentas de tu café, de tus clientes y de cómo vendes hoy." },
  { title: "Lo armamos contigo", body: "Elegimos juntos lo que necesita tu sitio y lo diseñamos con tu marca." },
  { title: "Lo publicamos", body: "Con tu dominio y tus productos cargados, listo para recibir clientes." },
  {
    title: "Crecemos contigo",
    body: "¿Quieres vender en línea, sumar suscripciones o un blog? Lo agregamos sin empezar de cero.",
  },
];

const EXTRAS = [
  {
    title: "Cobros sin enredos",
    body: "Mercado Pago, ePayco o transferencia directo a tu cuenta. Tú eliges cómo te pagan.",
    img: "/img/pago-en-cafeteria-clay-banks.webp",
    alt: "Pago con tarjeta en una cafetería, junto a una taza de café",
  },
  {
    title: "Un panel sencillo",
    body: "Cambia un precio, publica un café nuevo o revisa tus pedidos, también desde el celular.",
    img: "/img/panel-bolsas-cafe.webp",
    alt: "Bolsas de café en un exhibidor",
  },
  {
    title: "Tu comunidad cerca",
    body: "Cuenta tus orígenes y avisa por correo cuando llega un lote nuevo.",
    img: "/img/blog-preparacion-aeropress.webp",
    alt: "Agua vertiéndose desde una tetera sobre café en una AeroPress",
  },
  {
    title: "Tu marca al frente",
    body: "Tus clientes ven tu nombre, tu logo y tu color en todo el sitio.",
    img: "/img/tu-marca-barranquero.webp",
    alt: "Bolsa de café de papel kraft con un barranquero y el texto «Aquí va tu marca»",
  },
];

const list = new Intl.ListFormat("es-CO", { style: "long", type: "conjunction" });

function whatsappHref(number: string, state: DemoState): string {
  const on = DEMO_FEATURES.filter((f) => state[f.key]).map((f) => LABELS[f.key]);
  const text = on.length
    ? `Hola, quiero un sitio para mi café con ${list.format(on).toLowerCase()}.`
    : "Hola, quiero un sitio para mi café.";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function PlatformLanding({
  demoUrl,
  contactEmail,
  whatsapp,
}: {
  demoUrl: string | null;
  /** Correo ya validado en el servidor; sin él no hay formulario. */
  contactEmail: string | null;
  /** WhatsApp en dígitos, ya validado; sin él no hay botón de chat. */
  whatsapp: string | null;
}) {
  const [state, setState] = useState<DemoState>(PRESET.catalog ?? ALL_OFF);
  const [note, setNote] = useState("");
  const photoRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);

  // Hero: al bajar, la foto se acerca, el texto se queda atrás y la ventana
  // sube. Lo hace el CSS con animation-timeline (ver landing.module.css). Esto
  // es solo el respaldo para navegadores de escritorio que no lo soportan: en
  // celular sin soporte el hero queda quieto, nunca con JS en cada scroll.
  useEffect(() => {
    if (CSS.supports("animation-timeline: scroll()")) return;
    if (!window.matchMedia("(pointer: fine) and (min-width: 1000px) and (prefers-reduced-motion: no-preference)").matches)
      return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.min(window.scrollY, window.innerHeight * 1.2);
      const t = y / 900;
      if (photoRef.current) photoRef.current.style.transform = `translateY(${t * 140}px) scale(${1 + t * 0.08})`;
      if (innerRef.current) {
        innerRef.current.style.transform = `translateY(${t * 260}px)`;
        innerRef.current.style.opacity = String(1 - Math.min(t, 1) * 0.6);
      }
      if (winRef.current) winRef.current.style.transform = `translateY(${-t * 220}px)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  const hasContact = Boolean(contactEmail || whatsapp);
  const contactHref = hasContact ? "#contacto" : (demoUrl ?? "#arma");
  const activeStart = matchPreset(state);
  const picked = DEMO_FEATURES.filter((f) => state[f.key]);

  function flip(key: DemoKey) {
    const on = !state[key];
    const { state: next, also } = toggleFeature(state, key, on);
    setState(next);
    // Solo se avisa cuando una función arrastró otras: el resto se ve en la maqueta.
    setNote(
      also.length === 0
        ? ""
        : on
          ? `Para ${LABELS[key].toLowerCase()} también sumamos ${list.format(also.map((k) => LABELS[k].toLowerCase()))}.`
          : `Sin ${LABELS[key].toLowerCase()} también quitamos ${list.format(also.map((k) => LABELS[k].toLowerCase()))}.`,
    );
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav} aria-label="Principal">
        <Link href="/" className={styles.mark}>
          bestkofi
        </Link>
        <a className={styles.navLink} href="#que-hacemos">
          Qué hacemos
        </a>
        <a className={styles.navLink} href="#arma">
          Arma tu sitio
        </a>
        {demoUrl && (
          <a className={styles.navLink} href={demoUrl}>
            Ejemplo
          </a>
        )}
        <a className={styles.navGo} href={contactHref}>
          {hasContact ? "Hablemos" : "Ver ejemplo"}
        </a>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroPhoto}>
          <div className={styles.heroPhotoMove} ref={photoRef}>
            <Image src="/img/molienda-barista.jpg" alt="" fill priority sizes="100vw" />
          </div>
        </div>
        <div className={styles.heroInner} ref={innerRef}>
          <h1 className={styles.heroTitle}>Un sitio a la medida de tu café.</h1>
          <p className={styles.heroSub}>
            Diseñamos sitios web para tostadoras y cafeterías: con tu marca, con lo que tu negocio necesita y sin
            que tengas que tocar nada técnico.
          </p>
          <div className={styles.heroCtas}>
            <a className={styles.btnLight} href="#arma">
              Arma tu sitio
            </a>
            <a className={styles.btnLine} href={contactHref}>
              {hasContact ? "Hablemos" : "Ver un ejemplo"}
            </a>
          </div>
        </div>
        <div className={styles.heroWin} ref={winRef}>
          <SampleStore state={ALL_ON} photo photoSrc="/img/tostado-battlecreek.webp" priority />
        </div>
      </header>

      <main className={styles.sheet}>
        <section className={styles.sec} id="que-hacemos" aria-labelledby="que-title">
          <div className={styles.wrap}>
            <div className={styles.split}>
              <div className={styles.splitPhoto}>
                <Image
                  src="/img/cierre-cerezas-cafe.webp"
                  alt="Cerezas de café maduras en la rama"
                  fill
                  sizes="(min-width: 1000px) 520px, 100vw"
                />
              </div>
              <div className={styles.splitText}>
                <h2 id="que-title" className={styles.h2}>
                  Tú pones el café. Nosotros, todo lo demás.
                </h2>
                <p className={styles.lead}>
                  Solo hacemos sitios de café, así que conocemos lo que buscan tus clientes: origen, notas de cata,
                  tueste y molienda.
                </p>
                <div className={styles.share}>
                  <div>
                    <h3 className={styles.shareTitle}>Tú</h3>
                    <ul className={styles.shareList}>
                      {YOURS.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className={styles.shareTitle}>Nosotros</h3>
                    <ul className={styles.shareList}>
                      {OURS.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.process}>
              <h3 className={styles.processTitle}>Así trabajamos</h3>
              <ol className={styles.timeline}>
                {PROCESS.map((p) => (
                  <li key={p.title} className={styles.timelineStep}>
                    <p className={styles.timelineTitle}>{p.title}</p>
                    <p className={styles.timelineBody}>{p.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.build}`} id="arma" aria-labelledby="arma-title">
          <div className={styles.wrap}>
            <h2 id="arma-title" className={styles.h2}>
              Arma tu sitio.
            </h2>
            <p className={styles.lead}>
              Toca lo que te gustaría tener y mira cómo cambia. Puedes empezar sencillo y sumar más cuando tu negocio
              crezca.
            </p>

            <div className={styles.buildGrid}>
              {/* En celular la maqueta queda fija arriba mientras se tocan las tarjetas. */}
              <div className={styles.preview}>
                <SampleStore state={state} />
              </div>

              <div className={styles.picker}>
                <div className={styles.starts} role="group" aria-label="Puntos de partida">
                  {STARTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={styles.start}
                      aria-pressed={activeStart === s.id}
                      onClick={() => {
                        setState(PRESET[s.id]);
                        setNote("");
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className={styles.tiles}>
                  {DEMO_FEATURES.map((f) => {
                    const c = FEATURE_COPY[f.key];
                    const Icon = c.icon;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        role="switch"
                        aria-checked={state[f.key]}
                        className={styles.tile}
                        onClick={() => flip(f.key)}
                      >
                        <span className={styles.tileTop}>
                          <Icon className={styles.tileIcon} aria-hidden="true" strokeWidth={1.5} />
                          <span className={styles.tileCheck} aria-hidden="true" />
                        </span>
                        <span className={styles.tileLabel}>{c.label}</span>
                        <span className={styles.tileHelp}>{c.help}</span>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.summary}>
                  <p className={styles.summaryText} aria-live="polite">
                    {picked.length === 0
                      ? "Una página con tu historia, tus fotos y tu contacto."
                      : `Tu sitio con ${list.format(picked.map((f) => LABELS[f.key].toLowerCase()))}.`}
                    {note && <span className={styles.summaryNote}> {note}</span>}
                  </p>
                  <div className={styles.summaryActions}>
                    {hasContact && (
                      <a className={styles.btnDark} href="#contacto">
                        Quiero un sitio así
                      </a>
                    )}
                    {demoUrl && (
                      <a className={hasContact ? styles.btnLineDark : styles.btnDark} href={demoUrl}>
                        Ver un ejemplo completo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.dark}`} aria-labelledby="extras-title">
          <div className={styles.wrap}>
            <h2 id="extras-title" className={styles.h2}>
              Lo demás corre por nuestra cuenta.
            </h2>
          </div>
          {/* En celular es un carrusel horizontal: cuatro fotos sin alargar la página. */}
          <div className={styles.extras}>
            {EXTRAS.map((f) => (
              <article key={f.title} className={styles.extra}>
                <div className={styles.extraPhoto}>
                  <Image src={f.img} alt={f.alt} fill sizes="(min-width: 900px) 300px, 78vw" />
                </div>
                <h3 className={styles.extraTitle}>{f.title}</h3>
                <p className={styles.extraBody}>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {hasContact && (
          <section className={`${styles.sec} ${styles.contact}`} id="contacto" aria-labelledby="contacto-title">
            <div className={`${styles.wrap} ${styles.contactGrid}`}>
              <div>
                <h2 id="contacto-title" className={styles.h2}>
                  Hablemos de tu café.
                </h2>
                <p className={styles.lead}>
                  Cuéntanos de tu marca y te escribimos para armar tu sitio contigo.
                </p>
                <div className={styles.direct}>
                  {whatsapp && (
                    <a className={styles.btnDark} href={whatsappHref(whatsapp, state)} target="_blank" rel="noopener">
                      <MessageCircle className={styles.btnIcon} aria-hidden="true" strokeWidth={1.75} />
                      Escríbenos por WhatsApp
                    </a>
                  )}
                  {contactEmail && (
                    <p className={styles.directLine}>
                      O al correo <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                    </p>
                  )}
                  <p className={styles.directPlace}>Desde Bogotá, para cafés de todo el país.</p>
                </div>
              </div>
              {contactEmail && <ContactForm state={state} labels={LABELS} />}
            </div>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footTop}>
            <div>
              <p className={styles.footMark}>bestkofi</p>
              <p className={styles.footText}>Sitios web a la medida para marcas de café de Colombia.</p>
            </div>
            <nav className={styles.footCols} aria-label="Pie de página">
              <div>
                <p className={styles.footHead}>Bestkofi</p>
                <a href="#que-hacemos">Qué hacemos</a>
                <a href="#arma">Arma tu sitio</a>
                {demoUrl && <a href={demoUrl}>Ver un ejemplo</a>}
              </div>
              <div>
                <p className={styles.footHead}>Contacto</p>
                {whatsapp && (
                  <a href={whatsappHref(whatsapp, state)} target="_blank" rel="noopener">
                    WhatsApp
                  </a>
                )}
                {contactEmail && <a href={`mailto:${contactEmail}`}>{contactEmail}</a>}
                <span>Bogotá, Colombia</span>
              </div>
              <div>
                <p className={styles.footHead}>Clientes</p>
                <Link href="/acceso">Ingresar al panel</Link>
              </div>
            </nav>
          </div>
          <div className={styles.footBottom}>
            <span>© 2026 Bestkofi</span>
            <span>Hecho en Bogotá</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
