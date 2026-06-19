import { test, expect } from '@playwright/test';

test('Admin can perform full CRUD lifecycle on practice questions', async ({ page }) => {
  // 1. Log in as admin
  await page.goto('/login');
  await page.fill('#email-or-username', 'admin');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');

  // Verify redirection to admin dashboard
  await expect(page).toHaveURL(/\/admin/);

  // 2. Navigate to questions page
  await page.goto('/admin/questions');

  // 3. CREATE Question
  await page.click('button:has-text("Add Question")');

  // Fill out the creation form
  await page.fill('textarea[required]', 'What is the power set of {a}?');
  // Fill the choices
  const choicesTextarea = page.locator('textarea').nth(1);
  await choicesTextarea.fill('{{}, {a}}\n{a}\n{}\n{a, b}');

  // Select the UI topic option; the backend still receives the linked subtopic id.
  await page.locator('select').nth(2).selectOption({ index: 1 });

  // Select correct index
  await page.selectOption('select', '0'); // Correct index

  // Click Save/Submit
  await page.click('button:has-text("Create question")');

  // Assert question exists in the table list
  await expect(page.locator('text=What is the power set of {a}?').first()).toBeVisible();

  // 4. UPDATE Question
  const row = page.locator('tr', { hasText: 'What is the power set of {a}?' }).first();
  await row.locator('button[aria-label="Edit question"]').click();

  // Change the text
  await page.fill('textarea[required]', 'What is the power set of {a} (updated)?');
  await page.click('button:has-text("Save changes")');

  // Verify updated text
  await expect(page.locator('text=What is the power set of {a} (updated)?').first()).toBeVisible();

  // 5. DELETE Question
  const updatedRow = page.locator('tr', { hasText: 'What is the power set of {a} (updated)?' }).first();
  await updatedRow.locator('button[aria-label="Delete question"]').click();

  // Confirm delete in modal dialog
  await page.click('.fixed button:has-text("Delete")');

  // Verify it is gone
  await expect(page.locator('text=What is the power set of {a} (updated)?')).not.toBeVisible();
});
