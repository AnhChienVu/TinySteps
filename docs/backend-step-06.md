# Backend Step 6

This step adds the first real activity module: `feedings`.

Goal:

- create a dedicated NestJS feature module for feeding logs
- protect it with Firebase auth
- verify the user can access the child
- persist feedings in Supabase
- return data in the same shape the frontend already expects

## What was added

### New backend files

- `apps/backend/src/feedings/feedings.module.ts`
- `apps/backend/src/feedings/feedings.controller.ts`
- `apps/backend/src/feedings/feedings.service.ts`
- `apps/backend/src/feedings/dto/create-feeding.dto.ts`

### Updated backend files

- `apps/backend/src/app.module.ts`
- `apps/backend/requests.http`

## Endpoints added

These routes are protected by the Firebase auth guard:

- `GET /api/children/:childId/feedings`
- `POST /api/children/:childId/feedings`

## Why the routes are nested under children

Feeding logs always belong to one child.

So instead of:

- `/api/feedings`

we use:

- `/api/children/:childId/feedings`

That makes the ownership and permission check much clearer.

## What each file does

### `create-feeding.dto.ts`

This validates the request body for creating a feeding.

It accepts:

- `timestamp`
- `type`
- `amount`
- `unit`
- `notes`

The backend ignores any fake `id` or `loggedBy` values from the frontend, because those should be controlled by the server.

### `feedings.controller.ts`

This defines the API routes for listing and creating feeding logs.

Its job is only to:

- receive input
- read `childId`
- get the authenticated Firebase user
- pass work to the service

### `feedings.service.ts`

This contains the real logic:

- confirm the signed-in user can access the child
- insert feeding rows into Supabase
- list feeding rows from Supabase
- map database columns into the frontend shape

The service uses `ChildrenService` for access checking so that permission rules stay consistent across modules.

## Database mapping

Supabase table:

- `feedings`

Columns:

- `child_id`
- `logged_by_firebase_uid`
- `occurred_at`
- `type`
- `amount`
- `unit`
- `notes`

Frontend response shape:

```json
{
  "id": "...",
  "childId": "...",
  "timestamp": "2026-03-29T14:30:00.000Z",
  "type": "bottle",
  "amount": 120,
  "unit": "ml",
  "notes": "Finished the full bottle calmly.",
  "loggedBy": "firebaseUid"
}
```

So the backend is doing a small translation layer:

- `child_id` -> `childId`
- `occurred_at` -> `timestamp`
- `logged_by_firebase_uid` -> `loggedBy`

## How to test Step 6

Use `apps/backend/requests.http` or curl.

### 1. List feedings for a child

```bash
curl http://localhost:3001/api/children/CHILD_ID/feedings \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

### 2. Create a feeding

```bash
curl http://localhost:3001/api/children/CHILD_ID/feedings \
  -X POST \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-03-29T14:30:00.000Z",
    "type": "bottle",
    "amount": 120,
    "unit": "ml",
    "notes": "Finished the full bottle calmly."
  }'
```

## What this step proves

After Step 6 works, you have proven that:

- one child-scoped activity module can be built cleanly
- permissions can be reused from another module
- backend responses can stay friendly to the current frontend
- Supabase activity storage works for a real domain

## Next recommended step

Step 7 should be:

- connect the frontend feeding service to these new endpoints

Once that works, the dashboard and stats pages can start using real backend feeding data too.
