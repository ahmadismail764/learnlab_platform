import { test, expect } from '@playwright/test';

test('FSRS due queue updates correctly after 3 days of virtual time', async ({ page }) => {
  // Install Playwright clock to control browser time (starts at current system time)
  await page.clock.install();

  // 1. Log in
  await page.goto('/login');
  await page.fill('#email-or-username', 'learner');
  await page.fill('#password', 'learner123');
  await page.click('button[type="submit"]');

  // Verify dashboard and check initial queue status
  await expect(page).toHaveURL(/\/learner/);
  
  // Clear any existing due state by doing a practice session first if needed,
  // or assert that we can start a session and make it due.
  // Let's navigate to the practice page for a specific topic (e.g. Sets)
  await page.goto('/learner/practice?topic=8e6cadd5-e036-40f3-825e-d283d9f956b5');
  await page.click('button:has-text("Start session")');

  // Solve the first question and rate it "Good" (this updates next_review to ~2 days in the future)
  const options = page.locator('button.border-neutral-200, button.border-neutral-800');
  await expect(options.first()).toBeVisible();
  await options.first().click();

  const goodRating = page.locator('button:has-text("Good")');
  await expect(goodRating).toBeVisible();
  await goodRating.click();

  // Go back to the dashboard
  await page.goto('/learner');

  // Advance the system clock by exactly 3 days and 1 minute
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000 + 60000;
  await page.clock.fastForward(threeDaysInMs);

  // Reload page state to trigger next_due check on the frontend with the advanced clock
  await page.reload();

  // Verify that the queue now shows the topic as due
  await expect(page.locator('text=/topic.*due/i').first()).toBeVisible();
});
