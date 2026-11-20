import Image from "next/image";
import { summarize, type DemoKey, type DemoState } from "@/lib/demo-plan";
import styles from "./landing.module.css";

/**
 * Tienda de ejemplo dentro de una ventana de navegador. No es la demo real: es
 * una maqueta que muestra u oculta cada pieza según las funciones encendidas,
 * con las mismas reglas que la demo (lib/demo-plan.ts). Datos y precios
 * ficticios.
 */

const PRODUCTS = [
  { name: "La Esperanza", price: "$48.000 · 340 g", img: "/img/products/esperanza-1.jpg", coffee: true },
  { name: "Guji", price: "$52.000 · 340 g", img: "/img/products/guji-1.jpg", coffee: true },
  { name: "Molino manual", price: "$210.000", img: "/img/products/molino-1.jpg", coffee: false },
];

function Show({ when, children }: { when: boolean; children: React.ReactNode }) {
  // Se monta al encenderse, así que la animación de entrada corre cada vez.
  return when ? <span className={styles.appear}>{children}</span> : null;
}

export function SampleStore({
  state,
  label = "Tienda de ejemplo",
  photo = true,
}: {
  state: DemoState;
  label?: string;
  /** Foto en la portada de la tienda (se oculta en ventanas estrechas). */
  photo?: boolean;
}) {
  const on = (k: DemoKey) => state[k];
  const plan = summarize(state).title;
  return (
    <div className={styles.win} role="img" aria-label={`${label}: ${plan}`}>
      <div className={styles.bar} aria-hidden="true">
        <span className={styles.dots}>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.url}>tumarca.bestkofi.co</span>
        <span className={styles.planchip}>{plan}</span>
      </div>
      <div className={styles.shop} aria-hidden="true">
        <div className={styles.shopHead}>
          <span className={styles.shopLogo}>TU MARCA</span>
          <span className={styles.shopMenu}>
            <span>Inicio</span>
            <Show when={on("catalog")}>Catálogo</Show>
            <Show when={on("accessories")}>Accesorios</Show>
            <Show when={on("subscriptions")}>Suscripciones</Show>
            <Show when={on("blog")}>Aprende</Show>
            <span>Contacto</span>
          </span>
          <span className={styles.shopIcons}>
            <Show when={on("customerAccounts")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
            </Show>
            <Show when={on("checkout")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 7h14l-1.5 13h-11z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
            </Show>
          </span>
        </div>

        <div className={styles.shopHero} data-photo={photo || undefined}>
          <div>
            <p className={styles.shopTitle}>Café de origen, tostado cada semana.</p>
            <p className={styles.shopSub}>Tu historia, tu contacto y tu marca, siempre.</p>
          </div>
          {photo && (
            <div className={styles.shopPhoto}>
              <Image src="/img/molienda-barista.jpg" alt="" fill sizes="(min-width: 1000px) 420px, 0px" />
            </div>
          )}
        </div>

        {on("catalog") ? (
          <div className={`${styles.prods} ${styles.appear}`}>
            {PRODUCTS.filter((p) => p.coffee || on("accessories")).map((p) => (
              <div key={p.name} className={`${styles.prod} ${styles.appear}`}>
                <div className={styles.prodImg}>
                  <Image src={p.img} alt="" fill sizes="(min-width: 1000px) 200px, 40vw" />
                </div>
                <p className={styles.prodName}>{p.name}</p>
                <p className={styles.prodPrice}>{p.price}</p>
                <Show when={on("reviews")}>
                  <span className={styles.prodStars}>★★★★★ reseñas de clientes</span>
                </Show>
                <Show when={on("checkout")}>
                  <span className={styles.prodAdd}>Agregar</span>
                </Show>
                <Show when={on("subscriptions") && p.coffee}>
                  <span className={styles.prodSub}>Suscribirme</span>
                </Show>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.shopEmpty}>
            Sin catálogo, tu sitio es una página de marca con tu historia y tu contacto.
          </p>
        )}

        {on("blog") && (
          <div className={`${styles.shopBlog} ${styles.appear}`}>
            <span className={styles.shopBlogTitle}>Cómo preparar un V60 en casa</span>
            Aprende · 4 min de lectura
          </div>
        )}
      </div>
    </div>
  );
}
