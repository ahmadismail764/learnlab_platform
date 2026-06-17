import { test, expect } from '@playwright/test';

test('Learner can start and successfully complete a practice session', async ({ page }) => {
  // 1. Log in
  await page.goto('/login');
  await page.fill('#email-or-username', 'learner');
  await page.fill('#password', 'learner123');
  await page.click('button[type="submit"]');

  // Verify redirection to learner dashboard
  await expect(page).toHaveURL(/\/learner/);

  // 2. Start practice session from dashboard
  await page.click('text="Start Session"');
  await expect(page).toHaveURL(/\/learner\/practice/);

  // 3. Click "Start session" on practice intro page
  await page.click('button:has-text("Start session")');

  // 4. Solve questions until completion
  // The default session length is up to 10 questions.
  // We can loop and dynamically select answers.
  for (let i = 0; i < 10; i++) {
    // If the session completes, we'll see the complete screen
    const completeHeader = page.locator('text="Session complete"');
    if (await completeHeader.isVisible()) {
      break;
    }

    // Wait for choice buttons
    const options = page.locator('button.border-neutral-200, button.border-neutral-800');

    if (await options.first().isVisible()) {
      await options.first().click();
    } else {
      break;
    }

    // Click rating grade button (e.g., "Good")
    const goodRating = page.locator('button:has-text("Good")');
    await goodRating.click();
  }

  // 5. Verify the session completion card is displayed
  await expect(page.locator('text="Session complete"')).toBeVisible();
  await expect(page.locator('text="XP earned"')).toBeVisible();
});
