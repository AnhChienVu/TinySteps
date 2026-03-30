# Backend Step 3

This step connects the NestJS backend to Supabase.

Goal:

- add a dedicated Supabase module
- keep database access separate from Firebase auth
- prove the backend can reach your Supabase database before building real resource modules

## What was added

### Backend dependency

- `@supabase/supabase-js`

This is the official JavaScript client for Supabase.

In this backend, we use it with the service role key because the Nest server is trusted code.

## New backend files

- `apps/backend/src/supabase/supabase.module.ts`
- `apps/backend/src/supabase/supabase.service.ts`
- `apps/backend/src/supabase/supabase.controller.ts`

## Updated files

- `apps/backend/src/app.module.ts`
- `apps/backend/package.json`
- `apps/backend/.env.example`

## Important security cleanup

I also removed what looked like real Firebase Admin credentials from:

- `apps/backend/.env.example`

`.env.example` should only contain placeholders, never real secrets.

## What each new file does

### `supabase.service.ts`

This is the database entry point for the backend.

It:

1. reads:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. creates a server-side Supabase client
3. exposes:
   - `getAdminClient()`
   - `checkConnection()`

The service uses the service role key because:

- the backend is trusted
- the frontend will not connect to Supabase directly
- the backend will enforce authorization rules itself

### `supabase.controller.ts`

This adds a simple database connectivity endpoint:

- `GET /api/database/health`

It runs a tiny query against `app_users` and returns:

- whether the connection works
- the current row count
- a timestamp

This is a teaching-friendly endpoint because it proves the backend can talk to the database before you add business logic.

### `supabase.module.ts`

This groups the database pieces into their own Nest module.

That keeps auth and database concerns separate:

- `AuthModule` handles Firebase token verification
- `SupabaseModule` handles database access

This separation is very common in real backend codebases.

## Why this is the right Step 3

After Step 2, the backend could trust who the user is.

Now Step 3 proves the backend can also reach the real database.

That gives you the two core building blocks you need before resource modules:

1. authentication
2. persistence

## Environment setup you need

Make sure `apps/backend/.env` now includes:

```env
PORT=3001

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

For this step:

- Firebase values are still needed because `AuthModule` is loaded
- Supabase values are now also required because `SupabaseModule` is loaded

## How to get the Supabase values

In Supabase dashboard:

1. open your project
2. go to `Project Settings`
3. open `API`
4. copy:
   - Project URL -> `SUPABASE_URL`
   - service role key -> `SUPABASE_SERVICE_ROLE_KEY`

Important:

- never put the service role key in the frontend
- backend only

## How to test Step 3

### 1. Start the backend

From repo root:

```bash
npm install
npm run dev:backend
```

### 2. Call the database health endpoint

```bash
curl http://localhost:3001/api/database/health
```

Expected shape:

```json
{
  "status": "ok",
  "database": "supabase",
  "connected": true,
  "appUsersCount": 0,
  "timestamp": "..."
}
```

If the migration already ran and you have rows later, `appUsersCount` may be greater than `0`.

## What this step proves

After Step 3 works, you have verified:

- NestJS can boot with config
- Firebase auth integration exists
- Supabase database connection works
- the backend is ready for real modules

## Next recommended step

Step 4 should be the first real resource module:

- `children`

That is the best next module because it is the root of most app data:

- dashboard depends on it
- activity logs depend on it
- invites depend on it
