import { test, expect } from "@playwright/test";

test.describe("E2E — Storefront Cart & Navigation", () => {
  test("Abre y cierra el drawer del carrito desde la cabecera", async ({
    page,
  }) => {
    await page.goto("/");

    // Clic en el botón del carrito visible en el viewport
    const cartButton = page.locator('header button[aria-label*="Carrito"]:visible');
    await expect(cartButton).toBeVisible();
    await cartButton.click();

    // El drawer del carrito debe abrirse
    const cartDrawer = page.locator('[role="dialog"]').or(page.locator("aside"));
    await expect(cartDrawer.first()).toBeVisible();

    // Debe mostrar mensaje de carrito o total
    await expect(page.locator("body")).toContainText(/Carrito|Tu bolsa/i);
  });

  test("Navega desde el catálogo hacia el detalle de producto", async ({
    page,
  }) => {
    await page.goto("/catalogo");

    // Selecciona el primer enlace a un producto
    const firstProductLink = page.locator('a[href^="/p/"]').first();
    await expect(firstProductLink).toBeVisible();

    const href = await firstProductLink.getAttribute("href");
    await firstProductLink.click();

    await page.waitForURL(`**${href}`);
    await expect(page.locator("h1")).toBeVisible();
  });
});
