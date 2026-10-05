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

test('critical runtime styles, fonts and icons are active', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#screen-home')).toBeVisible();

  const metrics = await page.evaluate(async () => {
    await document.fonts?.ready;
    const main = document.getElementById('app-main');
    const settings = document.getElementById('home-settings-btn');
    const settingsIcon = settings?.querySelector('i');
    const popover = document.getElementById('shell-menu-popover');
    return {
      runtimeMarker: getComputedStyle(document.documentElement).getPropertyValue('--partyjniak-runtime-bundle').trim(),
      bodyFont: getComputedStyle(document.body).fontFamily,
      mainMaxWidth: getComputedStyle(main).maxWidth,
      settingsDisplay: getComputedStyle(settings).display,
      iconFont: getComputedStyle(settingsIcon).fontFamily,
      iconContent: getComputedStyle(settingsIcon, '::before').content,
      popoverDisplay: getComputedStyle(popover).display
    };
  });

  expect(metrics.runtimeMarker).toBe('ready');
  expect(metrics.bodyFont).toContain('Inter');
  expect(metrics.mainMaxWidth).toBe('512px');
  expect(metrics.settingsDisplay).not.toBe('none');
  expect(metrics.iconFont).toContain('Font Awesome 6 Free');
  expect(metrics.iconContent).not.toBe('none');
  expect(metrics.popoverDisplay).toBe('none');
});

test('home never exposes the active-round pause sheet', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#screen-home')).toBeVisible();

  const sheet = page.locator('#navigation-sheet');
  await expect(sheet).toBeHidden();
  await expect(sheet).toHaveClass(/hidden/);

  const openedOnHome = await page.evaluate(() => window.openNavigationSheet('home'));
  expect(openedOnHome).toBe(false);
  await expect(sheet).toBeHidden();

  await page.evaluate(() => {
    const staleSheet = document.getElementById('navigation-sheet');
    staleSheet?.classList.remove('hidden');
    staleSheet?.classList.add('flex');
    window.goToScreen('home', { silent: true });
  });

  await expect(sheet).toBeHidden();
  await expect(sheet).not.toHaveClass(/\bflex\b/);
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

test('every game uses the same minimal menu contract and geometry', async ({ page }) => {
  let baseline = null;

  for (const [name, gameId] of games) {
    await page.goto('/');
    await expect(page.locator('#screen-home')).toBeVisible();
    await page.locator('.game-card-primary').filter({ hasText: name }).click();

    await expect(page.locator('body')).toHaveAttribute('data-game', gameId);
    const menu = page.locator('.game-menu-screen');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('heading', { name })).toBeVisible();
    await expect(menu.getByRole('button', { name: 'Nowa gra' })).toBeVisible();
    await expect(menu.getByRole('button', { name: 'Zasady' })).toBeVisible();
    await expect(menu.locator('button')).toHaveCount(2);
    await expect(menu.getByText(/Wyniki|Wznów grę|Graj z poprzednią ekipą/i)).toHaveCount(0);

    const metrics = await menu.evaluate(element => {
      const icon = element.querySelector('.game-menu-icon');
      const primary = element.querySelector('.game-menu-primary');
      const rules = element.querySelector('.game-menu-rules');
      const actions = element.querySelector('.game-menu-actions');
      const hero = element.querySelector('.game-menu-hero');
      const style = target => getComputedStyle(target);
      return {
        menuGap: style(element).gap,
        heroGap: style(hero).gap,
        actionGap: style(actions).gap,
        iconWidth: style(icon).width,
        iconHeight: style(icon).height,
        primaryHeight: style(primary).height,
        rulesHeight: style(rules).height,
        primaryRadius: style(primary).borderRadius,
        rulesRadius: style(rules).borderRadius
      };
    });

    if (!baseline) baseline = metrics;
    else expect(metrics).toEqual(baseline);
  }
});

test('leaving an active round exposes a short-lived recovery card on the hub', async ({ page }) => {
  await page.goto('/');
  await page.locator('.game-card-primary').filter({ hasText: 'Impostor' }).click();
  await page.getByRole('button', { name: 'Nowa gra' }).click();
  await expect(page.locator('#screen-setup-count')).toBeVisible();
  await page.getByRole('button', { name: /Dalej: ustawienia/i }).click();
  await expect(page.locator('#screen-setup-options')).toBeVisible();
  await page.getByRole('button', { name: /Rozpocznij rundę/i }).click();
  await expect(page.locator('#screen-pass')).toBeVisible();

  expect(await page.evaluate(() => window.openNavigationSheet('home'))).toBe(true);
  await expect(page.locator('#navigation-sheet')).toBeVisible();
  await page.evaluate(() => window.closeNavigationSheet());
  await expect(page.locator('#navigation-sheet')).toBeHidden();

  await page.evaluate(() => window.leaveActiveRound('home'));
  await expect(page.locator('#screen-home')).toBeVisible();
  const recovery = page.locator('#interrupted-game-card');
  await expect(recovery).toBeVisible();
  await expect(recovery).toContainText('Impostor');
  await expect(recovery.getByRole('button', { name: 'Wróć do gry' })).toBeVisible();

  await recovery.getByRole('button', { name: 'Wróć do gry' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-game', 'impostor');
  await expect(page.locator('#screen-setup-options')).toBeVisible();
  await expect(page.locator('#interrupted-game-card')).toBeHidden();
});

test('PWA shortcut deep link opens Impostor after lazy preparation', async ({ page }) => {
  await page.goto('/?game=impostor');
  await expect(page.locator('#screen-menu')).toBeVisible();
  await expect(page.locator('#screen-menu')).toHaveClass(/game-menu-screen/);
  await expect(page).not.toHaveURL(/game=impostor/);
});
