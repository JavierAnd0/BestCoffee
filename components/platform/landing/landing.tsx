"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ALL_ON,
  DEMO_GROUPS,
  DEMO_PRESETS,
  changeNote,
  matchPreset,
  summarize,
  toggleFeature,
  type DemoKey,
  type DemoState,
} from "@/lib/demo-plan";
import { RequestDialog } from "./request-dialog";
import { SampleStore } from "./sample-store";
import styles from "./landing.module.css";

const PRESET = Object.fromEntries(DEMO_PRESETS.map((p) => [p.id, p.state])) as Record<string, DemoState>;

/** Los cuatro pasos del recorrido, cada uno con una combinación real de la demo. */
const STEPS = [
  {
    preset: "landing",
    title: "Empieza con tu marca.",
    body: "Una página con tu historia, tu logo, tu color y tu contacto. Sin catálogo ni pedidos todavía.",
    on: "Plan Landing",
  },
  {
    preset: "catalog",
    title: "Muestra tu café.",
    body: "Enciende el catálogo, los accesorios y el blog con su newsletter. Tus clientes ven tus orígenes, tus precios y tus novedades.",
    on: "Plan Presencia · Catálogo, Accesorios y Blog",
  },
  {
    preset: "orders",
    title: "Recibe pedidos.",
    body: "Aparecen el carrito y las cuentas de cliente. Cobras con Mercado Pago, ePayco o transferencia a tu cuenta bancaria.",
    on: "Plan Tienda · más Pedidos y Cuentas de cliente",
  },
  {
    preset: "full",
    title: "Que vuelvan cada mes.",
    body: "Suscripciones con entregas recurrentes, cupones y reseñas de tus clientes en cada ficha.",
    on: "Plan Tienda · todo lo de la demo",
  },
] as const;

const FEATURES = [
  {
    title: "Cobra como prefieras",
    body: "Conecta Mercado Pago o ePayco para cobrar en línea, o recibe transferencias directo a tu cuenta bancaria. Tú eliges cómo te pagan.",
    img: "/img/pago-en-cafeteria-clay-banks.webp",
    alt: "Pago con tarjeta en una cafetería, junto a una taza de café",
  },
  {
    title: "Blog y newsletter",
    body: "Publica guías, orígenes y novedades, y envíalas por correo a quienes se suscriban. Una comunidad activa que vuelve a tu tienda.",
    img: "/img/blog-preparacion-aeropress.webp",
    alt: "Agua vertiéndose desde una tetera sobre café en una AeroPress",
  },
  {
    title: "Tu panel",
    body: "Productos, colecciones, pedidos, suscripciones, clientes, contenido, cupones y reseñas, en un solo lugar.",
    img: "/img/panel-bolsas-cafe.webp",
    alt: "Bolsas de café en un exhibidor",
  },
  {
    title: "Tu marca en todo",
    body: "Logo, color, lema y contacto salen de tu configuración, también en los correos que reciben tus clientes.",
    img: "/img/tu-marca-barranquero.webp",
    alt: "Bolsa de café de papel kraft con un barranquero y el texto «Aquí va tu marca»",
  },
];

/** Textos de la landing donde dice más que la ayuda corta del panel de la demo. */
const HELP: Partial<Record<DemoKey, string>> = {
  blog: "Artículos, guías y newsletter",
  checkout: "Carrito y pago con Mercado Pago, ePayco o transferencia",
};

