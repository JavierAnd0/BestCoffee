import { getSiteUrl, priceRange, tenantDescription } from "@/lib/seo";
import { getTenantSlug } from "@/lib/tenant";
import { getCurrentTenant } from "@/lib/data/tenant";
import { listProducts } from "@/lib/data/products";
import { listBlogPosts } from "@/lib/data/blog";
import { listBrewGuides } from "@/lib/data/static";
import { formatCop } from "@/lib/format";

// Depende del host (tienda) de cada petición.
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  BLEND: "Mezcla",
  SINGLE_ORIGIN: "Origen único",
  DECAF: "Descafeinado",
  ACCESSORY: "Accesorio",
};

async function safe<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch {
    return [];
  }
}

function text(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

/**
 * /llms.txt — resumen del sitio en Markdown para asistentes y buscadores con IA
 * (convención llmstxt.org): qué es la tienda, qué vende, a qué precio y dónde
 * está cada cosa, sin tener que interpretar el HTML.
 */
export async function GET() {
  const siteUrl = await getSiteUrl();

  if (!(await getTenantSlug())) {
    return text(
      [
        "# BestCoffee",
        "",
        "> Plataforma para que cafeterías y tostadores de café de especialidad tengan su tienda en línea: catálogo, pedidos, suscripciones y contenido, cada una en su propio dominio.",
        "",
        `- [Inicio](${siteUrl}/)`,
        "",
      ].join("\n"),
    );
  }

  const tenant = await getCurrentTenant();
  const f = tenant.features;
  const [products, posts, guides] = await Promise.all([
    f.catalog ? safe(listProducts) : [],
    f.blog ? safe(listBlogPosts) : [],
    safe(listBrewGuides),
  ]);

  const out: string[] = [`# ${tenant.brand}`, "", `> ${tenantDescription(tenant)}`, ""];

  out.push("## Datos clave", "");
  out.push(`- País: Colombia. Idioma: español. Moneda: pesos colombianos (${tenant.currency}).`);
  if (f.checkout) {
    out.push(
      `- Compra en línea: sí. Envío gratis desde ${formatCop(tenant.freeShippingThresholdCents)}; por debajo, tarifa fija de ${formatCop(tenant.shippingFlatCents)}.`,
    );
  } else {
    out.push("- Compra en línea: no. El sitio muestra catálogo y precios; los pedidos se coordinan por contacto directo.");
  }
  if (f.subscriptions) {
    out.push(`- Suscripción de café: sí, con ${tenant.subscriptionDiscountPct}% de descuento sobre el precio normal.`);
  }
  out.push("");

  out.push("## Secciones", "");
  if (f.catalog) out.push(`- [Catálogo](${siteUrl}/catalogo): todos los cafés y accesorios con precio.`);
  if (f.subscriptions) out.push(`- [Suscripciones](${siteUrl}/suscripciones): café recurrente a domicilio.`);
  out.push(`- [Guías de preparación](${siteUrl}/guias): métodos paso a paso.`);
  out.push(`- [Quiz](${siteUrl}/quiz): recomendación de café según gustos.`);
  out.push(`- [Tiendas](${siteUrl}/tiendas): sedes físicas, direcciones y horarios.`);
  if (f.blog) out.push(`- [Blog](${siteUrl}/blog): artículos sobre origen, tueste y preparación.`);
  out.push(`- [Envíos](${siteUrl}/envios) y [Devoluciones](${siteUrl}/devoluciones): políticas.`);
  out.push(`- [Mayoristas](${siteUrl}/mayoristas) y [Contacto](${siteUrl}/contacto).`);
  out.push("");

  if (products.length) {
    out.push("## Productos", "");
    for (const p of products) {
      const range = priceRange(p);
      const bits = [
        TYPE_LABEL[p.type] ?? p.type,
        p.origin,
        p.flavorNotes.length ? `notas: ${p.flavorNotes.join(", ")}` : null,
        range ? `desde ${formatCop(range.low * 100)}` : null,
      ].filter(Boolean);
      out.push(`- [${p.name}](${siteUrl}/p/${p.slug}): ${p.shortDescription} (${bits.join(" · ")})`);
    }
    out.push("");
  }

  if (guides.length) {
    out.push("## Guías de preparación", "");
    for (const g of guides) out.push(`- [${g.method}](${siteUrl}/guias/${g.slug}): ${g.summary}`);
    out.push("");
  }

  if (posts.length) {
    out.push("## Blog", "");
    for (const post of posts) out.push(`- [${post.title}](${siteUrl}/blog/${post.slug}): ${post.excerpt}`);
    out.push("");
  }

  return text(out.join("\n"));
}
