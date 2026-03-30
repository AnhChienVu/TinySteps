# Backend Step 5

This step connected the frontend child profile flow to the backend.

Goal:

- stop using mock storage for child profiles
- keep Firebase Auth in the frontend
- call the NestJS backend with a real Firebase ID token
- keep the UI code mostly unchanged

## What was added

### New frontend files

- `apps/frontend/lib/services/backend-client.ts`
- `apps/frontend/.env.example`

### Updated frontend files

- `apps/frontend/lib/services/children-service.ts`
- `apps/frontend/app/(protected)/children/new/page.tsx`

## What changed

### 1. Added a small authenticated backend client

`backend-client.ts`:

- reads `NEXT_PUBLIC_API_BASE_URL`
- gets the current Firebase user
- asks Firebase for an ID token
- sends `Authorization: Bearer <token>` automatically
- turns backend error responses into normal frontend `Error` messages

### 2. Swapped child profile calls from mock data to HTTP

These frontend functions now call the backend:

- `fetchChildrenForUser()`
- `createChildProfile()`
- `updateChildProfile()`
- `deleteChildProfile()`

The rest of the UI still uses the same service function names, so the pages did not need a large rewrite.

### 3. Updated create-child flow to use backend-generated ids

Supabase generates the child `id`, so the frontend no longer creates a fake id with `crypto.randomUUID()`.

Instead:

- submit form
- backend creates the child
- frontend receives the real child object
- frontend stores the returned `child.id` as the active child

## Why this step matters

This is the first full real loop:

- frontend
- Firebase auth token
- NestJS backend
- Supabase
- response back to frontend

That proves the architecture works before moving on to activity data like feedings and sleeps.

## Environment note

The frontend now expects:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

You can place that in:

- `apps/frontend/.env.local`

## What this step proves

After Step 5 works, you have proven that:

- the frontend can call the backend securely
- Firebase Auth can stay as the auth provider
- Supabase can store real app data
- service-layer replacement works without rewriting pages

## Next recommended step

Step 6 should be:

- build the backend `feedings` module
- then wire the frontend feeding log to it

That gives you your first real activity domain end to end.

