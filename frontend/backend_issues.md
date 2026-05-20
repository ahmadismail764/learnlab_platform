# Backend Issues & Suggestions

> **For the backend team.** This document tracks unresolved issues, architectural suggestions, and security improvements for the LearnLab Django backend, as identified by the frontend engineering team.
> All 14 previous critical integration blockers have been **successfully resolved**!

---

## 🟢 Newly Identified Suggestions & Improvements

### 1. Coordinated Renaming of `/topcis/` Typo (Tech Debt)
- **Status:** Active Fallback
- **Description:** The backend currently mounts topics under `/topcis/` due to an early typo, but also supports `/topics/` as a fallback. The frontend service files currently use the `/topcis/` path to guarantee compatibility.
- **Recommendation:** Coordinate a clean rename in the Django URL configuration to drop `/topcis/` entirely, and simultaneously update the frontend service files (`topics.ts`, `analytics.ts`, etc.) to use `/topics/`.

### 2. Cryptographic Signing Key Length Warning (Security)
- **Status:** Active Warning
- **Description:** The Django dev server logs a security warning from SimpleJWT during startup:
  `InsecureKeyLengthWarning: The key length (16 bytes) is insecure...`
  This is caused by a short signing key defined in `.env` / `settings.py`.
- **Recommendation:** In both dev and production settings, ensure the `SIGNING_KEY` (or `SECRET_KEY` if used as signing key) is a cryptographically strong string of at least 256 bits (32 bytes).

### 3. User Avatar/Profile Decorators in User Serializer (UX Improvement)
- **Status:** Suggestion
- **Description:** Profile dashboards and headers display learner/admin initials and placeholder avatars. To provide a modern, polished look, it would be beneficial to return decorative fields from the profile endpoints.
- **Recommendation:** Update the user detail serializer (`/auth/users/me/` and `/auth/login/`) to include:
  - `initials`: pre-computed string of the user's first and last name (e.g. `"JD"`).
  - `avatar_color`: a stable HSL or hex color code generated from the user's ID or username (e.g., `"#3B82F6"`), allowing the client to render beautiful custom avatar badges instantly.

### 4. Practice Session Completion XP Awarding Bug (Critical Bug)
- **Status:** Active Critical Bug
- **Description:** The backend currently does not credit the learner's `current_xp` when they complete a practice session. This is because the XP calculations, user XP additions, and practice streak updates are only implemented inside the `create()` method of `PracticeSessionCreateSerializer`. However, the frontend creates a practice session *before* starting queries (submitting `{ "responses": [] }`), leading to `0` XP initially. When the frontend completes the session, it submits a `PATCH /practice/sessions/<id>/` request to update `total_xp_earned` and `end_time` (handled by `PracticeSessionSerializer`). Because `PracticeSessionSerializer` is a standard `ModelSerializer` without custom update behavior, the user's profile `current_xp` is never increased.
- **Recommendation:** Modify `PracticeSessionSerializer.update` (or the viewset's `perform_update`) in `backend/practice/serializers.py` to credit the user's `current_xp` and update their streak when a session is finalized. For example:
  ```python
  class PracticeSessionSerializer(serializers.ModelSerializer):
      learner = UserDetailSerializer(read_only=True)
      responses = QuestionResponseSerializer(many=True, read_only=True)

      class Meta:
          model = PracticeSession
          fields = ['id', 'learner', 'start_time', 'end_time', 'total_xp_earned', 'responses']

      def update(self, instance, validated_data):
          # Track if the session is being marked completed in this update
          already_completed = instance.end_time is not None
          total_xp_earned = validated_data.get('total_xp_earned', instance.total_xp_earned)
          
          # Perform the standard model update
          instance = super().update(instance, validated_data)
          
          # If the session is now completed, award XP to the learner once
          if instance.end_time is not None and not already_completed:
              learner = instance.learner
              # Add total XP earned in this session to user profile
              learner.current_xp += total_xp_earned
              
              # Standard streak updates
              from django.utils import timezone as django_timezone
              today = django_timezone.localdate()
              if learner.last_practice_date is None:
                  learner.streak_count = 1
              elif learner.last_practice_date == today - django_timezone.timedelta(days=1):
                  learner.streak_count += 1
              elif learner.last_practice_date < today - django_timezone.timedelta(days=1):
                  learner.streak_count = 1
                  
              learner.last_practice_date = today
              learner.save()
              
          return instance
  ```

### 5. Add High-Value Analytics Telemetry Endpoints (Performance + Charts)
- **Status:** Suggestion
- **Context:** The frontend admin analytics dashboard currently relies on:
  - `GET /analytics/aggregated/` (overview cards)
  - `GET /analytics/topics/<topic_id>/` (single-topic drilldown)
  For richer charts, the UI currently uses local mock arrays (weekly activity, difficulty breakdown, per-topic performance) because the backend does not yet expose bulk/time-series breakdown endpoints.
- **Recommendation:** Add the following endpoints to support charts efficiently and avoid N+1 requests:

  **A) `GET /analytics/topics/` (bulk)**
  - Returns per-topic analytics in one request for the “Topic Performance” section.
  - Suggested response shape:
    ```json
    {
      "results": [
        {
          "topic_id": "uuid",
          "topic_name": "Logic",
          "metrics": {
            "avg_speed": 12.3,
            "avg_difficulty": 6.1,
            "estimated_retention": 0.86,
            "learner_count": 120
          },
          "distribution": { "low_speed": 10, "medium_speed": 70, "high_speed": 40 }
        }
      ]
    }
    ```
  - Optional query params: `?topic_ids=<uuid,uuid>` and/or `?include=distribution`.

  **B) `GET /analytics/activity/` (historical time-series)**
  - Returns daily/weekly aggregates for charts (active learners, questions answered, review events).
  - Suggested query params: `?start=YYYY-MM-DD&end=YYYY-MM-DD` or `?period=7d|30d|90d`.
  - Suggested response shape:
    ```json
    {
      "bucket": "day",
      "results": [
        { "date": "2026-05-01", "active_learners": 420, "questions_answered": 2100 }
      ]
    }
    ```

  **C) `GET /analytics/difficulty/` (difficulty tier breakdown)**
  - Returns attempts + accuracy broken down by difficulty tiers (1/2/3) for curriculum insights.
  - Suggested response shape:
    ```json
    {
      "tiers": {
        "1": { "attempts": 18500, "accuracy": 0.85 },
        "2": { "attempts": 17200, "accuracy": 0.68 },
        "3": { "attempts": 9620,  "accuracy": 0.52 }
      }
    }
    ```

