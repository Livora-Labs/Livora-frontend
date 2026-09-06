import { test, expect } from "@playwright/test";

test.describe("Flujo E2E de Libro de Reclamaciones (Indecopi)", () => {
  test("renderiza el formulario con todas las secciones obligatorias conforme a la Ley 29571", async ({ page }) => {
    await page.goto("/libro-de-reclamaciones");

    // Verificar Secciones
    await expect(page.locator("text=1. Identificación del Consumidor Reclamante")).toBeVisible();
    await expect(page.locator("text=2. Identificación del Bien Contratado")).toBeVisible();
    await expect(page.locator("text=3. Detalle de la Reclamación")).toBeVisible();
    await expect(page.locator("text=Declaración Jurada:")).toBeVisible();
    await expect(page.locator("button:has-text('Enviar Reclamación Virtual')")).toBeVisible();
  });

  test("permite navegar a la consulta de seguimiento de reclamos", async ({ page }) => {
    await page.goto("/libro-de-reclamaciones/seguimiento");

    await expect(page.locator("text=Consulta de Estado")).toBeVisible();
    await expect(page.locator("input[placeholder*='00001-2026']")).toBeVisible();
  });
});
