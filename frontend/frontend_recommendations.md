# Frontend Recommendations

> Suggested improvements for code quality, UI/UX, and maintainability.
> Priority: 🔴 Should fix · 🟡 Recommended · 🟢 Enhancement

---

## 🔴 Code Quality — Should Fix

### 1. Replace remaining hardcoded mock data with backend calls

**Files:**
- `AnalyticsPage.tsx` — `FSRS_METRICS`, `TOPIC_PERFORMANCE`, `WEEKLY_ACTIVITY` are all hardcoded constants
- `AdminDashboard.tsx` — uses real stats where possible but falls back to mock constants

**Recommendation:**
- Wire these to real backend endpoints when available. *Note: The Django backend analytics APIs currently return mock/null status, so local mocks are required until backend expansion occurs.*

---

## 🟡 Recommended Improvements

### 2. Centralize Profile and Account Validation using Zod
**Files:**
- `AdminProfilePage.tsx`
- `LearnerProfilePage.tsx`
- `LoginPage.tsx`
- `RegisterPage.tsx`

**Recommendation:**
- Extract procedural forms and validations into a centralized Zod validation schema inside `src/validation/profileSchemas.ts` (e.g. `loginSchema`, `profileSchema`, `registerSchema`) to achieve complete consistency with our validated curriculum and questions form schemas.

---

## 🟢 UI/Design Enhancements

### 4. Add empty state illustrations

The `EmptyState` component shows icons but could benefit from custom SVG illustrations for a more polished look. Consider adding simple illustrations for:
- No questions yet
- No topics yet
- No search results
- No leaderboard data

---

### 5. Add breadcrumb navigation

The admin section has nested routes (`/admin/topics`, `/admin/questions`, etc.) but no breadcrumb trail. Adding a `<Breadcrumb>` component to the `DashboardLayout` would improve navigation clarity, especially for deeper pages.

---

### 6. Consider adding `react-hot-toast` or upgrading toast system

The current `ToastContext` is custom-built. Consider using a battle-tested library like `react-hot-toast` or `sonner` for:
- Stacking multiple toasts
- Swipe-to-dismiss on mobile
- Promise-based toasts (show loading → success/error)
- Undo actions

