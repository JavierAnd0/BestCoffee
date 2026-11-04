import { test, expect, type Page } from "@playwright/test";

/**
 * Avanza el reloj falso hasta que se cumpla el criterio de la invitación.
 * (Se hace en pasos porque los temporizadores del cliente solo existen tras
 * la hidratación; avanzar antes no tendría efecto.)
 */
async function waitUntilPromptShows(page: Page) {
  const card = page.getByRole("complementary", { name: /Boletín/i });
  // La invitación nunca se abre sobre el hero animado: primero se pasa de largo (el hero mide 500vh).
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 5.4));
  await expect(async () => {
    await page.clock.fastForward(15_000);
    await expect(card).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 20_000 });
  return card;
}

/**
 * Invitación al boletín: discreta, solo en español, solo para visitantes sin
 * sesión, y con la oferta real del tenant (cupón validado por el backend).
 */
test.describe("Newsletter — invitación discreta", () => {
  test.beforeEach(async ({ page }) => {
    // Reloj controlado: la invitación espera ≥8 s y 45 % de scroll (o 40 s).
    await page.clock.install();
  });

  test("no aparece al entrar y no es un modal que bloquee la página", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.clock.fastForward(5_000);
    await expect(page.getByRole("complementary", { name: /Boletín/i })).toHaveCount(0);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });

  test("no se abre mientras el hero animado está en pantalla", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2.5));
    await page.clock.fastForward(60_000);
    await expect(page.getByRole("complementary", { name: /Boletín/i })).toHaveCount(0);
  });

  test("aparece tras interés real, en español, sin bloquear la página", async ({ page }) => {
    await page.goto("/");
    const card = await waitUntilPromptShows(page);
    await expect(card).toContainText(/Únete a la comunidad/i);
    await expect(card).toContainText(/10% de descuento/i);
    // Sin textos en inglés
    await expect(card).not.toContainText(/email address|enter your email|join our|go\b/i);
    // No es modal: no hay overlay ni diálogo, y la página sigue siendo clicable
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await page.getByRole("link", { name: /Ver todo el catálogo/i }).first().scrollIntoViewIfNeeded();
  });

  test("suscribirse entrega el código real y no vuelve a aparecer", async ({ page }) => {
    await page.goto("/");
    const card = await waitUntilPromptShows(page);
    await card.getByLabel("Correo electrónico").fill(`visita.${Date.now()}@correo.test`);
    await card.getByRole("button", { name: "Suscribirme" }).click();

    await expect(card).toContainText(/Gracias por suscribirte/i);
    await expect(card).toContainText("BIENVENIDO10");

    await page.reload();
    await page.waitForLoadState("load");
    await page.clock.fastForward(60_000);
    await expect(page.getByRole("complementary", { name: /Boletín/i })).toHaveCount(0);
  });

  test("valida el correo en español", async ({ page }) => {
    await page.goto("/");
    const card = await waitUntilPromptShows(page);
    await card.getByLabel("Correo electrónico").fill("no-es-un-correo");
    await card.getByRole("button", { name: "Suscribirme" }).click();
    await expect(card.getByRole("alert")).toContainText(/correo electrónico válido/i);
  });

  test("'Ahora no' la cierra y no vuelve en esta sesión ni al recargar", async ({ page }) => {
    await page.goto("/");
    await waitUntilPromptShows(page);
    await page.getByRole("button", { name: "Ahora no" }).click();
    await expect(page.getByRole("complementary", { name: /Boletín/i })).toHaveCount(0);

    await page.reload();
    await page.waitForLoadState("load");
    await page.clock.fastForward(60_000);
    await expect(page.getByRole("complementary", { name: /Boletín/i })).toHaveCount(0);
  });

  test("no se muestra en el checkout ni en el login", async ({ page }) => {
    for (const path of ["/login", "/checkout"]) {
      await page.goto(path);
      await page.clock.fastForward(60_000);
      await expect(page.getByRole("complementary", { name: /Boletín/i })).toHaveCount(0);
    }
  });
});

test.describe("Newsletter — clientes con sesión", () => {
  const email = "nl.test@origen.test";
  const password = "Prueba#12345";

  test("no ven la invitación y gestionan su preferencia en Mis datos", async ({ page }) => {
    await page.clock.install();
    await page.goto("/login");
    await page.getByLabel(/correo/i).first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await page.waitForURL(/\/cuenta|\/$/, { timeout: 20_000 });

    // Sin invitación (ya están suscritos por defecto)
    await page.goto("/");
    await page.clock.fastForward(60_000);
    await expect(page.getByRole("complementary", { name: /Boletín/i })).toHaveCount(0);
    await expect(page.locator("footer")).toContainText(/Ya recibes nuestras novedades/i);

    // Preferencia en Mis datos
    await page.goto("/cuenta/datos");
    const optIn = page.getByRole("checkbox", { name: /Novedades, promociones y guías/i });
    await expect(optIn).toBeVisible();
    await optIn.setChecked(false);
    await page.getByRole("button", { name: /Guardar/i }).click();
    await expect(page.locator("body")).toContainText(/actualizados/i);

    await page.reload();
    await expect(optIn).not.toBeChecked();

    // Restaurar para dejar el cliente de prueba como estaba
    await optIn.setChecked(true);
    await page.getByRole("button", { name: /Guardar/i }).click();
    await expect(page.locator("body")).toContainText(/actualizados/i);
  });
});
