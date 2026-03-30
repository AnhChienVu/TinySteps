# Backend Step 8

This step adds the `diapers` activity module.

Goal:

- reuse the same child-scoped backend pattern again
- protect diaper routes with Firebase auth
- verify child access with `ChildrenService`
- store diaper logs in Supabase
- wire the existing diaper frontend page to real backend data

## What was added

### New backend files

- `apps/backend/src/diapers/diapers.module.ts`
- `apps/backend/src/diapers/diapers.controller.ts`
- `apps/backend/src/diapers/diapers.service.ts`
- `apps/backend/src/diapers/dto/create-diaper.dto.ts`

### Updated files

- `apps/backend/src/app.module.ts`
- `apps/backend/requests.http`
- `apps/frontend/lib/services/children-service.ts`

## Endpoints added

These routes are protected:

- `GET /api/children/:childId/diapers`
- `POST /api/children/:childId/diapers`

## Backend flow

`DiapersService`:

- checks whether the signed-in user can access the child
- lists diaper rows from Supabase
- creates new diaper rows in Supabase
- maps database fields into the frontend shape

Database columns:

- `child_id`
- `logged_by_firebase_uid`
- `occurred_at`
- `type`
- `notes`

Frontend shape:

```json
{
  "id": "...",
  "childId": "...",
  "timestamp": "2026-03-29T16:40:00.000Z",
  "type": "wet",
  "notes": "Quick change after feeding",
  "loggedBy": "firebaseUid"
}
```

## Frontend wiring

The frontend diaper flow already used the shared `children-service.ts`.

So this step only needed the service swap:

- `createDiaperLog()` now posts to the backend
- `subscribeToDiapers()` now reads from the backend
- subscribers refresh after a new diaper log is created

That means the following screens now get real diaper data:

- diaper page
- dashboard
- AI chat

## How to test Step 8

Use `apps/backend/requests.http`.

### 1. List diaper logs

```bash
curl http://localhost:3001/api/children/CHILD_ID/diapers \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

### 2. Create a diaper log

```bash
curl http://localhost:3001/api/children/CHILD_ID/diapers \
  -X POST \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-03-29T16:40:00.000Z",
    "type": "wet",
    "notes": "Quick change after feeding"
  }'
```

## What this step proves

After Step 8 works, you have three activity domains using the same backend pattern:

- feedings
- sleeps
- diapers

That is a strong sign the architecture is holding up well.

## Next recommended step

Step 9 should be `health`, because it completes the core activity set already shown in the frontend.
