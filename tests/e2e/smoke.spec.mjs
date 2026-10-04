import { test, expect } from '@playwright/test';

const games = [
  ['Impostor', 'impostor'],
  ['Tykająca Bomba', 'ticking-bomb'],
  ['Naokoło', 'naokolo'],
  ['Co mam na myśli?', 'co-mam-na-mysli'],
  ['Trzy w Pięć', 'trzy-w-piec'],
  ['Synchronizacja', 'synchronizacja'],
  ['Trzy Rundy', 'trzy-rundy'],
  ['Dzika Karta', 'dzika-karta']
];

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

test('game views and runtime are loaded only when the game opens', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#screen-home')).toBeVisible();
  await expect(page.locator('#screen-menu')).toHaveCount(0);
  await expect(page.locator('#screen-bomb-menu')).toHaveCount(0);
  expect(await page.locator('script[src*="/games/impostor/game.js"]').count()).toBe(0);

  await page.locator('.game-card-primary').filter({ hasText: 'Impostor' }).click();

  await expect(page.locator('#screen-menu')).toBeVisible();
  await expect(page.locator('#screen-bomb-menu')).toHaveCount(0);
  expect(await page.locator('script[src*="/games/impostor/game.js"]').count()).toBe(1);
  expect(await page.locator('script[src*="/games/ticking-bomb/game.js"]').count()).toBe(0);
});

test('every catalog game can lazy-load and open its menu', async ({ page }) => {
  for (const [name, gameId] of games) {
    await page.goto('/');
    await expect(page.locator('#screen-home')).toBeVisible();
    await page.locator('.game-card-primary').filter({ hasText: name }).click();
    await expect(page.locator('body')).toHaveAttribute('data-game', gameId);
    await expect(page.locator('.screen.flex')).toBeVisible();
  }
});

test('PWA shortcut deep link opens Impostor after lazy preparation', async ({ page }) => {
  await page.goto('/?game=impostor');
  await expect(page.locator('#screen-menu')).toBeVisible();
  await expect(page).not.toHaveURL(/game=impostor/);
});
