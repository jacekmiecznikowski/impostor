import { test, expect } from '@playwright/test';

test('Co mam na myśli keeps transient play layers hidden until explicitly shown', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#screen-home')).toBeVisible();

  await page.locator('.game-card-primary').filter({ hasText: 'Co mam na myśli?' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-game', 'co-mam-na-mysli');

  const playScreen = page.locator('#screen-cmm-play');
  const countdown = page.locator('#cmm-countdown');
  const feedback = page.locator('#cmm-gesture-feedback');
  const fallback = page.locator('#cmm-fallback-controls');

  await expect(playScreen).toBeHidden();
  await expect(countdown).toBeHidden();
  await expect(feedback).toBeHidden();
  await expect(fallback).toBeHidden();

  await page.evaluate(() => window.goToScreen('cmm-play', { silent: true }));
  await expect(playScreen).toBeVisible();
  await expect(countdown).toBeHidden();
  await expect(feedback).toBeHidden();
  await expect(fallback).toBeHidden();

  const display = await page.evaluate(() => ({
    countdown: getComputedStyle(document.getElementById('cmm-countdown')).display,
    feedback: getComputedStyle(document.getElementById('cmm-gesture-feedback')).display,
    fallback: getComputedStyle(document.getElementById('cmm-fallback-controls')).display
  }));

  expect(display).toEqual({ countdown: 'none', feedback: 'none', fallback: 'none' });
});
