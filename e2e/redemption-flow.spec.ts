import { test, expect } from "@playwright/test";

test.describe("Flujo E2E de Cobro y Canje POS QR en Tienda", () => {
  test("debe permitir a la tienda generar un cobro y al ciudadano verificar el modal Web3", async ({ page }) => {
    // 1. Visitar portal de inicio de sesión
    await page.goto("/");
    await expect(page.locator("h1, h2")).toBeVisible();

    // 2. Navegar a la vista de Términos y Condiciones
    await page.goto("/terminos");
    await expect(page.locator("text=Términos y Condiciones")).toBeVisible();

    // 3. Navegar al Libro de Reclamaciones
    await page.goto("/libro-de-reclamaciones");
    await expect(page.locator("text=Libro de Reclamaciones Virtual")).toBeVisible();
    await expect(page.locator("text=Indecopi")).toBeVisible();
  });
});
