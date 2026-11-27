import crypto from "node:crypto";
import {
  test as base,
  expect,
  request as pwRequest,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { MOCKS, NEEDS_BACKEND, REAL_API, REAL_API_MISSING } from "./env";

/**
 * Panel /admin manejado en el navegador contra la API real (sin mocks).
 * Cada caso hace clic en la interfaz y comprueba el efecto en la API y en la
 * tienda pública. Variables y forma de correrlo: ver `e2e/env.ts`.
 */

const run = Date.now().toString(36);
const OPERATOR_COOKIE = "bestcoffee-operator-session";

/** JWT de operador con la misma forma que emite `/v1/auth/verify` del backend. */
function signOperatorToken(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const header = b64({ alg: "HS256", typ: "JWT" });
  const payload = b64({
    sub: REAL_API.operatorId,
    email: REAL_API.operatorEmail,
    type: "operator",
    iat: now,
    exp: now + 60 * 60,
  });
  const sig = crypto
    .createHmac("sha256", REAL_API.jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

interface ApiVariant {
  id: string;
  sizeGrams: number;
  grind: string;
  priceOneTime: number;
  stock: number;
}
interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  status: string;
  variants: ApiVariant[];
}

const list = <T,>(d: unknown): T[] =>
  Array.isArray(d) ? (d as T[]) : (((d as { items?: T[]; data?: T[] })?.items ??
    (d as { data?: T[] })?.data ??
    []) as T[]);

/** Cliente de la API real con la tienda y el operador de la prueba. */
class Api {
  constructor(
    readonly ctx: APIRequestContext,
    readonly token: string,
  ) {}

  private headers(auth: boolean, extra: Record<string, string> = {}) {
    return {
      "X-Tenant-Slug": REAL_API.tenant,
      ...(auth ? { Authorization: `Bearer ${this.token}` } : {}),
      ...extra,
    };
  }

  /**
   * La API limita peticiones por IP (120/min) y en local la comparten el front y
   * otras pruebas: ante un 429 se espera lo que pida `Retry-After` y se reintenta.
   */
  private async send(method: string, path: string, headers: Record<string, string>, data?: unknown) {
    for (let attempt = 0; ; attempt++) {
      const res = await this.ctx.fetch(path, { method, headers, data });
      if (res.status() !== 429 || attempt >= 6) return res;
      const wait = Number(res.headers()["retry-after"]) || 10;
      await new Promise((r) => setTimeout(r, Math.min(wait, 30) * 1000));
    }
  }

  async admin<T = unknown>(method: string, path: string, data?: unknown): Promise<T> {
    const res = await this.send(method, path, this.headers(true), data);
    const body = await res.text();
    expect(res.ok(), `${method} ${path} → ${res.status()} ${body.slice(0, 300)}`).toBeTruthy();
    return (body ? JSON.parse(body) : null) as T;
  }

  async pub(method: string, path: string, data?: unknown, extra?: Record<string, string>) {
    const res = await this.send(method, path, this.headers(false, extra), data);
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* respuesta sin JSON */
    }
    return { status: res.status(), json, text };
  }

  async findAdminProductByName(name: string): Promise<ApiProduct | undefined> {
    const data = await this.admin(`GET`, `/v1/admin/products?search=${encodeURIComponent(name)}`);
    const hit = list<ApiProduct>(data).find((p) => p.name === name);
    return hit ? this.admin<ApiProduct>("GET", `/v1/admin/products/${hit.id}`) : undefined;
  }

  createProduct(name: string, priceCents: number, stock: number) {
    return this.admin<ApiProduct>("POST", "/v1/admin/products", {
      name,
      type: "SINGLE_ORIGIN",
      roastLevel: 5,
      status: "ACTIVE",
      subscriptionAvailability: "YES",
      variants: [
        { sizeGrams: 340, grind: "WHOLE_BEAN", priceOneTime: priceCents, priceSubscription: 0, stock },
      ],
    });
  }

  cartPrice(variantId: string, discountCode: string) {
    return this.pub("POST", "/v1/cart/price", {
      items: [{ variantId, quantity: 1 }],
      discountCode,
    });
  }
}

const test = base.extend<{ api: Api }, { workerApi: Api }>({
  workerApi: [
    async ({}, provide) => {
      const ctx = await pwRequest.newContext({ baseURL: REAL_API.apiUrl });
      await provide(new Api(ctx, signOperatorToken()));
      await ctx.dispose();
    },
    { scope: "worker" },
  ],
  api: async ({ workerApi }, provide) => provide(workerApi),
  // Sesión de operador en el host de la tienda (p. ej. demo.localhost).
  context: async ({ context, baseURL, workerApi }, provide) => {
    await context.addCookies([
      {
        name: OPERATOR_COOKIE,
        value: workerApi.token,
        url: baseURL!,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await provide(context);
  },
});

/** Páginas del panel visitadas; el caso 6 comprueba que ninguna muestre "ORÍGEN". */
const visited = new Set<string>();

async function gotoAdmin(page: Page, path: string) {
  const res = await page.goto(path);
  expect(res?.status(), `GET ${path}`).toBeLessThan(400);
  // Sin sesión válida el proxy manda a /acceso.
  await expect(page).not.toHaveURL(/\/acceso/);
  visited.add(path);
}

/** Avisos de error de la app (sin el anunciador de rutas de Next, que también es role=alert). */
const appAlerts = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

/** Lee un texto de la ficha pública, recargando por si la tienda sirve caché. */
async function expectPublicProduct(page: Page, slug: string, text: RegExp | string) {
  await expect(async () => {
    await page.goto(`/p/${slug}`);
    await expect(page.locator("main")).toContainText(text, { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

/** "$ 47.300" del formato es-CO, tolerante al espacio duro. */
const copRegex = (pesos: number) =>
  new RegExp(`\\$\\s?${pesos.toLocaleString("de-DE").replace(/\./g, "\\.")}(?!\\d)`);

test.describe("Panel admin contra la API real", () => {
  test.skip(MOCKS, NEEDS_BACKEND);
  test.skip(!!REAL_API_MISSING, `Faltan variables: ${REAL_API_MISSING}`);
  // Serie: comparten datos (visited) y la tienda; margen por el límite de peticiones.
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  const createdProducts: string[] = [];
  const createdCodes: string[] = [];

  // Limpieza: archivar productos y borrar cupones (los pedidos y reseñas quedan).
  test.afterAll(async ({ workerApi }) => {
    for (const id of createdProducts) {
      await workerApi.admin("POST", `/v1/admin/products/${id}/archive`).catch(() => undefined);
    }
    for (const id of createdCodes) {
      await workerApi.admin("DELETE", `/v1/admin/discount-codes/${id}`).catch(() => undefined);
    }
  });

  test("1. crear y editar un producto en pesos se refleja igual en la tienda", async ({ page, api }) => {
    const name = `E2E Café ${run}`;
    await gotoAdmin(page, "/admin/productos/nuevo");

    await page.getByRole("textbox", { name: "Nombre del producto" }).fill(name);
    await page.getByRole("textbox", { name: "Descripción" }).fill("Producto creado por la prueba e2e.");
    await page.getByRole("spinbutton", { name: /^Precio \(COP\)/ }).fill("47300");
    await page.getByRole("spinbutton", { name: /^Precio suscr\. \(COP\)/ }).fill("42000");
    await page.getByRole("spinbutton", { name: /^Stock por molienda/ }).fill("7");
    // El radio es sr-only: se hace clic en su tarjeta (el <label>), como lo haría una persona.
    const visibilidad = page.getByRole("radiogroup", { name: "Visibilidad en la tienda" });
    const publicado = page.getByRole("radio", { name: /^Publicado/ });
    await visibilidad.locator("label").filter({ has: publicado }).click();
    await expect(visibilidad.getByRole("radio", { name: /^Publicado/ })).toBeChecked();
    await page.getByRole("button", { name: "Guardar producto" }).click();
    await expect(page).toHaveURL(/\/admin\/productos$/, { timeout: 20_000 });
    visited.add("/admin/productos");

    const created = await api.findAdminProductByName(name);
    expect(created, "el producto creado existe en la API").toBeTruthy();
    createdProducts.push(created!.id);
    expect(created!.status).toBe("ACTIVE");
    expect(created!.variants).toHaveLength(1);
    expect(created!.variants[0].priceOneTime, "precio guardado en centavos").toBe(4_730_000);
    expect(created!.variants[0].stock).toBe(7);

    await expectPublicProduct(page, created!.slug, copRegex(47_300));

    // Edición: precio y stock.
    await gotoAdmin(page, `/admin/productos/${created!.id}`);
    await expect(page.getByRole("textbox", { name: "Nombre del producto" })).toHaveValue(name);
    await expect(page.getByRole("spinbutton", { name: /^Precio \(COP\)/ })).toHaveValue("47300");
    await page.getByRole("spinbutton", { name: /^Precio \(COP\)/ }).fill("51900");
    await page.getByRole("spinbutton", { name: /^Stock por molienda/ }).fill("12");
    await page.getByRole("button", { name: "Guardar producto" }).click();
    await expect(page.locator("form").getByText(/guardad|actualizad/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await expect(async () => {
      const after = await api.admin<ApiProduct>("GET", `/v1/admin/products/${created!.id}`);
      expect(after.variants).toHaveLength(1);
      expect(after.variants[0].priceOneTime).toBe(5_190_000);
      expect(after.variants[0].stock).toBe(12);
    }).toPass({ timeout: 10_000 });
    await expectPublicProduct(page, created!.slug, copRegex(51_900));
  });

  test("2. cupones porcentual y fijo: se crean, se listan y al desactivar dejan de aplicar", async ({
    page,
    api,
  }) => {
    const product = await api.createProduct(`E2E Cupones ${run}`, 6_000_000, 20);
    createdProducts.push(product.id);
    const variantId = product.variants[0].id;
    const pct = `E2EP${run}`.toUpperCase().slice(0, 15);
    const fixed = `E2EF${run}`.toUpperCase().slice(0, 15);

    await gotoAdmin(page, "/admin/promociones");
    const create = async (code: string, type: "PERCENTAGE" | "FIXED", value: string) => {
      await page.getByRole("button", { name: "Nuevo código" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("textbox", { name: "Código" }).fill(code);
      await dialog.getByRole("combobox", { name: "Tipo" }).selectOption(type);
      await dialog.getByRole("spinbutton", { name: type === "PERCENTAGE" ? "Porcentaje" : "Monto (COP)" }).fill(value);
      await dialog.getByRole("button", { name: "Crear código" }).click();
      await expect(dialog).toBeHidden({ timeout: 15_000 });
      await expect(page.getByRole("row").filter({ hasText: code })).toBeVisible();
    };
    await create(pct, "PERCENTAGE", "15");
    await create(fixed, "FIXED", "5000");

    await expect(page.getByRole("row").filter({ hasText: pct })).toContainText("15%");
    await expect(page.getByRole("row").filter({ hasText: fixed })).toContainText(copRegex(5_000));

    const codes = list<{ id: string; code: string; type: string; value: number; active: boolean }>(
      await api.admin("GET", "/v1/admin/discount-codes"),
    );
    const apiPct = codes.find((c) => c.code === pct);
    const apiFixed = codes.find((c) => c.code === fixed);
    expect(apiPct).toMatchObject({ type: "PERCENTAGE", value: 15, active: true });
    expect(apiFixed).toMatchObject({ type: "FIXED", value: 500_000, active: true });
    createdCodes.push(apiPct!.id, apiFixed!.id);

    const p1 = await api.cartPrice(variantId, pct);
    expect(p1.status, p1.text).toBeLessThan(300);
    expect((p1.json as { discountCents?: number }).discountCents).toBe(900_000);
    const f1 = await api.cartPrice(variantId, fixed);
    expect(f1.status, f1.text).toBeLessThan(300);
    expect((f1.json as { discountCents?: number }).discountCents).toBe(500_000);

    // Desactivar el porcentual desde la fila.
    const row = page.getByRole("row").filter({ hasText: pct });
    await row.getByRole("button", { name: "Desactivar" }).click();
    await expect(row).toContainText("Inactivo", { timeout: 15_000 });
    await expect(row.getByRole("button", { name: "Activar" })).toBeVisible();

    const p2 = await api.cartPrice(variantId, pct);
    const discount2 = (p2.json as { discountCents?: number } | null)?.discountCents ?? 0;
    expect(p2.status >= 400 || discount2 === 0, `cupón inactivo: ${p2.status} ${p2.text.slice(0, 200)}`).toBe(true);
    // El fijo sigue activo.
    const f2 = await api.cartPrice(variantId, fixed);
    expect((f2.json as { discountCents?: number }).discountCents).toBe(500_000);
  });

  test("3. pedido: marcar como pagado descuenta stock y se despacha con seguimiento", async ({
    page,
    api,
  }) => {
    test.skip(!REAL_API.internalSecret, "Falta E2E_INTERNAL_SECRET para crear el pedido de invitado.");
    const product = await api.createProduct(`E2E Pedido ${run}`, 3_500_000, 10);
    createdProducts.push(product.id);
    const variantId = product.variants[0].id;

    const guest = await api.pub(
      "POST",
      "/v1/orders/guest",
      {
        items: [{ variantId, quantity: 2 }],
        email: `e2e.${run}@example.com`,
        name: "Cliente E2E",
        shippingAddress: {
          recipientName: "Cliente E2E",
          line1: "Cra 12 #34-56",
          line2: "Apto 301",
          city: "Bogotá",
          state: "Bogotá D.C.",
          postalCode: "110111",
          country: "CO",
          phone: "3001234567",
        },
      },
      { "X-Internal-Secret": REAL_API.internalSecret },
    );
    expect(guest.status, guest.text).toBe(201);
    const g = guest.json as { id?: string; orderId?: string; order?: { id: string } };
    const orderId = g.id ?? g.orderId ?? g.order?.id;
    expect(orderId).toBeTruthy();

    const before = await api.admin<{ paymentStatus: string; status: string }>(
      "GET",
      `/v1/admin/orders/${orderId}`,
    );
    expect(before.paymentStatus).toBe("PENDING");
    const stockBefore = (await api.admin<ApiProduct>("GET", `/v1/admin/products/${product.id}`))
      .variants[0].stock;

    await gotoAdmin(page, `/admin/pedidos/${orderId}`);
    await expect(page.getByText("Pendiente de pago")).toBeVisible();
    await page.getByRole("button", { name: "Marcar como pagado" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("¿Confirmar el pago");
    await dialog.getByRole("button", { name: "Sí, marcar como pagado" }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText("Pagado", { exact: true })).toBeVisible();

    const paid = await api.admin<{ paymentStatus: string }>("GET", `/v1/admin/orders/${orderId}`);
    expect(paid.paymentStatus).toBe("PAID");
    const stockAfter = (await api.admin<ApiProduct>("GET", `/v1/admin/products/${product.id}`))
      .variants[0].stock;
    expect(stockAfter, "el stock baja en la cantidad pedida").toBe(stockBefore - 2);

    // Avanzar: preparación → enviado con enlace de seguimiento.
    // La pantalla cambia el paso de forma optimista: lo que vale es la API.
    const orderStatus = async () =>
      (await api.admin<{ status: string }>("GET", `/v1/admin/orders/${orderId}`)).status;
    await page.getByRole("button", { name: "Pasar a preparación" }).click();
    await expect.poll(orderStatus, { timeout: 15_000 }).toBe("PREPARING");
    const trackingUrl = `https://rastreo.example/e2e-${run}`;
    await page.getByRole("textbox", { name: "Número de guía o enlace de seguimiento" }).fill(trackingUrl);
    await page.getByRole("button", { name: "Marcar como enviado" }).click();
    await expect.poll(orderStatus, { timeout: 15_000 }).toBe("SHIPPED");
    await expect(page.getByRole("button", { name: "Marcar como entregado" })).toBeVisible();
    await expect(appAlerts(page)).toHaveCount(0);

    const shipped = await api.admin<{ status: string; trackingUrl?: string }>(
      "GET",
      `/v1/admin/orders/${orderId}`,
    );
    expect(shipped.status).toBe("SHIPPED");
    expect(shipped.trackingUrl).toBe(trackingUrl);

    // Tras recargar, el panel muestra lo que guardó la API.
    await page.reload();
    await expect(page.getByText("Pagado", { exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Número de guía o enlace de seguimiento" })).toHaveValue(
      trackingUrl,
    );
  });

  test("4. configuración: carga la tienda de la prueba y el cambio persiste", async ({ page, api }) => {
    const original = await api.admin<{ name: string; branding?: { contactPhone?: string } }>(
      "GET",
      "/v1/admin/settings",
    );
    const originalPhone = original.branding?.contactPhone ?? "";
    const newPhone = `601${run.slice(-7).replace(/\D/g, "7").padStart(7, "1")}`;

    await gotoAdmin(page, "/admin/configuracion");
    const nameField = page.getByRole("textbox", { name: "Nombre de la tienda" });
    await expect(nameField).toHaveValue(original.name);
    await expect(page.locator("main")).toContainText(`Ajustes globales de ${original.name}`);

    const phone = page.getByRole("textbox", { name: "Teléfono de contacto" });
    await expect(phone).toHaveValue(originalPhone);
    try {
      await phone.fill(newPhone);
      await page.getByRole("button", { name: "Guardar cambios" }).click();
      await expect(page.getByRole("status")).toBeVisible({ timeout: 15_000 });

      const saved = await api.admin<{ branding?: { contactPhone?: string } }>("GET", "/v1/admin/settings");
      expect(saved.branding?.contactPhone).toBe(newPhone);
      await page.reload();
      await expect(page.getByRole("textbox", { name: "Teléfono de contacto" })).toHaveValue(newPhone);

      // Restaurar desde la propia interfaz.
      await page.getByRole("textbox", { name: "Teléfono de contacto" }).fill(originalPhone);
      await page.getByRole("button", { name: "Guardar cambios" }).click();
      await expect(page.getByRole("status")).toBeVisible({ timeout: 15_000 });
    } finally {
      const now = await api.admin<{ branding?: { contactPhone?: string } }>("GET", "/v1/admin/settings");
      if ((now.branding?.contactPhone ?? "") !== originalPhone) {
        await api.admin("PATCH", "/v1/admin/settings", { branding: { contactPhone: originalPhone } });
      }
    }
    const restored = await api.admin<{ name: string; branding?: { contactPhone?: string } }>(
      "GET",
      "/v1/admin/settings",
    );
    expect(restored.branding?.contactPhone ?? "").toBe(originalPhone);
    expect(restored.name).toBe(original.name);
  });

  test("5. reseña pendiente aprobada desde el panel aparece en la ficha pública", async ({ page, api }) => {
    const product = await api.createProduct(`E2E Reseña ${run}`, 4_000_000, 5);
    createdProducts.push(product.id);
    const title = `Reseña e2e ${run}`;
    const body = `Notas a panela y cítricos (${run}).`;
    const created = await api.pub("POST", "/v1/reviews", {
      productSlug: product.slug,
      email: `review.${run}@example.com`,
      name: "Reseñador E2E",
      rating: 5,
      title,
      body,
    });
    expect(created.status, created.text).toBe(201);

    await gotoAdmin(page, "/admin/resenas");
    const card = page.locator("article").filter({ hasText: body });
    await expect(card).toBeVisible();
    await expect(card).toContainText("Pendiente");
    await card.getByRole("button", { name: "Aprobar" }).click();
    await expect(page.getByRole("status")).toBeVisible({ timeout: 15_000 });
    await expect(appAlerts(page)).toHaveCount(0);
    const reviews = list<{ id: string; body: string; status: string }>(
      await api.admin("GET", "/v1/admin/reviews?status=APPROVED"),
    );
    expect(reviews.find((r) => r.body === body)?.status).toBe("APPROVED");

    await expectPublicProduct(page, product.slug, body);
  });

  test("6. ninguna página del panel recorrida muestra ORÍGEN", async ({ page }) => {
    for (const path of [
      "/admin",
      "/admin/productos",
      "/admin/productos/nuevo",
      "/admin/promociones",
      "/admin/pedidos",
      "/admin/configuracion",
      "/admin/resenas",
      "/admin/clientes",
    ]) {
      visited.add(path);
    }
    for (const path of visited) {
      await gotoAdmin(page, path);
      await expect(page.locator("body")).not.toContainText(/ORÍGEN/i);
      expect(await page.title(), `título de ${path}`).not.toMatch(/ORÍGEN/i);
    }
  });
});