> [!NOTE]
> The frontend can continue using `GET /analytics/aggregated/` and `GET /analytics/topics/<topic_id>/` as-is; the above endpoints are additive and primarily target performance (bulk fetch) and chart completeness (time-series + difficulty breakdown).

### 6. Missing Practice Response Submission Endpoint (`POST /practice/responses/`) (Critical Integration)
- **Status:** Active Integration Gap
- **Context:** The learner practice flow currently:
  1) creates a session with an empty `responses: []` payload (`POST /practice/sessions/`), then
  2) submits each answer as an interaction via `POST /practice/responses/`.
  
  The backend already has a `QuestionResponse` model and serializers, but there is **no route** exposing `POST /practice/responses/` (or an equivalent nested endpoint). This means practice answers are not persisted, FSRS mastery updates are not triggered, and analytics (e.g. `review_count`) can remain near-zero even after practice.
- **Recommendation (one of):**
  - Add `QuestionResponseViewSet` under `/practice/responses/` (create-only is sufficient initially) that validates ownership (session belongs to the authenticated learner) and writes `QuestionResponse` rows.
  - OR add a nested action like `POST /practice/sessions/<id>/responses/`.
  - In either case, trigger the FSRS update (`process_review`) and XP/streak changes at the appropriate moment (per-response or on finalization) to keep learner progress consistent.

### 7. Add Adaptive Session Generation Endpoint (`GET /practice/sessions/generate-adaptive/`) (Quality + Personalization)
- **Status:** Suggestion
- **Context:** The frontend calls `GET /practice/sessions/generate-adaptive/` to start an FSRS-driven session. When missing, the UI falls back to selecting the first 10 questions from the question bank (non-adaptive).
- **Recommendation:** Provide an endpoint that returns the next recommended question set for the learner (due items first / lowest retrievability), e.g.:
  ```json
  { "questions": [/* QuestionSerializer rows */], "message": "Generated adaptive session" }
  ```

### 8. Topics Curriculum Metadata Used by Admin UI (`parent_module`, `question_count`) (Admin UX)
- **Status:** Suggestion
- **Context:** The admin curriculum UI groups topics by `parent_module` and shows a `question_count` per topic. The backend `Topic` model/serializer currently returns only `id`, `name`, `description`, so the UI defaults to `Uncategorized` and `0` questions.
- **Recommendation:**
  - Add a `parent_module` field to `Topic` (or introduce a first-class `Module` model) and include it in the topic serializer.
  - Add a `question_count` computed field on the topic serializer (counting `Question` rows via `subtopic__topic`).

---

## 🎉 Recently Resolved Integration Issues
All previous integration milestones have been successfully completed:
1. **Uncommented and implemented** `/auth/users/me/` RetrieveUpdateAPIView.
2. **Added user claims** to the SimpleJWT access token payload.
3. **Included full user profile object** in the `POST /auth/login/` token response.
4. **Resolved registration serializer issues** to correctly persist `first_name` and `last_name`.
5. **Enabled email-based login** alongside case-insensitive username checks.
6. **Created real leaderboard endpoint** at `/practice/learners/leaderboard/`.
7. **Created real aggregated and topic-specific analytics** under `/analytics/`.
8. **Fixed database migration exceptions** and empty practice session 500 errors.
9. **Added mock-supported forgot password workflows** console logging.
10. **Enabled full questions CRUD (POST, PUT, DELETE)** by expanding the Django questions viewset.
11. **Configured CORS origins** correctly for all standard local dev ports.
