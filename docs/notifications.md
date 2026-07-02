# Notifications — review reminders (email)

Learners get an email digest of the subtopic reviews they have **due**, so they
come back and practise before the memory fades. This is the "push" layer on top
of the FSRS review forecast: the forecast *shows* upcoming reviews inside the app,
this *reaches* the learner when the app is closed.

It is intentionally split into two independent pieces:

1. **A scheduled job** — the `send_review_reminders` management command — which
   scans FSRS scheduling state and decides who to email.
2. **A delivery channel** — email — which is just the sender the job calls.

A future channel (e.g. web push) is a second sender in the same loop; it does not
need a second scheduler.

## What counts as "due"

A learner has a review due when one of their `SubtopicMastery` rows has
`next_review <= now`. That is the exact same definition the in-app forecast uses
(`practice.fsrs_engine.get_review_forecast`'s `due_now`), so the email and the app
never disagree. Brand-new, never-reviewed subtopics (`next_review = NULL`) are
ignored.

## Running it

```bash
# Real run — respects opt-out and once-per-day dedup:
python manage.py send_review_reminders

# See who WOULD be emailed; sends nothing, writes no logs:
python manage.py send_review_reminders --dry-run

# Ignore the once-per-day log (useful for a live demo):
python manage.py send_review_reminders --force

# Restrict to one learner by email (test delivery):
python manage.py send_review_reminders --only someone@example.com
```

In Docker: `docker compose exec backend uv run python manage.py send_review_reminders`.

In development, `EMAIL_BACKEND` defaults to the console backend, so the email is
printed to the backend's stdout instead of actually being sent — you can watch it
work without configuring SMTP.

## Scheduling (cron)

The command is the unit of work; run it on whatever schedule you like. A daily
morning run is a sensible default:

```cron
# Every day at 08:00 (server time) — one digest per learner per day.
0 8 * * *  cd /app && uv run python manage.py send_review_reminders >> /var/log/reminders.log 2>&1
```

The command is **idempotent per UTC day** (see below), so running it more than
once a day is safe — extra runs simply send nothing.

> We deliberately use cron + a management command rather than a task queue
> (Celery/Beat). The workload is "run one query once a day and send some mail",
> which cron handles with no broker, no workers, and nothing extra to keep alive —
> the whole thing is one command you can run by hand and watch.

If you later want this wired into `docker-compose`, add a small scheduler service
that runs cron (or a `while sleep` loop) and calls the command; it shares the
backend image and needs the same `.env`.

## Configuration

**SMTP (production)** — set these in `backend/.env` (see `.env.example`):

```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
DEFAULT_FROM_EMAIL=LearnLab <noreply@yourdomain.com>
FRONTEND_URL=https://your-frontend  # used for the "Review now" link
```

**Opt-out (per learner)** — reminders are **on by default**. A learner opts out by
setting the `email_reminders` preference to `false` (via
`PATCH /auth/users/me/preferences/` with `{"preferences": {"email_reminders": false}}`).
The command skips anyone whose `email_reminders` preference is exactly `false`.

## Idempotency

Every send is recorded in a `NotificationLog` row keyed by
`(user, kind, channel, sent_date)` with a unique constraint. Before sending, the
command checks whether a row already exists for today; if so it skips (unless
`--force`). This is what makes an hourly cron — or a retried run — safe: a learner
gets at most one review reminder per day.

## Timezone caveat (v1)

Everything is UTC (`settings.TIME_ZONE = 'UTC'`, no per-user timezone yet), so
"due today" and the once-per-day key are UTC days, and a cron `0 8 * * *` sends at
08:00 *server* time for everyone. Per-user send times / timezones are a natural
follow-up once a `timezone` field exists on the user.

## Tests

```bash
python manage.py test notifications
```

Covers the digest builder and the command: who gets emailed, opt-out, once-per-day
idempotency, `--force`, `--dry-run`, and `--only`.
