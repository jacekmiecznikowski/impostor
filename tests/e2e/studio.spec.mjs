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

test('Content Studio sends OTP, signs in and opens seven game editors', async ({ page }) => {
  const requests = [];
  const gameIds = ['impostor', 'ticking-bomb', 'co-mam-na-mysli', 'naokolo', 'synchronizacja', 'trzy-w-piec', 'dzika-karta'];
  const word = { word: 'Jabłko', hint: 'Owoc' };
  const categories = {
    impostor: { id: 'jedzenie', name: 'Jedzenie', icon: 'fa-utensils', words: [word] },
    'ticking-bomb': { id: 'jedzenie', name: 'Jedzenie', icon: 'fa-utensils', words: [word] },
    'co-mam-na-mysli': { id: 'jedzenie', name: 'Jedzenie', icon: 'fa-utensils', words: [word] },
    naokolo: { id: 'jedzenie', name: 'Jedzenie', icon: 'fa-utensils', cards: [{ word: 'Jabłko', forbidden: ['owoc','czerwony','sad'] }] },
    synchronizacja: { id: 'jedzenie', name: 'Jedzenie', icon: 'fa-utensils', scales: [{ id: 'jedzenie-1', left: 'Słodki', right: 'Słony' }] },
    'trzy-w-piec': { id: 'jedzenie', name: 'Jedzenie', icon: 'fa-utensils', prompts: [{ id: 'jedzenie-1', text: 'Wymień 3 owoce' }] }
  };
  const docs = gameIds.map(game_id => ({
    game_id, locale: 'pl', revision: 1, published_revision: 1,
    draft: game_id === 'dzika-karta'
      ? { schemaVersion: 1, game: game_id, locale: 'pl', prompts: ['Gdzie byłeś?','Co się stało?','Kto przyszedł?'], answers: Array.from({length: 10}, (_,i) => 'Odpowiedź ' + (i+1)) }
      : { schemaVersion: 1, game: game_id, locale: 'pl', categories: [categories[game_id]], ...(game_id === 'impostor' ? { discussionTips: ['Nie zdradzaj hasła'] } : {}) }
  }));
  await page.route('https://astcatgvvliatokqalhd.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const payload = route.request().postDataJSON() || {};
    requests.push({ path: url.pathname, payload });
    let data;
    if (url.pathname === '/auth/v1/otp') {
      data = {};
    } else if (url.pathname === '/auth/v1/verify') {
      data = {access_token:'mock-jwt',refresh_token:'mock-refresh',expires_in:3600};
    } else if (url.pathname === '/rest/v1/rpc/party_editor_list') {
      data = docs;
    } else {
      throw new Error('Unexpected API request: ' + url.pathname);
    }
    await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
  });
  await page.goto('/admin/');
  await page.locator('#send-code').click();
  await expect(page.locator('#toast')).toContainText('Kod został wysłany');
  expect(requests.find(x=>x.path==='/auth/v1/otp')?.payload).toEqual({
    email:'contact@swawole.studio',create_user:false
  });
  await page.locator('#otp-code').fill('123456');
  await page.locator('#verify-code').click();
  await expect(page.locator('#studio-view')).toBeVisible();
  await expect(page.locator('#total-games')).toHaveText('7');
  await page.locator('#game-picker').selectOption('impostor');
  await expect(page.locator('#extra-settings')).toBeVisible();
  await expect(page.locator('#extra-list .item-row')).toHaveCount(1);
  await page.locator('#add-tip').click();
  await expect(page.locator('#extra-list .item-row')).toHaveCount(2);
});
