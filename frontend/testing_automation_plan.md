# LearnLab Test Automation Plan & Blueprint

This document outlines a complete strategic blueprint for automating LearnLab's frontend and integration tests. It addresses automated session-solving, simulating time-travel for FSRS scheduler testing, and admin workflows (CRUD questions and management), providing a clear breakdown of **what can be fully automated** versus **what should be verified manually**.

By implementing this automation framework, **over 95% of functional verification can be automated**, leaving you with maximum room to focus purely on UI/UX design, micro-interactions, responsive sizing, and premium visual layout elements.

---

## 1. Automation vs. Manual Verification Matrix

| Feature Area | Can Be Automated? | Recommended Tool | Automation Strategy | Manual Verification Focus |
| :--- | :---: | :--- | :--- | :--- |
| **User Onboarding & Auth** | **100%** | Playwright | Fill credentials, verify JWT cookie/localStorage, test staff redirects. | None (visual layout checked once). |
| **Solving Practice Sessions** | **95%** | Playwright / Mock API | Programmatic answer submission via DOM selectors or test helpers. | CSS transitions, progress bar easing, success micro-animations. |
| **FSRS Time-Travel Scheduler** | **100%** | Playwright `page.clock` | Mock browser system clock to simulate multi-day jumps and verify due queues. | Skeleton screen loaders during time jump updates. |
| **Admin Questions CRUD** | **100%** | Playwright | Full form interaction, validation error checks, API payload assertion. | Visual alignment of input forms, dark mode contrast. |
| **Leaderboard Live Ranks** | **90%** | Playwright / MSW | Mocking leaderboard responses to assert high/low rank visual states. | Elite crown/medal graphics, HSL color harmony in rows. |
| **Analytics & Progress Graphs** | **80%** | Playwright / Vitest | Assert SVG nodes exist and contain correct relative coordinate heights. | Graph color harmony, tooltip hover delays, responsive chart scaling. |

---

## 2. Automating Learner Practice & Solving Sessions

End-to-End (E2E) testing of a discrete math practice session requires simulating multiple question types (e.g. multiple choice, input, matching) and submitting them.

### Strategy: Test Selectors and State Hooking
To prevent fragile E2E tests, add dedicated `data-testid` attributes to interactive practice elements:
* `data-testid="question-card"`: The container for the active question.
* `data-testid="option-select-*"`: Option buttons in multiple-choice questions.
* `data-testid="math-input"`: Input fields for math text answers.
* `data-testid="submit-answer"`: The submit button.
* `data-testid="session-completion-card"`: The modal displayed when a session completes.

### Sample Playwright Script: Completing a Practice Session

```typescript
import { test, expect } from '@playwright/test';

test('Learner can start and successfully complete a practice session', async ({ page }) => {
  // 1. Log in programmatically to skip UI latency
  await page.goto('/login');
  await page.fill('[data-testid="username-input"]', 'learner');
  await page.fill('[data-testid="password-input"]', 'learner123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/learner');

  // 2. Start a session
  await page.click('text=Start practice');
  await page.waitForURL(/.*\/learner\/practice/);

  // 3. Solve 5 questions programmatically
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Determine the question type and input the correct mock answer
    const option = page.locator('[data-testid^="option-select-"]').first();
    if (await option.isVisible()) {
      // Multiple Choice question: select the first option
      await option.click();
    } else {
      // Input question: type a default answer
      await page.fill('[data-testid="math-input"]', '42');
    }

    // Submit answer and proceed to next question
    await page.click('[data-testid="submit-answer"]');
    await page.click('text=Continue');
  }

  // 4. Verify the session completion card is displayed
  await expect(page.locator('[data-testid="session-completion-card"]')).toBeVisible();
  await expect(page.locator('text=XP Earned')).toContainText('+');
});
```

---

## 3. FSRS Scheduler & "Time-Travel" Clock Mocking

The **Free Spaced Repetition Scheduler (FSRS)** calculates the optimal interval for reviewing topics based on retrievability and memory stability. Testing this manually requires waiting hours or days for topics to become "due."

### The Solution: Playwright Clock Control
Playwright supports **clock virtualization**, letting you freeze, advance, and fast-forward the browser’s internal `Date` and `performance.now()` instantly. This allows you to simulate passing 3 or 7 days in a fraction of a second.

### Sample Playwright Script: FSRS Time-Travel

