import { test, expect } from "@playwright/test";

test.describe("Módulo de Accesorios y Barismo — Vista dedicada y Filtro en Catálogo", () => {
  test("1. La vista dedicada /accesorios carga con elementos de barismo y categorías", async ({
    page,
  }) => {
    const res = await page.goto("/accesorios");
    expect(res?.status()).toBe(200);

    // Título y contenido principal
    await expect(page.locator("h1")).toContainText(/Accesorios & Métodos/i);
    await expect(page.locator("body")).toContainText("Herramientas de Barismo");

    // Botones de filtro de categorías específicas
    await expect(page.getByRole("button", { name: /Molinos/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Teteras/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tazas/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Métodos/i })).toBeVisible();

    // Productos de barismo visibles
    await expect(page.locator("body")).toContainText("Molino Manual Conical Burr");
    await expect(page.locator("body")).toContainText("Tetera Cuello de Cisne");
    await expect(page.locator("body")).toContainText("Taza Cerámica Artesanal");
  });

  test("2. El filtro interactivo por categoría en /accesorios muestra solo los ítems seleccionados", async ({
    page,
  }) => {
    await page.goto("/accesorios");

    // Clic en la categoría "Molinos"
    await page.getByRole("button", { name: /Molinos/i }).click();

    // Solo debe verse el molino y no la taza
    await expect(page.locator("body")).toContainText("Molino Manual Conical Burr");
    await expect(page.locator("body")).not.toContainText("Taza Cerámica Artesanal");

    // Clic en la categoría "Tazas"
    await page.getByRole("button", { name: /Tazas/i }).click();
    await expect(page.locator("body")).toContainText("Taza Cerámica Artesanal");
    await expect(page.locator("body")).not.toContainText("Molino Manual Conical Burr");
  });

  test("3. Ficha de detalle de un accesorio (/p/molino-manual-precision) adaptada para equipo", async ({
    page,
  }) => {
    await page.goto("/p/molino-manual-precision");
    await expect(page.locator("h1")).toContainText("Molino Manual Conical Burr");

    // La ficha de accesorio NO debe mostrar nivel de tueste de café
    await expect(page.locator("body")).not.toContainText(/Tueste \d\/9/i);

    // Debe mostrar la etiqueta de Accesorio y garantía oficial
    await expect(page.locator("body")).toContainText(/Accesorio de Barismo|Accesorio/i);
    await expect(page.locator("body")).toContainText(/Garantía oficial de 1 año/i);

    // Permite agregar al carrito directamente
    const addBtn = page.getByRole("button", { name: /Agregar al carrito/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Abre el drawer con el accesorio agregado
    const drawerTitle = page.getByRole("heading", { name: /Tu carrito/i });
    await expect(drawerTitle).toBeVisible();
    await expect(page.locator("body")).toContainText("Molino Manual Conical Burr");
  });

  test("4. El Catálogo general (/catalogo) separa accesorios y permite filtrarlos", async ({
    page,
  }) => {
    await page.goto("/catalogo");

    // Pestañas de categoría
    const accTab = page.getByRole("link", { name: /Accesorios y Equipos/i });
    await expect(accTab).toBeVisible();

    // Filtrar por accesorios
    await accTab.click();
    await expect(page).toHaveURL(/categoria=accesorios/);

    // Debe mostrar accesorios y título temático
    await expect(page.locator("h1")).toContainText("Accesorios y Métodos");
    await expect(page.locator("body")).toContainText("Molino Manual Conical Burr");
  });

  test("5. El footer y cabecera enlazan a la nueva vista de /accesorios", async ({
    page,
  }) => {
    await page.goto("/");

    // Enlace en el footer
    const footerLink = page.locator('footer a[href="/accesorios"]');
    await expect(footerLink).toBeVisible();

    // Enlace en la cabecera
    const headerLink = page.locator('header a[href="/accesorios"]').first();
    await expect(headerLink).toBeVisible();
  });
});

