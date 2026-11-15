import { test, expect } from "@playwright/test";

test.describe("Smoke Tests — Critical Routes & Health Checks", () => {
  test("1. Storefront Home carga exitosamente con HTTP 200 y elementos clave", async ({
    page,
  }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);

    // Verifica que el logo y el título principal de la tienda existan
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("link", { name: "ORÍGEN" }).first()).toBeVisible();
  });

  test("2. El Catálogo (/catalogo) carga, muestra productos y paginación", async ({
    page,
  }) => {
    const res = await page.goto("/catalogo");
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(/Catálogo|Café/i);
    await expect(page.getByRole("navigation", { name: /Paginación/i })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Página 1 de/i);

    // Navegar a la página 2
    await page.getByRole("link", { name: "Ir a la página 2" }).click();
    await expect(page).toHaveURL(/pagina=2/);
    await expect(page.locator("body")).toContainText(/Página 2 de/i);
  });

  test("3. La página de detalle de producto carga correctamente", async ({
    page,
  }) => {
    const res = await page.goto("/p/sierra-nevada");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(/Sierra Nevada|Café/i);
  });

  test("4. La pantalla de Login (/login) tiene el formulario y botón de Google activo", async ({
    page,
  }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBe(200);

    // Formulario de credenciales
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Botón de Google OAuth debe estar habilitado y sin opacidad de bloqueo
    const googleBtn = page.getByRole("button", {
      name: /Continuar con Google/i,
    });
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();
  });

  test("5. La pantalla de Registro (/registro) tiene formulario y botón de Google activo", async ({
    page,
  }) => {
    const res = await page.goto("/registro");
    expect(res?.status()).toBe(200);

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    const googleBtn = page.getByRole("button", {
      name: /Continuar con Google/i,
    });
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();
  });

  test("6. La pantalla de acceso de operadores (/acceso) carga para magic links", async ({
    page,
  }) => {
    const res = await page.goto("/acceso");
    expect(res?.status()).toBe(200);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Enviar enlace de acceso/i }),
    ).toBeVisible();
  });

  test("7. El endpoint de autenticación Neon Auth responde HTTP 200", async ({
    request,
  }) => {
    const res = await request.get("/api/auth/get-session");
    expect(res.status()).toBe(200);
  });
});