```typescript
import { test, expect } from '@playwright/test';

test('FSRS due queue updates correctly after 3 days of virtual time', async ({ page }) => {
  // Initialize the browser clock to a fixed point in time
  const baseTime = new Date('2026-05-20T12:00:00Z');
  await page.clock.install({ time: baseTime });

  // 1. Log in and verify initial state
  await page.goto('/learner');
  await expect(page.locator('text=Queue clear')).toBeVisible();

  // 2. Complete a review for a topic (e.g., Set Theory, ID 1)
  await page.goto('/learner/practice?topic=1');
  await page.click('[data-testid="option-select-0"]');
  await page.click('[data-testid="submit-answer"]');
  await page.click('text=Continue');
  
  // Choose "Good" response (triggers 3-day interval in FSRS)
  await page.click('[data-testid="difficulty-good"]');
  await page.goto('/learner');
  await expect(page.locator('text=Queue clear')).toBeVisible();

  // 3. TIME TRAVEL: Advance the system clock by exactly 3 days and 1 minute
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000 + 60000;
  await page.clock.fastForward(threeDaysInMs);

  // Reload page state to trigger a fresh next_due check on the backend
  await page.reload();

  // 4. Verify topic is now due!
  await expect(page.locator('text=1 topic due')).toBeVisible();
  await expect(page.locator('[data-testid="due-topic-name"]')).toContainText('Set Theory');
});
```

---

## 4. Admin Auth & Questions CRUD Automation

Admin operations are highly structured and are perfect candidates for E2E tests, ensuring that content managers can always successfully populate, modify, and refine the question banks.

### Script: Creating, Editing, and Deleting a Question

```typescript
import { test, expect } from '@playwright/test';

test('Admin can perform full CRUD lifecycle on practice questions', async ({ page }) => {
  // 1. Log in as staff
  await page.goto('/login');
  await page.fill('[data-testid="username-input"]', 'admin');
  await page.fill('[data-testid="password-input"]', 'admin123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/admin');

  // 2. CREATE Question
  await page.goto('/admin/questions');
  await page.click('[data-testid="create-question-button"]');
  
  await page.fill('[data-testid="question-text-input"]', 'What is the power set of {a}?');
  await page.selectOption('[data-testid="topic-select"]', { label: 'Set Theory' });
  await page.fill('[data-testid="correct-answer-input"]', '{{}, {a}}');
  await page.fill('[data-testid="explanation-input"]', 'The power set contains all possible subsets.');
  await page.click('[data-testid="save-question"]');

  // Assert question exists in the table list
  await expect(page.locator('text=What is the power set of {a}?')).toBeVisible();

  // 3. UPDATE Question
  await page.click('[data-testid="edit-question-What is the power set of {a}?"]');
  await page.fill('[data-testid="question-text-input"]', 'What is the power set of {a} (updated)?');
  await page.click('[data-testid="save-question"]');
  
  await expect(page.locator('text=What is the power set of {a} (updated)?')).toBeVisible();

  // 4. DELETE Question
  await page.click('[data-testid="delete-question-What is the power set of {a} (updated)?"]');
  await page.click('[data-testid="confirm-delete"]');
  
  await expect(page.locator('text=What is the power set of {a} (updated)?')).not.toBeVisible();
});
```

---

## 5. How Much Manual Testing is Actually Needed?

By implementing the above scripts, you eliminate all manual regression testing for user logins, session saving, time intervals, and question bank updates. You only need to perform minimal manual testing, focused entirely on the **visual layer (UI/UX)**:

1. **Responsive Adjustments (Mobile/Tablet)**
   * Manually resizing the browser or using responsive previews to ensure that the newly integrated 5-column XP stats grids (`LearnerDashboard` & `ProgressPage`) layout neatly without wrapping icons onto new lines.
2. **Animation Easing**
   * Verifying that progress rings and mastery progress bars expand smoothly with custom cubic-bezier transitions rather than snapping abruptly.
3. **Contrast & Theme Harmony (Light/Dark Mode)**
   * Toggling between light and dark modes in the Leaderboard page to confirm that table row selection highlights (especially for the "You" row) offer excellent text readability and a premium glassmorphic feel.
4. **Interaction Feedback (Active, Hover, Focus states)**
   * Playing through a practice session manually once to feel the responsive feedback, hover shifts, and focus ring borders on options.

## 6. Recommended Next Steps for Your Development Workspace

1. **Install Playwright in the Frontend Directory:**
   ```bash
   bun add -d @playwright/test
   npx playwright install
   ```
2. **Setup Test Credentials:**
   The pre-seeded accounts configured in `create-accounts.py` are perfect for automated execution:
   * **Learner E2E**: Username: `learner` / Password: `learner123`
   * **Admin CRUD**: Username: `admin` / Password: `admin123`
3. **Run E2E Suite:**
   Create a basic file structure at `frontend/e2e/practice.spec.ts` using the scripts above, and run:
   ```bash
   npx playwright test
   ```
