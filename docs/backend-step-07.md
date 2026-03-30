# Backend Step 7

This step adds the next activity module: `sleeps`.

Goal:

- reuse the same child-scoped module pattern from feedings
- protect sleep routes with Firebase auth
- verify the user can access the child
- store sleep logs in Supabase
- return the exact shape the frontend already uses

## What was added

### New backend files

- `apps/backend/src/sleeps/sleeps.module.ts`
- `apps/backend/src/sleeps/sleeps.controller.ts`
- `apps/backend/src/sleeps/sleeps.service.ts`
- `apps/backend/src/sleeps/dto/create-sleep.dto.ts`

### Updated files

- `apps/backend/src/app.module.ts`
- `apps/backend/requests.http`
- `apps/frontend/lib/services/children-service.ts`

## Endpoints added

These routes are protected:

- `GET /api/children/:childId/sleeps`
- `POST /api/children/:childId/sleeps`

## Why this step is useful

The sleep page is already built in the frontend.

So once the backend endpoints exist and the frontend service is switched over, several screens improve at once:

- sleep logging page
- dashboard
- stats page
- AI chat summary

That gives you a good payoff from one backend feature.

## What the backend service does

`SleepsService`:

- checks child access using `ChildrenService`
- reads sleep rows from the `sleeps` table
- inserts new sleep rows into Supabase
- maps DB columns into frontend-friendly fields

DB columns:

- `child_id`
- `logged_by_firebase_uid`
- `start_time`
- `end_time`
- `notes`

Frontend shape:

```json
{
  "id": "...",
  "childId": "...",
  "startTime": "2026-03-29T20:15:00.000Z",
  "endTime": "2026-03-29T21:05:00.000Z",
  "notes": "Short evening nap",
  "loggedBy": "firebaseUid"
}
```

## Frontend wiring

The frontend `children-service.ts` now:

- creates sleep logs through the backend
- subscribes to backend sleep data for the active child
- refreshes subscribers after a new sleep log is created

That means the existing UI did not need a large page rewrite.

## How to test Step 7

Use `apps/backend/requests.http`.

### 1. List sleeps

```bash
curl http://localhost:3001/api/children/CHILD_ID/sleeps \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

### 2. Create a sleep log

```bash
curl http://localhost:3001/api/children/CHILD_ID/sleeps \
  -X POST \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-03-29T20:15:00.000Z",
    "endTime": "2026-03-29T21:05:00.000Z",
    "notes": "Short evening nap"
  }'
```

## What this step proves

After Step 7 works, you have proven that the backend pattern is reusable across activity modules:

- child-scoped route
- Firebase guard
- permission check through `ChildrenService`
- Supabase persistence
- lightweight frontend service swap

## Next recommended step

Step 8 should be either:

- `diapers`, because it is structurally simple
- or a shared backend pattern for child activities, if you want to refactor before adding more modules
