# Subtopic Enrollment — API & Frontend Integration Contract

Backend base URL: `/api/v1` (see `frontend/src/services/api.ts`).

> **Temporary doc.** This is a short-term reference for building the enrollment
> UI. Once frontend integration lands, delete this file — the durable API source
> of truth is the generated OpenAPI schema (`/schema/`, `/docs/`).

Enrollment is the **isolation gate** for a learner's experience: a learner only
sees questions, seeds FSRS review items, and sources study sessions for
subtopics they are enrolled in.

**Model:** enrollment is *existence-based*. A learner is enrolled in a subtopic
**iff** they have a `SubtopicMastery` row for it. There is no separate table and
no status field. **Enroll = create the row; unenroll = delete it.**

---

## 1. Data model (read shape)

An enrollment as returned by the API (a projection of `SubtopicMastery`):

```json
{
  "id": "0e9c1c2a-2f1b-4c7a-9c3a-1b2c3d4e5f60",
  "subtopic": "b1f3...",
  "subtopic_name": "Set Operations",
  "topic": "a0c2...",
  "topic_name": "Discrete Math",
  "mastery_state": "NEW",
  "next_review": null
}
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | The `SubtopicMastery` id (use for DELETE / unenroll). |
| `subtopic` / `subtopic_name` | uuid / string | The enrolled subtopic. |
| `topic` / `topic_name` | uuid / string | Parent topic (denormalized for list rendering). |
| `mastery_state` | `NEW \| LEARNING \| REVIEW \| RELEARNING` | FSRS state of the card. |
| `next_review` | ISO 8601 \| null | `null` until the first review is scheduled. |

---

## 2. Endpoints

### `GET /enrollments/`
Returns the authenticated learner's enrollments (staff see all). Array of the
read shape above.

### `POST /enrollments/` — enroll
**Frontend payload mandate — send exactly one field:**

```json
{ "subtopic": "<subtopic_uuid>" }
```

- `201 Created` — a new enrollment was created (the FSRS card is seeded, state `NEW`).
- `200 OK` — already enrolled; idempotent, and existing FSRS state is left
  untouched. Treat 200 and 201 identically.
- `400 Bad Request` — `subtopic` missing or not a real subtopic uuid.
- `401 Unauthorized` — no/invalid token.

Both success codes return the enrollment object (§1).

### `DELETE /enrollments/{id}/` — unenroll
Deletes the learner's `SubtopicMastery` for that subtopic. The subtopic stops
surfacing questions and sessions immediately.

- `204 No Content` — unenrolled.
- `404 Not Found` — no such enrollment for this learner (also what you get trying
  to unenroll someone else's).

> **Note:** unenrolling **discards the FSRS history** for that subtopic.
> Re-enrolling later starts fresh from `NEW`. (There is deliberately no "pause"
> — the team chose the simpler existence model. If pause/resume-with-history is
> ever needed, it's an additive change, not part of this contract.)

### `PATCH` / `PUT /enrollments/{id}/`
**Not supported — `405 Method Not Allowed`.** There is nothing enrollment-specific
to edit (FSRS fields are written only by the scheduling engine).

---

## 3. Effect on existing endpoints

These already-shipped endpoints are now **enrollment-scoped** for learners
(staff are unaffected):

| Endpoint | New behaviour |
|----------|---------------|
| `GET /practice/questions/` | Lists only questions from enrolled subtopics. |
| `GET /practice/questions/{id}/` | `404` if the question's subtopic isn't enrolled. |
| `POST /practice/sessions/` | Due-first **and** fallback questions are drawn only from enrolled subtopics. |
| `POST /practice/sessions/?subtopic=<id>` | `403` if the learner is not enrolled in `<id>`. |
| `POST /practice/sessions/?topic=<id>` | Implicitly limited to enrolled subtopics within that topic. |

**Mandate:** Before starting a session for a specific subtopic, the frontend
must ensure the learner is enrolled (POST `/enrollments/`). A `403` from session
creation means "enroll first", not "retry".

---

## 4. Recommended frontend service (matches existing `src/services` style)

```ts
// src/services/enrollments.ts
import { api, type EntityId } from "./api";

export interface Enrollment {
  id: EntityId;              // SubtopicMastery id — use for unenroll
  subtopic: EntityId;
  subtopic_name: string;
  topic: EntityId;
  topic_name: string;
  mastery_state: "NEW" | "LEARNING" | "REVIEW" | "RELEARNING";
  next_review: string | null;
}

export const enrollmentsService = {
  list: async (): Promise<Enrollment[]> => {
    const res = await api.get("/enrollments/");
    if (!res.ok) throw new Error("Failed to fetch enrollments");
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? [];
  },

  // 200 (already enrolled) and 201 (new) are both success.
  enroll: async (subtopicId: EntityId): Promise<Enrollment> => {
    const res = await api.post("/enrollments/", { subtopic: subtopicId });
    if (!res.ok) throw new Error("Failed to enroll");
    return res.json();
  },

  // Unenroll — discards FSRS history for that subtopic.
  unenroll: async (id: EntityId): Promise<void> => {
    const res = await api.delete(`/enrollments/${id}/`);
    if (!res.ok && res.status !== 204) throw new Error("Failed to unenroll");
  },
};
```

---

## 5. Guarantees the backend provides

- **Data integrity:** one `SubtopicMastery` row per (learner, subtopic)
  (`unique_together`). Enroll is `get_or_create`, so there are never duplicates
  and no separate table can drift out of sync.
- **Idempotency:** repeated `POST /enrollments/` never creates duplicates and
  never resets FSRS history.
- **Strict isolation:** no learner request (list, retrieve, session, fallback)
  can return a question from an un-enrolled subtopic — enforced at the DB query
  layer (`questions_for_learner`), not in the view.
- **FSRS-5 integrity:** enrollment only controls *which* cards exist and are
  surfaced; the FSRS stability/difficulty/interval math is untouched.
