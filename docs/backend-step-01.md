# Backend Step 1

This step creates the backend skeleton only.

Goal:

- add a real NestJS app under `apps/backend`
- keep frontend untouched
- make the backend easy to understand before adding auth or database logic

## Current structure

```txt
tinysteps/
  apps/
    frontend/
    backend/
  packages/
    shared/
  supabase/
  docs/
```

## What was added

### Root workspace

- `package.json`
- `.gitignore`
- `tsconfig.base.json`

This makes the repo behave like a monorepo instead of a single frontend app.

### Backend app

- `apps/backend/package.json`
- `apps/backend/tsconfig.json`
- `apps/backend/nest-cli.json`
- `apps/backend/.env.example`
- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/health/health.module.ts`
- `apps/backend/src/health/health.controller.ts`

## What each backend file does

### `src/main.ts`

This is the backend entry point.

It:

- creates the Nest app
- sets a global API prefix to `/api`
- enables CORS for the frontend
- enables request validation
- starts the server on port `3001`

### `src/app.module.ts`

This is the root Nest module.

For now it only loads:

- `ConfigModule`
- `HealthModule`

### `src/health/health.controller.ts`

This is the simplest possible endpoint:

- `GET /api/health`

It lets us verify the backend is alive before adding real modules.

## Why start this small

This is how many teams build backend foundations:

1. app boots
2. health route works
3. config loads
4. auth guard is added
5. database service is added
6. real business modules are added

That keeps problems isolated, which is especially helpful while learning.

## Next command you will run

Once dependencies are installed, the backend should start with:

```bash
npm install
npm run dev:backend
```

Then test:

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "tinysteps-backend",
  "timestamp": "..."
}
```

## Important note

The backend dependencies are declared, but I have not installed packages from the network here.

So the next real step on your machine is to install workspace dependencies and run the backend.

## Step 2 suggestion

After the health route works, the best next lesson is:

- add Firebase Admin setup
- verify Firebase bearer tokens in a Nest guard

That is the first real bridge between your current frontend auth and the new backend.
