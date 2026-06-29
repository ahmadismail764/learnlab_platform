import { test, expect } from '@playwright/test';

const QUESTION_TEXT = 'E2E: differentiate x^2 with respect to x.';

test('admin can author a written-answer question', async ({ page }) => {
  // Log in as admin.
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#email-or-username', 'admin');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin/);

  await page.click('a[href="/admin/questions"]');
  await page.click('button:has-text("Add Question")');

  // Switch to the written-answer type — choices disappear, a canonical
  // ASCII-math answer field appears.
  await page.click('button:has-text("Written answer")');

  await page.fill('textarea[required]', QUESTION_TEXT);
  await page.fill('input[placeholder*="2*x"]', '2*x');
  // In written mode the only selects are tier and topic; pick a topic.
  await page.locator('select').last().selectOption({ index: 1 });

  await page.click('button:has-text("Create question")');

  // It shows up in the question bank.
  await expect(page.locator(`text=${QUESTION_TEXT}`).first()).toBeVisible();

  // Clean up so the test is repeatable.
  const row = page.locator('tr', { hasText: QUESTION_TEXT }).first();
  await row.locator('button[aria-label="Delete Question"]').click();
  await page.click('.fixed button:has-text("Delete")');
  await expect(page.locator(`text=${QUESTION_TEXT}`)).not.toBeVisible();
});
