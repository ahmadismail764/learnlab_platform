# Frontend Recommendations

> Suggested improvements for code quality, UI/UX, and maintainability.
> Priority: 🔴 Should fix · 🟡 Recommended · 🟢 Enhancement

---

## 🔴 Code Quality — Should Fix

### 1. Remove dead `RawTopicMastery` interface and `toList` helper

**File:** `src/services/topics.ts`

After removing the unused `normalizeMastery`, `clamp01`, and `normalizeMasteryStatus` functions (done in this audit), the `RawTopicMastery` interface and `toList` generic function are also orphaned. Remove them to keep the module lean.

```diff
- interface RawTopicMastery { ... }
- function toList<T>(data: ...): T[] { ... }
```

---

### 2. Consolidate duplicate `useToast` import in AdminProfilePage

**File:** `src/pages/admin/AdminProfilePage.tsx`

```typescript
import { useAuth, useCurrentUser } from '@/contexts'
import { useToast } from '@/contexts'  // ← merge into the line above
```

Should be:

```typescript
import { useAuth, useCurrentUser, useToast } from '@/contexts'
```

---

### 3. LoginPage test accounts should use `username` not `email`

**File:** `src/pages/auth/LoginPage.tsx`

The quick-fill test accounts populate the email field with values like `testlearner@example.com`. But since the backend uses `USERNAME_FIELD = 'username'`, these should either:
- Show the **username** (e.g., `testlearner`) for quick-fill, OR
- Clearly label the login field as "Username or Email" and handle both

---

### 4. `useAggregatedMetrics` hook type is now nullable

**File:** `src/hooks/useApi.ts`

The hook is typed as `useQuery<AggregatedMetricsResponse>` but `analyticsService.getAggregatedMetrics()` now returns `AggregatedMetricsResponse | null`. Update the generic:

```typescript
export function useAggregatedMetrics() {
  return useQuery<AggregatedMetricsResponse | null>({
    queryKey: queryKeys.analytics.aggregated,
    queryFn: () => analyticsService.getAggregatedMetrics(),
  })
}
```

---

## 🟡 Recommended Improvements

### 5. Extract modals into standalone components

**Files:** `TopicsManagementPage.tsx`, `QuestionsPage.tsx`

Both pages embed full modal dialogs (create/edit/delete) inline within the page component. This makes the page components 500-900+ lines long.

**Recommendation:** Extract into:
- `src/components/admin/TopicFormModal.tsx`
- `src/components/admin/DeleteTopicDialog.tsx`
- `src/components/admin/QuestionFormModal.tsx`
- `src/components/admin/DeleteQuestionDialog.tsx`

Benefits: smaller files, reusable dialogs, easier testing.

---

### 6. Replace hardcoded mock data with backend calls or clear `[MOCK]` markers

**Files:**
- `AnalyticsPage.tsx` — `FSRS_METRICS`, `TOPIC_PERFORMANCE`, `WEEKLY_ACTIVITY` are all hardcoded constants
- `AdminProfilePage.tsx` — `recentActions` is hardcoded
- `AdminDashboard.tsx` — likely has similar patterns

**Recommendation:** Either:
- Wire these to real backend endpoints when available, OR
- Add a visible `[Mock Data]` badge/banner in the UI so users aren't confused, OR
- Move mock data to a `src/mocks/` directory for cleaner separation

---

### 7. Add global error boundary with retry

The app uses `LazyRoute` with `Suspense` for code splitting, but there's no `ErrorBoundary` wrapping lazy components. If a chunk fails to load (network error), the user sees a white screen.

**Recommendation:** Add a React Error Boundary component:

```tsx
// src/components/common/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // Catch chunk load failures, show retry button
}
```

Wrap `LazyRoute` children with it.

---

### 8. Add `aria-label` attributes to icon-only buttons

**Files:** Multiple pages use icon-only `<Button>` with no accessible label:

```tsx
<Button variant="ghost" size="sm">
  <Edit2 className="h-4 w-4" />
</Button>
```

**Recommendation:** Add `aria-label`:

```tsx
<Button variant="ghost" size="sm" aria-label="Edit topic">
  <Edit2 className="h-4 w-4" />
</Button>
```

---

### 9. Use React Query's `useSuspenseQuery` for lazy-loaded pages

Since pages are already wrapped in `Suspense` via `LazyRoute`, switching to `useSuspenseQuery` would eliminate the need for manual `isLoading` checks in each page component. The `Suspense` boundary would handle the loading state automatically.

---

### 10. Centralize form validation with Zod

`zod` is already a dependency but it's not used for form validation. Both `TopicsManagementPage` and `QuestionsPage` do manual validation with if-statements.

**Recommendation:** Create Zod schemas:

```typescript
// src/schemas/topic.ts
import { z } from 'zod';

export const topicSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
  description: z.string().optional(),
  parent_module: z.string().optional(),
});
```

---

## 🟢 UI/Design Enhancements

### 11. Add skeleton loaders instead of spinner-only loading states

**Files:** `TopicsManagementPage.tsx`, `QuestionsPage.tsx`, `LeaderboardPage.tsx`

Currently these show a centered spinner. Skeleton loaders (content-shaped placeholders) provide better perceived performance.

**Recommendation:** Create a `<Skeleton>` component and use it in loading states:

```tsx
// Loading state
<div className="space-y-4">
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
</div>
```

---

### 12. Add transition animations to modals

**Files:** `TopicsManagementPage.tsx`, `QuestionsPage.tsx`

Modals appear/disappear instantly. Since `framer-motion` is already a dependency:

```tsx
<AnimatePresence>
  {showForm && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* modal content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

### 13. Add empty state illustrations

The `EmptyState` component shows icons but could benefit from custom SVG illustrations for a more polished look. Consider adding simple illustrations for:
- No questions yet
- No topics yet
- No search results
- No leaderboard data

---

### 14. Dark mode toggle should persist across sessions

Verify that the `ThemeContext` persists the dark mode preference to `localStorage`. If it doesn't, users have to re-select their theme on every visit.

---

### 15. Add breadcrumb navigation

The admin section has nested routes (`/admin/topics`, `/admin/questions`, etc.) but no breadcrumb trail. Adding a `<Breadcrumb>` component to the `DashboardLayout` would improve navigation clarity, especially for deeper pages.

---

### 16. Consider adding `react-hot-toast` or upgrading toast system

The current `ToastContext` is custom-built. Consider using a battle-tested library like `react-hot-toast` or `sonner` for:
- Stacking multiple toasts
- Swipe-to-dismiss on mobile
- Promise-based toasts (show loading → success/error)
- Undo actions

---

### 17. RTL support refinement

The codebase has some RTL-aware classes (`rtl:rotate-180`, `start-3`, `ps-10`) but this isn't consistent. For full Arabic/RTL support:
- Audit all `left-*` / `right-*` / `pl-*` / `pr-*` classes and replace with logical properties (`start-*`, `end-*`, `ps-*`, `pe-*`)
- Test the full UI in RTL mode
