# 🚀 Backend Updates: FSRS Spaced Repetition Integration

**Attention Frontend Team:** The backend has undergone a major architectural update to implement mathematically optimized spaced repetition using the FSRS algorithm. The core conceptual shift is that **Mastery is now tracked at the Topic level**, not the individual Question level.

Here is exactly what changed, how the new logic works, and the updated API contracts.

---

## 1. Database & Model Changes (`TopicMastery`)

We updated the `TopicMastery` model in the `questions` app to act as an FSRS "Card".
If you are building an Admin Dashboard or a Student Profile UI, note that `TopicMastery` now tracks the following physical database fields:

- `state` (Integer)
- `difficulty` (Float)
- `stability` (Float)
- `reps` (Integer: total times studied)
- `lapses` (Integer: times failed)
- `last_review_date` (DateTime)
- `next_review_date` (DateTime: Crucial for knowing when a topic is due)

---

## 2. API Update: Generating Adaptive Sheets

The backend no longer serves completely random questions. The practice sheet generator now prioritizes topics that the FSRS engine determines the student is about to forget.

- **Endpoint:** `GET /api/v1/sessions/generate-adaptive/`
- **Auth:** Bearer Token required.
- **Logic Flow:**
  1. Queries the database for up to 5 Topics where `next_review_date` is today or earlier.
  2. If fewer than 5 topics are due, it fills the remaining slots with brand-new topics the student has never interacted with.
  3. Selects 1 random Question from each of those chosen topics.

**Expected Response (200 OK):**

```json
{
  "status": "success",
  "sheet_size": 5,
  "questions": [
    {
      "id": 1,
      "topic": 4,
      "tier": 1,
      "text": "What is a power set?",
      "choices": ["Option A", "Option B", "Option C"],
      "correct_answer_index": 0
    }
    // ... up to 5 questions
  ]
}
```

---

## 3. API Update: Submitting Practice Sessions

The submission logic was heavily optimized. Instead of updating the database per individual question, the backend now aggregates the student's performance and runs the FSRS math **once per topic**.

- **Endpoint:** `POST /api/v1/sessions/`
- **Auth:** Bearer Token required.
- **Important Mapping Requirement:** When building the UI, you MUST map the user's feedback (or their correctness) to the exact 1-4 FSRS integer scale:
  - `1` = Again (Incorrect answer)
  - `2` = Hard (Correct, but low confidence / long time spent)
  - `3` = Good (Correct, normal effort)
  - `4` = Easy (Correct, high confidence / fast answer)

**Expected Request Payload:**

```json
{
  "interactions": [
    {
      "question": 1,
      "user_response": "0",
      "confidence_rating": 4,
      "time_spent": 15
    },
    {
      "question": 2,
      "user_response": "2",
      "confidence_rating": 1,
      "time_spent": 45
    }
  ]
}
```

**What the Backend Does on Submission:**

1. Grades the `user_response` against the `correct_answer_index`.
2. Groups all interactions by `topic_id`.
3. Averages the `confidence_rating` for each topic.
4. Feeds that average rating into the FSRS mathematical engine to calculate the new `stability`, `difficulty`, and `next_review_date`.
5. Updates the student's global XP and streak count.

---

## 4. Testing & Dummy Data

To help you build the UI immediately without waiting for real curriculum entry, the database has been seeded with test data.

- **Dummy User:** `teststudent` (Password: `testpass123`)
- **Test Subjects:** The database contains 12 active dummy questions spread across two subjects: **Discrete Mathematics** and **Python Basics**.
- **Tiers:** Questions are distributed across Tier 1 (Concept), Tier 2 (Application), and Tier 3 (Synthesis).
- Use the Postman collection in the repository to generate a token for this dummy user to test the endpoints.
