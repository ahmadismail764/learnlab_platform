# Arabic Translation UX Audit

Date: 2026-06-21  
Scope: `frontend/src/locales/ar/*.json` plus hardcoded frontend copy that can bypass i18n  
Intent: focused Arabic UX fixes before the larger translation pass. This is not a full copy rewrite.

## Summary

The Arabic locale files are mostly complete and technically understandable. This pass fixed the most visible learner-facing issues: wordy practice feedback, literal backend/product translations, inconsistent leaderboard wording, several discrete-math topic names, and compact UI labels that read awkwardly in Arabic.

The remaining full translation pass should focus on:

1. Full style consistency across all Arabic keys.
2. Arabic pluralization for count-bearing labels.
3. Validation and service-level messages that can still surface in English.
4. Button/register consistency: noun labels vs imperative verbs.
5. Visual QA in RTL to catch strings that are still too long in their actual containers.

## Applied In This Pass

- Practice feedback: `إجابة خاطئة`, `إجابة صحيحة. أُضيفت النقاط.`, and shorter smart-review guidance.
- FSRS learner copy: changed most learner-facing mentions to `المراجعة الذكية`; kept `(FSRS)` only in admin metrics where the technical name is useful.
- Leaderboard: standardized on `لوحة الصدارة`.
- Auth/profile copy: removed backend/internal wording, kept the LearnLab brand, and fixed the accidental Markdown email placeholder.
- English locale parity: removed the same backend/Django/CRUD wording from matching English auth/admin/common messages so the default locale does not leak implementation details either.
- Topic terminology: corrected `الرياضيات المنفصلة`, `مبدأ الأدراج`, `المكمّمات`, `قابلية القسمة`, and `مجموعة القوى`.
- Compact labels: shortened XP labels to `نقاط`, changed `قابلية الاسترجاع` to `سهولة الاسترجاع` in learner-facing copy, and normalized several `لاحقًا`/`نهائيًا` forms.

## Technical Terminology Glossary Needed

These terms should be decided once, then applied everywhere:

| Concept | Current Variants / Risk | Recommended Direction |
| --- | --- | --- |
| FSRS | Technical product term can confuse learners when repeated raw. | For learner UI: `المراجعة الذكية`. For admin/technical views: keep `FSRS` with a clear Arabic descriptor. |
| Spaced repetition | Accurate as `التكرار المتباعد`, but can sound mechanical in UI copy. | Prefer `المراجعة الذكية` in learner copy; use technical phrasing only where needed. |
| Mastery | `الإتقان` is consistent and acceptable. | Keep, but use shorter labels in cards: `الإتقان`, `إتقان عام`, `إتقان الموضوعات`. |
| Retention | `الاحتفاظ بالمعلومات` is accurate but too long in compact cards. | Use `الاحتفاظ` for short labels; consider `ثبات التذكر` where the metric is about memory stability. |
| Speed / stability | `speed` is rendered as `الثبات` in admin/learner copy. | Verify backend meaning. If it is FSRS stability, use `الثبات`. If it is speed/response speed, use `سرعة الاستجابة`. |
| Memory / retrievability | `سهولة الاسترجاع` now appears in learner copy. | Keep for learner-facing hints. Use more technical phrasing only if an admin metric requires it. |
| XP | `نقاط الخبرة` is clear but long. | Use `نقاط` in compact UI if context is clear. |
| Leaderboard | Multiple labels caused drift. | Use `لوحة الصدارة`. |
| Backend | Backend/internal wording should not appear in learner-facing copy. | Use `الخادم`, `النظام`, or remove entirely depending on context. |

## Topic Name Accuracy

Applied corrections:

- `topics.discreteMath`: `الرياضيات المنفصلة`
- `topics.combinatorics.pigeonhole`: `مبدأ الأدراج`
- `topics.logic.quantifiers`: `المكمّمات`
- `topics.sets.powerSets`: `مجموعة القوى`
- `topics.numberTheory.divisibility`: `قابلية القسمة`

Remaining terminology decision:

- Graph theory currently uses `الرسوم البيانية`. This is acceptable, but can be confused with charts. If the course prefers a stricter academic register, consider switching graph-theory labels to `المخططات`.

## Wordiness And UX Tightening

Remaining strings that are understandable but may still be too long for their actual UI containers:

- `admin.adminNoteDescription`
- `admin.insufficientDataDescription`
- `auth.adminSignupNotice`

Recommended style:

- Prefer one short sentence in cards and toasts.
- Put the user action first.
- Remove implementation details like backend/API unless the page is explicitly admin/developer-facing.
- Avoid repeating `التكرار المتباعد` in every nearby sentence; define it once or use the learner-friendly term.

## Grammar And Register Notes

- Continue normalizing tanween spelling: prefer `لاحقًا`, `نهائيًا`, `جدًا`, `موضوعًا` over mixed forms like `لاحقاً`, `نهائياً`, `جداً`, `موضوعاً`.
- For buttons, choose one style:
  - Noun-command style: `إغلاق`, `متابعة`, `حذف`, `تعديل`, `حفظ`.
  - Verb-command style: `أغلِق`, `تابِع`, `احذف`, `عدّل`, `احفظ`.
  Current files mix both.
- Count-bearing labels still need true Arabic pluralization in a later pass.

## Remaining Hardcoded Or Semi-Hardcoded English Risk

These should be checked during the full translation pass:

- `src/validation/authSchemas.ts`
  - Zod messages such as `Please enter a valid email address`.
- `src/services/auth.ts` and API services
  - English normalized error messages can leak into toasts/forms.
- Admin modal fallbacks:
  - `Question created successfully.`
  - `Question updated successfully.`
  - `Question deleted successfully.`

## Recommended Translation Pass Order

1. Move remaining hardcoded user-facing English into locale keys.
2. Lock the glossary above, especially graph-theory terminology and pluralization style.
3. Do RTL visual QA on practice, progress, leaderboard, admin analytics, and auth screens.
4. Rewrite any strings that still overflow or feel too literal in their real containers.
5. Run `bun run i18n:check`, `bun run i18n:prune:check`, lint, tests, and build.
