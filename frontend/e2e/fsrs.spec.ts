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
  
  // Get the first topic ID from the authenticated API
  const topicId = await page.evaluate(async () => {
    const token = localStorage.getItem('learnlab_auth_token') || sessionStorage.getItem('learnlab_auth_token');
    const res = await fetch('/api/v1/topics/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const topics = await res.json();
    return topics[0].id;
  });

  // Go to the dynamic practice page
  await page.goto(`/learner/practice?topic=${topicId}`);
  await page.click('button:has-text("Start session")');

  // Solve the first question and rate it "Good" (this updates next_review to ~2 days in the future)
  const options = page.locator('button.border-neutral-200, button.border-neutral-800');
  await expect(options.first()).toBeVisible();
  await options.first().click();

  const goodRating = page.locator('button:has-text("Good")');
  await expect(goodRating).toBeVisible();
  await goodRating.click();

  // Wait for and click the continue session button to commit interaction state properly
  const nextBtn = page.locator('button:has-text("Continue"), button:has-text("Finish session")');
  await expect(nextBtn).toBeVisible();
  await nextBtn.click();

  // Go to about:blank to prevent page timers from clearing tokens during time jump
  await page.goto('about:blank');

  // Advance the system clock by exactly 3 days and 1 minute
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000 + 60000;
  await page.clock.fastForward(threeDaysInMs);

  // Go back to the dashboard with the advanced clock
  await page.goto('/learner');

  // Verify that the queue now shows the topic as due
  await expect(page.locator('text=/topic.*due/i').first()).toBeVisible();
});

