import { test, expect } from "@playwright/test";

test.describe("E2E — Auth & Route Protection Guard", () => {
  test("Redirecciona /cuenta no autenticado hacia /login?next=/cuenta", async ({
    page,
  }) => {
    await page.goto("/cuenta");
    await expect(page).toHaveURL(/\/login\?next=%2Fcuenta/);
    await expect(page.locator("h1")).toContainText(/Bienvenido de nuevo/i);
  });

  test("Redirecciona /admin no autenticado hacia /acceso", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/acceso/);
    await expect(page.locator("h1")).toContainText(/Accede a tu panel/i);
  });

  test("Redirecciona /platform/superadmin no autenticado hacia /acceso", async ({
    page,
  }) => {
    await page.goto("/platform/superadmin");
    await expect(page).toHaveURL(/\/acceso/);
  });

  test("Botón 'Continuar con Google' dispara la solicitud de social OAuth y redirige a Neon Auth / Google", async ({
    page,
  }) => {
    await page.goto("/login");

    const googleBtn = page.getByRole("button", {
      name: /Continuar con Google/i,
    });
    await expect(googleBtn).toBeEnabled();

    // Esperar redirección al proveedor OAuth (Neon Auth / Google)
    const navPromise = page.waitForURL(
      (url) =>
        url.toString().includes("neonauth") ||
        url.toString().includes("accounts.google.com"),
      { timeout: 15_000 },
    );

    await googleBtn.click();
    await navPromise;

    expect(page.url()).toMatch(/neonauth|google/);
  });

  test("Formulario de login valida email requerido", async ({ page }) => {
    await page.goto("/login");

    // Envía formulario vacío
    const submitBtn = page.getByRole("button", { name: "Iniciar sesión" });
    await submitBtn.click();

    // Debe mostrar error de correo requerido o validación
    const errorAlert = page.locator(".bg-red-50");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/correo es requerido/i);
  });

  test("Cierre de sesión purga memoria, limpia localStorage y redirige a /login", async ({
    page,
  }) => {
    // 1. Simular sesión autenticada
    await page.context().addCookies([
      {
        name: "bestcoffee-session",
        value: "mock-session-test",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/cuenta");
    await expect(page).toHaveURL("/cuenta");

    // Guardar datos en localStorage y sessionStorage para verificar que se purgan
    await page.evaluate(() => {
      localStorage.setItem("test_key", "secret_user_data");
      sessionStorage.setItem("test_session", "secret_session_data");
    });

    // 2. Hacer clic en "Cerrar sesión"
    const logoutBtn = page.getByRole("button", { name: /Cerrar sesión/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // 3. Debe redirigir forzosamente a /login
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");

    // 4. Verificar que las claves de sesión y usuario en localStorage y sessionStorage fueron completamente eliminadas
    const testKey = await page.evaluate(() => localStorage.getItem("test_key"));
    const testSession = await page.evaluate(() => sessionStorage.getItem("test_session"));
    expect(testKey).toBeNull();
    expect(testSession).toBeNull();
  });
});
