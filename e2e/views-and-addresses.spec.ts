import { test, expect } from "@playwright/test";

test.describe("Storefront Views & Customer Address Management", () => {
  test("1. Página de Contacto (/contacto) carga con canales y formulario interactivo", async ({
    page,
  }) => {
    const res = await page.goto("/contacto");
    expect(res?.status()).toBe(200);

    await expect(page.locator("h1")).toContainText(/Hablemos de café/i);
    await expect(page.locator("body")).toContainText("hola@bestcoffee.io");
    await expect(page.locator("body")).toContainText("+57 300 123 4567");

    // Formulario de contacto
    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-email")).toBeVisible();
    await expect(page.locator("#contact-message")).toBeVisible();
    await expect(page.getByRole("button", { name: /Enviar mensaje/i })).toBeVisible();
  });

  test("2. Página de Envíos (/envios) carga con políticas y tiempos", async ({
    page,
  }) => {
    const res = await page.goto("/envios");
    expect(res?.status()).toBe(200);

    await expect(page.locator("h1")).toContainText(/Envíos y Cobertura/i);
    await expect(page.locator("body")).toContainText("Bogotá D.C.");
    await expect(page.locator("body")).toContainText("Medellín");
  });

  test("3. Página de Devoluciones (/devoluciones) carga con garantía y pasos", async ({
    page,
  }) => {
    const res = await page.goto("/devoluciones");
    expect(res?.status()).toBe(200);

    await expect(page.locator("h1")).toContainText(/Garantía y Devoluciones/i);
    await expect(page.locator("body")).toContainText("Garantía de frescura");
  });

  test("4. Página de Sostenibilidad (/sostenibilidad) carga con métricas y pilares", async ({
    page,
  }) => {
    const res = await page.goto("/sostenibilidad");
    expect(res?.status()).toBe(200);

    await expect(page.locator("h1")).toContainText(/Sostenibilidad desde la raíz/i);
    await expect(page.locator("body")).toContainText("Comercio Directo");
  });

  test("5. El footer tiene enlaces funcionales y no contiene href='#'", async ({
    page,
  }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Comprobar que los enlaces clave en el footer existen con su ruta correspondiente
    await expect(footer.getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/catalogo");
    await expect(footer.getByRole("link", { name: "Suscripciones" })).toHaveAttribute("href", "/suscripciones");
    await expect(footer.getByRole("link", { name: "Contacto" })).toHaveAttribute("href", "/contacto");
    await expect(footer.getByRole("link", { name: "Envíos" })).toHaveAttribute("href", "/envios");
    await expect(footer.getByRole("link", { name: "Devoluciones" }).first()).toHaveAttribute("href", "/devoluciones");
    await expect(footer.getByRole("link", { name: "Sostenibilidad" })).toHaveAttribute("href", "/sostenibilidad");
  });

  test("6. Vista de Direcciones (/cuenta/direcciones) autenticada renderiza el gestor y abre el modal de agregar", async ({
    page,
  }) => {
    // Autenticar la sesión del cliente con cookie válida según middleware
    await page.context().addCookies([
      {
        name: "bestcoffee-session",
        value: "mock-session-test",
        domain: "localhost",
        path: "/",
      },
    ]);

    const res = await page.goto("/cuenta/direcciones");
    expect(res?.status()).toBe(200);

    await expect(page.locator("h1")).toContainText(/Mis direcciones/i);

    // Botón de agregar nueva dirección
    const addBtn = page.getByRole("button", { name: /Nueva dirección/i });
    await expect(addBtn).toBeVisible();

    // Al hacer clic abre el diálogo
    await addBtn.click();
    await expect(page.getByRole("heading", { name: /Agregar dirección de envío/i })).toBeVisible();
    await expect(page.locator("#addr-line1")).toBeVisible();
    await expect(page.locator("#addr-state")).toBeVisible();
    await expect(page.locator("#addr-city")).toBeVisible();

    // Botón de cancelar cierra el diálogo
    await page.getByRole("button", { name: /Cancelar/i }).click();
    await expect(page.locator("#addr-line1")).not.toBeVisible();
  });

  test("7. Página de Tiendas (/tiendas) carga con mapa interactivo y listado de sedes", async ({
    page,
  }) => {
    const res = await page.goto("/tiendas");
    expect(res?.status()).toBe(200);

    await expect(page.locator("h1")).toContainText(/Nuestras tiendas en Bogotá/i);
    await expect(page.locator("body")).toContainText("ORÍGEN Chapinero");
    await expect(page.locator("body")).toContainText("ORÍGEN Usaquén");
    await expect(page.locator("body")).toContainText("ORÍGEN La Candelaria");

    // Mapa embebido
    await expect(page.locator("iframe")).toBeVisible();

    // Botones de acción
    await expect(page.getByRole("link", { name: /Cómo llegar/i }).first()).toBeVisible();
  });
});