export function PlatformLanding({
  demoUrl,
  contactEmail,
}: {
  demoUrl: string | null;
  /** Correo ya validado en el servidor; sin él no hay botón de solicitud. */
  contactEmail: string | null;
}) {
  const demoHref = demoUrl ?? "#arma";
  const [step, setStep] = useState(0);
  const [state, setState] = useState<DemoState>(PRESET.orders);
  const [note, setNote] = useState("");
  const [nearEnd, setNearEnd] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const photoRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);
  const heroWinRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const closeRef = useRef<HTMLElement>(null);

  // Hero: al bajar, la foto se acerca, la palabra se queda atrás y la ventana
  // sube. Solo transform, en un rAF, y nada si se prefiere menos movimiento.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const h = window.innerHeight;
      if (!reduce && y < h * 1.5) {
        if (photoRef.current) photoRef.current.style.transform = `scale(${1.04 + (y / h) * 0.08}) translateY(${y * 0.18}px)`;
        if (wordRef.current) wordRef.current.style.transform = `translateY(${y * 0.35}px)`;
        if (heroWinRef.current) heroWinRef.current.style.transform = `translateY(${-y * 0.3}px)`;
      }
      const top = closeRef.current?.getBoundingClientRect().top ?? Infinity;
      setNearEnd(top < h * 0.8);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Recorrido: manda el paso que cruza la franja central de la pantalla.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const summary = summarize(state);
  const activePreset = matchPreset(state);

  function flip(key: Parameters<typeof toggleFeature>[1]) {
    const on = !state[key];
    const result = toggleFeature(state, key, on);
    setState(result.state);
    setNote(changeNote(key, on, result.also));
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav} aria-label="Principal">
        <Link href="/" className={styles.mark}>
          bestkofi
        </Link>
        <a className={styles.navLink} href="#recorrido">
          Cómo funciona
        </a>
        <a className={styles.navLink} href="#arma">
          Arma la tuya
        </a>
        <Link className={styles.navLink} href="/acceso">
          Ingresar
        </Link>
        <a className={styles.navGo} href={demoHref}>
          Demo
        </a>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroPhoto} ref={photoRef}>
          <Image src="/img/molienda-barista.jpg" alt="" fill priority sizes="100vw" />
        </div>
        <p className={styles.kick}>La tienda en línea de tu tostadora.</p>
        <h1 className={styles.word} ref={wordRef}>
          bestkofi
        </h1>
        <p className={styles.heroSub}>
          Tu marca, tu café y tus pedidos en un sitio propio. Enciende solo lo que necesitas y crece sin
          cambiar de plataforma.
        </p>
        <div className={styles.heroWin} ref={heroWinRef}>
          <SampleStore state={ALL_ON} photoSrc="/img/tostado-battlecreek.webp" />
        </div>
      </header>

      <main className={styles.sheet}>
        <div className={styles.wrap} id="recorrido">
          <div className={styles.story}>
            <h2 className={styles.h2}>Tu tienda crece contigo, función por función.</h2>
            <ol className={styles.steps}>
              {STEPS.map((s, i) => (
                <li
                  key={s.preset}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  data-index={i}
                  data-active={step === i || undefined}
                  className={styles.step}
                >
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepBody}>{s.body}</p>
                  <p className={styles.stepOn}>{s.on}</p>
                  {/* En celular cada paso trae su tienda: nada queda fijo tapando el texto. */}
                  <div className={styles.stepStore}>
                    <SampleStore state={PRESET[s.preset]} photo={false} />
                  </div>
                </li>
              ))}
            </ol>
            <div className={styles.stick}>
              <SampleStore state={PRESET[STEPS[step].preset]} />
            </div>
          </div>
        </div>

        <section className={styles.sec} id="arma" aria-labelledby="arma-title">
          <div className={styles.wrap}>
            <h2 id="arma-title" className={styles.h2}>
              Arma la tuya.
            </h2>
            <p className={styles.lead}>
              Son las mismas ocho funciones de la demo. Enciende y apaga, mira qué plan te queda y abre la
              demo para verla en una tienda completa.
            </p>
            <div className={styles.build}>
              <div>
                <div className={styles.presets} role="group" aria-label="Combinaciones listas">
                  {DEMO_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={styles.preset}
                      aria-pressed={activePreset === p.id}
                      onClick={() => {
                        setState(p.state);
                        setNote(`Combinación «${p.label}»: ${p.help.toLowerCase()}.`);
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {DEMO_GROUPS.map((g) => (
                  <div key={g.id} className={styles.group}>
                    <h3 className={styles.groupTitle}>{g.title}</h3>
                    {g.features.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        role="switch"
                        aria-checked={state[f.key]}
                        className={styles.toggle}
                        onClick={() => flip(f.key)}
                      >
                        <span className={styles.toggleText}>
                          <span className={styles.toggleLabel}>{f.label}</span>
                          <span className={styles.toggleHelp}>{HELP[f.key] ?? f.help}</span>
                        </span>
                        <span className={styles.switch} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                ))}
                {/* Solo en celular: el resultado queda debajo de los interruptores, así
                    que esta barra acompaña mientras se enciende y apaga. */}
                <div className={styles.liveBar}>
                  <span className={styles.liveText}>
                    <b>{summary.title}</b>
                    <span>
                      {summary.on} de {summary.total} encendidas
                    </span>
                  </span>
                  <a href="#arma-resultado" className={styles.liveLink}>
                    Ver cómo queda ↓
                  </a>
                </div>
              </div>
              <div className={styles.result} id="arma-resultado">
                <div aria-live="polite">
                  <p className={styles.plan}>{summary.title}</p>
                  <p className={styles.count}>
                    {summary.on} de {summary.total} funciones encendidas
                  </p>
                  <p className={styles.detail}>{summary.detail}</p>
                  <p className={styles.note}>{note}</p>
                </div>
                <div className={styles.resultActions}>
                  <a className={styles.btnDark} href={demoHref}>
                    Verla en la demo
                  </a>
                  {contactEmail && (
                    <button type="button" className={styles.btnLineDark} onClick={() => setRequesting(true)}>
                      Quiero esta tienda
                    </button>
                  )}
                </div>
                <SampleStore state={state} photo={false} />
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.dark}`} aria-labelledby="base-title">
          <div className={styles.wrap}>
            <h2 id="base-title" className={styles.h2}>
              Lo que no tienes que construir.
            </h2>
            <div className={styles.feat}>
              {FEATURES.map((f) => (
                <article key={f.title} className={styles.featItem}>
                  <div className={styles.featPhoto}>
                    <Image src={f.img} alt={f.alt} fill sizes="(min-width: 900px) 560px, 100vw" />
                  </div>
                  <h3 className={styles.featTitle}>{f.title}</h3>
                  <p className={styles.featBody}>{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.close} ref={closeRef} aria-labelledby="close-title">
          <Image src="/img/cierre-cerezas-cafe.webp" alt="" fill sizes="100vw" className={styles.closePhoto} />
          <div className={styles.closeInner}>
            <h2 id="close-title" className={styles.closeTitle}>
              Ábrela y explórala.
            </h2>
            <p className={styles.closeText}>
              La demo es una tienda completa de ejemplo. Enciende y apaga funciones y mira cómo cambia. No
              cobra nada y lo que armes solo lo ves tú.
            </p>
            <div className={styles.closeRow}>
              <a className={styles.btnLight} href={demoHref}>
                Abrir la demo
              </a>
              {contactEmail && (
                <button type="button" className={styles.btnLine} onClick={() => setRequesting(true)}>
                  Solicitar mi tienda
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footTop}>
            <div className={styles.footIntro}>
              <p className={styles.footLine}>La tienda en línea de tu tostadora.</p>
              <p className={styles.footText}>
                Catálogo, pedidos, pagos, suscripciones y newsletter con tu marca, para cafeterías y tostadoras
                de Colombia.
              </p>
            </div>
            <nav className={styles.footCols} aria-label="Pie de página">
              <div>
                <p className={styles.footHead}>Plataforma</p>
                <a href="#recorrido">Cómo funciona</a>
                <a href="#arma">Arma la tuya</a>
                <a href={demoHref}>Ver la demo</a>
              </div>
              <div>
                <p className={styles.footHead}>Tu tienda</p>
                <Link href="/acceso">Ingresar al panel</Link>
                {contactEmail && (
                  <button type="button" className={styles.footButton} onClick={() => setRequesting(true)}>
                    Solicitar mi tienda
                  </button>
                )}
              </div>
              <div>
                <p className={styles.footHead}>Contacto</p>
                {contactEmail && <a href={`mailto:${contactEmail}`}>{contactEmail}</a>}
                <span>Bogotá, Colombia</span>
              </div>
            </nav>
          </div>
          <p className={styles.footWord} aria-hidden="true">
            bestkofi
          </p>
          <div className={styles.footBottom}>
            <span>© 2026 Bestkofi</span>
            <span>Hecho en Bogotá</span>
          </div>
        </div>
      </footer>

      {requesting && <RequestDialog open onClose={() => setRequesting(false)} state={state} />}

      <div className={styles.dock} data-hidden={nearEnd || undefined}>
        <a href={demoHref}>Arma tu tienda en la demo</a>
      </div>
    </div>
  );
}
