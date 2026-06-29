import { test, expect } from '@playwright/test';

test('learner navigates from topics into a subtopic-scoped practice session', async ({ page }) => {
  // Log in as a learner.
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#email-or-username', 'learner');
  await page.fill('#password', 'learner123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/learner/);

  // Browse topics.
  await page.goto('/learner/topics', { waitUntil: 'domcontentloaded' });

  // Each subtopic (UI "topic") card links into a session scoped with ?subtopic=.
  const subtopicLink = page.locator('a[href*="/learner/practice?subtopic="]').first();
  await expect(subtopicLink).toBeVisible();
  await subtopicLink.click();

  // The session targeting must carry the subtopic filter through to the URL.
  await expect(page).toHaveURL(/\/learner\/practice\?subtopic=/);
});
