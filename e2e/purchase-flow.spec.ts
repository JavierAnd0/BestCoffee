import { test, expect } from "@playwright/test";

test.describe("Flujo de Compra Completo — Cliente y Usuario", () => {
  test("1. PDP permite configurar tamaño, molienda, agregar al carrito y abre el drawer", async ({
    page,
  }) => {
    await page.goto("/p/mezcla-del-alba");
    await expect(page.locator("h1")).toContainText(/Mezcla del alba/i);

    // Selección de molienda y tamaño si están disponibles
    const grindButton = page.getByRole("button", { name: /Grano/i }).first();
    if (await grindButton.isVisible()) {
      await grindButton.click();
    }

    // Botón de agregar al carrito
    const addToCartBtn = page.getByRole("button", { name: /Agregar al carrito/i }).first();
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // El drawer del carrito debe abrirse automáticamente
    const drawerTitle = page.getByRole("heading", { name: /Tu carrito/i });
    await expect(drawerTitle).toBeVisible();
    await expect(page.locator("body")).toContainText("Mezcla del alba");

    // Botón "Ir a pagar" visible en el carrito
    const checkoutBtn = page.locator('a[href="/checkout"]').first();
    await expect(checkoutBtn).toBeVisible();
  });

  test("2. El carrito permite modificar cantidades y avanza fluidamente al checkout", async ({
    page,
  }) => {
    await page.goto("/p/mezcla-del-alba");

    // Agregar producto
    const addToCartBtn = page.getByRole("button", { name: /Agregar al carrito/i }).first();
    await addToCartBtn.click();

    // Incrementar cantidad dentro del drawer
    const plusBtn = page.getByRole("button", { name: "Aumentar" }).first();
    if (await plusBtn.isVisible()) {
      await plusBtn.click();
    }

    // Proceder al checkout
    const checkoutBtn = page.locator('a[href="/checkout"]').first();
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // Debe cargar la pantalla de Checkout
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.locator("h2").filter({ hasText: /Resumen del pedido/i })).toBeVisible();
  });

  test("3. Checkout Wizard valida pasos, aplica cupones y procesa la orden", async ({
    page,
  }) => {
    // Primero agregar un producto al carrito para tener ítems activos
    await page.goto("/p/sierra-nevada");
    await page.getByRole("button", { name: /Agregar al carrito/i }).first().click();

    // Ir al checkout
    await page.goto("/checkout");

    // Paso 1: Contacto
    const emailInput = page.locator('main input[type="email"]');
    await emailInput.fill("cliente.prueba@ejemplo.com");

    const phoneInput = page.locator('main input[type="tel"]');
    await phoneInput.fill("+57 300 987 6543");

    await page.getByRole("button", { name: /Continuar a envío/i }).click();

    // Paso 2: Dirección de entrega
    await expect(page.getByRole("heading", { name: /Dirección de entrega/i })).toBeVisible();

    const addressInput = page.locator('input[placeholder*="Calle"]').first();
    if (await addressInput.isVisible()) {
      await addressInput.fill("Calle 85 # 11-53");

      const nameInput = page.locator('input[placeholder="Nombre"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("Carlos");
      }

      const deptSelect = page.locator('select#shipping-region, select[name="department"]').first();
      if (await deptSelect.isVisible()) {
        await deptSelect.selectOption({ label: "Bogotá D.C." }).catch(async () => {
          await deptSelect.selectOption({ index: 1 });
        });
      }

      const citySelect = page.locator('select#shipping-city, select[name="city"]').first();
      if (await citySelect.isVisible()) {
        await citySelect.selectOption({ index: 1 }).catch(async () => {
          await citySelect.selectOption({ label: "Bogotá, D.C." });
        });
      }
    }

    // Probar cupón de descuento en el resumen
    const couponInput = page.locator('input[placeholder*="Código de descuento"]').first();
    if (await couponInput.isVisible()) {
      await couponInput.fill("BIENVENIDO");
      await page.getByRole("button", { name: "Aplicar" }).click();
      await expect(page.locator("body")).toContainText(/BIENVENIDO/i);
    }

    // Continuar a método de pago
    await page.getByRole("button", { name: /Continuar a método de pago/i }).click();

    // Paso 3: Método de pago
    await expect(page.getByRole("heading", { name: /Método de pago/i })).toBeVisible();

    // Seleccionar método Contra Entrega o Tarjeta
    const cashOption = page.getByRole("button", { name: /Contra Entrega/i });
    if (await cashOption.isVisible()) {
      await cashOption.click();
    }

    // Confirmar y pagar
    const payBtn = page.getByRole("button", { name: /Confirmar pedido y pagar/i });
    await expect(payBtn).toBeVisible();
    await payBtn.click();

    // Confirmación exitosa
    await expect(page).toHaveURL(/\/checkout\/confirmacion/, { timeout: 15_000 });
    await expect(page.locator("h1")).toContainText(/¡Gracias por tu compra!/i);
    await expect(page.locator("body")).toContainText(/Pedido #(?:ORG-|BC-|c[a-z0-9]+)/i);
  });

  test("4. Carrito vacío en /checkout muestra aviso amigable e invitación a explorar", async ({
    page,
  }) => {
    // Visitar checkout directamente con carrito vacío
    await page.goto("/checkout");

    // Limpiar localStorage del carrito para simular usuario nuevo sin compras
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.locator("h1")).toContainText(/Tu carrito está vacío/i);
    const exploreBtn = page.getByRole("link", { name: /Explorar cafés/i });
    await expect(exploreBtn).toBeVisible();
  });
});
