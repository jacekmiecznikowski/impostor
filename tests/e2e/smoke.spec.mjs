import { test, expect } from '@playwright/test';

test('home starts without external runtime requests', async ({ page }) => {
  const externalRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (!url.startsWith('http://127.0.0.1:4173') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      externalRequests.push(url);
    }
  });

  await page.goto('/');
  await expect(page.locator('#screen-home')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Partyjniak' })).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test('game views are loaded only when the game opens', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#screen-home')).toBeVisible();
  await expect(page.locator('#screen-menu')).toHaveCount(0);
  await expect(page.locator('#screen-bomb-menu')).toHaveCount(0);

  await page.locator('.game-card-primary').filter({ hasText: 'Impostor' }).click();

  await expect(page.locator('#screen-menu')).toBeVisible();
  await expect(page.locator('#screen-bomb-menu')).toHaveCount(0);
});

test('PWA shortcut deep link opens Impostor after lazy preparation', async ({ page }) => {
  await page.goto('/?game=impostor');
  await expect(page.locator('#screen-menu')).toBeVisible();
  await expect(page).not.toHaveURL(/game=impostor/);
});
