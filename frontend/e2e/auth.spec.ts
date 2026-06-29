import { test, expect } from '@playwright/test';

test('rejects invalid credentials and accepts a valid learner login', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Wrong password: stay on /login and surface an error.
  await page.fill('#email-or-username', 'learner');
  await page.fill('#password', 'definitely-wrong');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/login/);

  // Correct password: land on the learner area.
  await page.fill('#password', 'learner123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/learner/);
});
