import { test, expect } from '@playwright/test';

test('diagnostico: debe cargar la home', async ({ page }) => {
  await page.goto('/');
  // Verificamos que el título de la página o algún elemento base exista
  await expect(page).toHaveTitle(/Lead Flow/i);
});
