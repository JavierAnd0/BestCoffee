import Image from "next/image";
import type { DemoKey, DemoState } from "@/lib/demo-plan";
import styles from "./landing.module.css";

/**
 * Tienda de ejemplo dentro de una ventana de navegador. No es la demo real: es
 * una maqueta que muestra u oculta cada pieza según las funciones elegidas, con
 * las mismas reglas que la demo (lib/demo-plan.ts). Datos y precios ficticios.
 *
 * Cada función tiene algo visible también en celular (menú en fila, franja de
 * cupón, botones, íconos), y lo que aparece se resalta un momento para que se
 * note qué cambió.
 */

const PRODUCTS = [
  { name: "La Esperanza", price: "$48.000", img: "/img/products/esperanza-1.jpg", coffee: true },
  { name: "Guji", price: "$52.000", img: "/img/products/guji-1.jpg", coffee: true },
  { name: "Molino manual", price: "$210.000", img: "/img/products/molino-manual-ed-vazquez.webp", coffee: false },
];

function Show({ when, children, className }: { when: boolean; children: React.ReactNode; className?: string }) {
  // Se monta al aparecer, así que la animación de entrada corre cada vez.
  return when ? <span className={`${styles.appear} ${className ?? ""}`}>{children}</span> : null;
}

export function SampleStore({
  state,
  photo = false,
  photoSrc = "/img/molienda-barista.jpg",
  priority = false,
}: {
  state: DemoState;
  /** Foto en la portada de la tienda (solo en pantallas anchas). */
  photo?: boolean;
  photoSrc?: string;
  priority?: boolean;
}) {
  const on = (k: DemoKey) => state[k];
  const products = PRODUCTS.filter((p) => p.coffee || on("accessories"));
  return (
    <div className={styles.win} aria-hidden="true">
      <div className={styles.bar}>
        <span className={styles.dots}>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.url}>tumarca.co</span>
      </div>
      <div className={styles.shop}>
        <Show when={on("discountCodes")} className={styles.shopPromo}>
          10% en tu primera compra con el código BIENVENIDA
        </Show>
        <div className={styles.shopHead}>
          <span className={styles.shopLogo}>TU MARCA</span>
          <span className={styles.shopIcons}>
            <Show when={on("customerAccounts")} className={styles.shopIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
            </Show>
            <Show when={on("checkout")} className={styles.shopIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 7h14l-1.5 13h-11z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              <b className={styles.shopBadge}>2</b>
            </Show>
          </span>
        </div>
        <div className={styles.shopMenu}>
          <span>Inicio</span>
          <Show when={on("catalog")}>Café</Show>
          <Show when={on("accessories")}>Accesorios</Show>
          <Show when={on("subscriptions")}>Suscripciones</Show>
          <Show when={on("blog")}>Aprende</Show>
          <span>Contacto</span>
        </div>

        <div className={styles.shopHero} data-photo={photo || undefined}>
          <div>
            <p className={styles.shopTitle}>Café de origen, tostado cada semana.</p>
            <p className={styles.shopSub}>Tu historia, tu contacto y tu marca, siempre.</p>
          </div>
          {photo && (
            <div className={styles.shopPhoto}>
              <Image src={photoSrc} alt="" fill sizes="(min-width: 1000px) 420px, 1px" priority={priority} />
            </div>
          )}
        </div>

        {on("catalog") ? (
          <div className={`${styles.prods} ${styles.appear}`} data-count={products.length}>
            {products.map((p) => (
              <div key={p.name} className={`${styles.prod} ${styles.appear}`}>
                <div className={styles.prodImg}>
                  <Image src={p.img} alt="" fill sizes="(min-width: 1000px) 180px, 30vw" priority={priority} />
                </div>
                <p className={styles.prodName}>{p.name}</p>
                <p className={styles.prodPrice}>{p.price}</p>
                <Show when={on("reviews")} className={styles.prodStars}>
                  ★★★★★
                </Show>
                <Show when={on("checkout")} className={styles.prodAdd}>
                  Agregar
                </Show>
                <Show when={on("subscriptions") && p.coffee} className={styles.prodSub}>
                  Suscribirme
                </Show>
              </div>
            ))}
          </div>
        ) : (
          <p className={`${styles.shopEmpty} ${styles.appear}`}>
            Tu historia, tus fotos y cómo encontrarte. Una página de marca, sin catálogo.
          </p>
        )}

        <Show when={on("blog")} className={styles.shopBlog}>
          <span className={styles.shopBlogTitle}>Cómo preparar un V60 en casa</span>
          Aprende · 4 min de lectura
        </Show>
      </div>
    </div>
  );
}
