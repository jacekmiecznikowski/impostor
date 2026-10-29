import { test, expect } from '@playwright/test';

test('Content Studio renders a mobile-friendly secure login page', async ({ page }) => {
  await page.goto('/admin/');
  await expect(page.getByText('Treści wszystkich gier w jednym miejscu.')).toBeVisible();
  await expect(page.locator('#login-view')).toBeVisible();
  await expect(page.locator('#studio-view')).toBeHidden();
  await expect(page.locator('#editor-email')).toBeVisible();
  await expect(page.locator('#editor-email')).toHaveValue('contact@swawole.studio');
  await expect(page.locator('#project-url')).toBeHidden();
  await page.locator('.advanced-connection summary').click();
  await expect(page.locator('#project-url')).toBeVisible();
  await expect(page.locator('#project-url')).toHaveValue('https://astcatgvvliatokqalhd.supabase.co');
  await expect(page.locator('#publishable-key')).toBeVisible();
  await expect(page.locator('#otp-code')).toBeVisible();
  await expect(page.locator('#send-code')).toBeVisible();
  await expect(page.locator('#verify-code')).toBeVisible();
  await expect(page.locator('#connection')).toContainText('Niepołączono');
  const isWideEnough = await page.locator('#connect-form').evaluate(
    element => element.getBoundingClientRect().width >= 275
  );
  expect(isWideEnough).toBe(true);
});
