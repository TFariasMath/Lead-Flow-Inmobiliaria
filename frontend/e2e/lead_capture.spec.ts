import { test, expect } from '@playwright/test';

test('debe capturar un lead correctamente desde la landing page', async ({ page }) => {
  // 1. Navegar a la landing page de prueba
  await page.goto('/l/test-e2e-landing');

  // 2. Verificar que el título sea correcto
  // 2. Verificar que el título sea correcto (Dando tiempo a que compile Next.js)
  try {
    await expect(page.locator('h1')).toContainText('Landing de Prueba E2E', { timeout: 30000 });
  } catch (e) {
    console.log("DEBUG - Contenido de la página al fallar:", await page.content());
    throw e;
  }

  // 3. Rellenar el formulario
  // Nota: Usamos selectores basados en el componente LandingLayout
  await page.fill('input[name="email"]', 'e2e-user@playwright.com');
  
  // Si el formulario tiene campos dinámicos, Playwright esperará a que estén visibles
  // En nuestro setup_e2e no activamos campos extra por defecto, solo email.
  
  // 4. Hacer clic en el botón de enviar
  await page.click('button[type="submit"]');

  // 5. Verificar mensaje de éxito
  // El componente muestra un h2 con "¡Listo!" y el mensaje de éxito configurado
  await expect(page.locator('h2')).toContainText('¡Listo!');
  await expect(page.locator('text=¡Gracias por participar en el test!')).toBeVisible();
});

test('debe mostrar error si el email falta', async ({ page }) => {
    await page.goto('/l/test-e2e-landing');
    
    // Intentar enviar sin rellenar nada
    await page.click('button[type="submit"]');
    
    // El navegador debería bloquear el envío por el atributo 'required'
    // O el frontend debería mostrar un error si la validación falla
    const emailInput = page.locator('input[name="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isInvalid).toBeTruthy();
});
