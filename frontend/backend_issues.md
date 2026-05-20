# Backend Issues & Recommended Fixes

> **For the backend team.** These issues were found while auditing the frontend–backend integration.
> Priority: 🔴 Critical (blocks core features) · 🟡 Important · 🟢 Nice-to-have

---

## 🔴 Critical — Blocking Core Features

### 1. No `users/me/` endpoint — BLOCKS: profile, role detection, session restore

**Impact:** This single missing endpoint causes **all** of the following frontend bugs:
- Admin logs in as learner (role unknown)
- Profile pages show no name/email
- XP and streak data can't be fetched
- Session restore after refresh loses user context
- Leaderboard can't identify the current user

The frontend tries `GET /auth/users/me/` after login to fetch the authenticated user's profile. This endpoint doesn't exist. The fallback is to decode the JWT — but the JWT only contains `{ user_id }` (see issue #2).

**File:** `accounts/urls.py` — The endpoint is commented out on line 11:
```python
# path('users/me/', CurrentUserView.as_view()),
```

**Fix:** Uncomment and implement `CurrentUserView`:

```python
# accounts/views.py
class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        # Use a full serializer that includes role info
        return UserDetailSerializer

    def get_object(self):
        return self.request.user
```

The serializer MUST return at minimum:
```json
{
  "id": "uuid",
  "username": "admin",
  "email": "admin@learnlab.com",
  "first_name": "Admin",
  "last_name": "User",
  "is_staff": true,
  "date_joined": "2024-01-01T00:00:00Z"
}
```

---

### 2. JWT token contains NO user info — BLOCKS: role-based routing after login

**Verified payload of a JWT token from `POST /auth/login/`:**
```json
{
  "token_type": "access",
  "exp": 1747739432,
  "iat": 1747735832,
  "jti": "03b0e39d...",
  "user_id": "b6cbc57a-0d34-4a7b-9d90-8271e7485d7c"
}
```

No `role`, `email`, `username`, `is_staff`, `first_name`, or `last_name`. The frontend can only read `user_id` — which is useless for determining role, displaying the user's name, or routing to the correct dashboard.

**Fix:** Customize the token serializer to add user claims:

```python
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = 'admin' if user.is_staff else 'learner'
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['is_staff'] = user.is_staff
        return token
```

And use the custom view in `accounts/urls.py`:
```python
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

path('login/', CustomTokenObtainPairView.as_view()),
```

> **Note:** Implementing issue #1 (`/users/me/`) is the proper long-term fix. This issue (#2) is the quick-win that would unblock role routing immediately after login without an extra API call.

---

### 3. Login response returns ONLY tokens — no user object

**Current response from `POST /auth/login/`:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

Many auth APIs return the user object alongside the tokens so the client doesn't need a second round-trip. The frontend currently has to call `/auth/users/me/` (which doesn't exist — see #1) immediately after login.

**Recommendation:** Override the token view to include user data in the response:
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@learnlab.com",
    "is_staff": true,
    "first_name": "Admin",
    "last_name": ""
  }
}
```

---

### 4. URL Typo: `topcis/` instead of `topics/`

**File:** `learnlab_platform/urls.py` — Line 12

```python
path('topcis/', include('topics.urls')),  # ← typo
```

Should be:

```python
path('topics/', include('topics.urls')),
```

> The frontend currently matches this typo (`/topcis/topics/`), so both sides work. When fixed, coordinate with frontend — we'll update our service URLs at the same time.

---

### 5. Registration serializer drops `first_name` / `last_name`

**File:** `accounts/serializers.py` — Line 10

```python
fields = ['username', 'email', 'password']
```

The frontend sends `first_name` and `last_name` during registration, but DRF silently ignores them.

**Fix:**
```python
fields = ['username', 'email', 'password', 'first_name', 'last_name']
```

---

### 6. Login uses `username` but UX expects email

**File:** `accounts/models.py` — `USERNAME_FIELD = 'username'`

SimpleJWT's `TokenObtainPairView` expects `{ username, password }`. The frontend has been updated to send `username`, but for a better UX, users should be able to log in with their email.

**Recommendation:** Either:
- **(A)** Change `USERNAME_FIELD = 'email'` and add `unique=True` to email (preferred), OR
- **(B)** Add a custom serializer that resolves email → username before authenticating

The frontend login form now sends `username` directly and the test accounts use usernames, so this is no longer a blocker — just a UX improvement.

---

## 🟡 Important

### 7. No leaderboard endpoint

The frontend calls `GET /practice/learners/` and `GET /practice/learners/leaderboard/`. Neither exists in `practice/urls.py`.

**Recommendation:** Add learner profile and leaderboard endpoints returning:
```json
[{
  "id": 1,
  "user": { "id": 1, "username": "...", "first_name": "...", "last_name": "..." },
  "total_xp": 1500,
  "streak_count": 7
}]
```

---

### 8. No analytics app/endpoints

The frontend expects:
- `GET /analytics/aggregated/` → `{ review_count, active_users, ... }`
- `GET /analytics/topics/<id>/` → topic-level analytics

Neither endpoint exists. The frontend gracefully returns `null` when these are missing.

---

### 9. Practice sessions endpoint returns 500 on empty DB

`GET /practice/sessions/` should return `[]` for empty querysets, not 500.

---

### 10. No password reset / forgot password endpoints

The frontend has a `ForgotPasswordPage` expecting `POST /auth/password-reset/`. No such endpoint exists.

---

### 11. No profile update endpoint

Both `AdminProfilePage` and `LearnerProfilePage` try to `PATCH /auth/users/me/` to update name/email. Depends on issue #1 being implemented with `RetrieveUpdateAPIView`.

---

### 12. Question write endpoints (POST/PUT/DELETE) not enabled

The `QuestionsViewSet` only supports `list` and `retrieve`. The frontend has full CRUD UI but writes return 405 Method Not Allowed.

**Fix:** Enable `create`, `update`, `partial_update`, `destroy` on the viewset.

---

## 🟢 Nice-to-Have

### 13. Topic mastery endpoint returns 500

`GET /topcis/mastery/` returns 500. Frontend catches this and returns an empty array.

**Fix:** Handle empty data gracefully (return `[]`).

### 14. CORS: Consider allowing additional dev ports

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',  # common alternative
]
```

Or use `CORS_ALLOW_ALL_ORIGINS = True` in development.
