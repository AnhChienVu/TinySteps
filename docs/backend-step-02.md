# Backend Step 2

This step connects the backend to your existing Firebase Authentication flow.

Goal:

- set up Firebase Admin in NestJS
- verify frontend Firebase ID tokens on the backend
- expose one protected endpoint so you can test the auth flow end to end

## What was added

### Backend dependencies

- `firebase-admin`

This package is the server-side Firebase SDK.

It is different from the frontend Firebase SDK because it is meant for trusted backend code.

## New backend files

- `apps/backend/src/auth/auth.module.ts`
- `apps/backend/src/auth/auth.controller.ts`
- `apps/backend/src/auth/auth.guard.ts`
- `apps/backend/src/auth/current-user.decorator.ts`
- `apps/backend/src/auth/firebase-admin.service.ts`

## Updated files

- `apps/backend/src/app.module.ts`
- `apps/backend/package.json`
- `apps/backend/.env.example`

## What each new file does

### `firebase-admin.service.ts`

This creates the Firebase Admin app and gives the rest of the backend access to:

- `getAuth()`

It reads these environment variables:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Important detail:

- private keys often come with escaped newlines (`\\n`)
- the service converts them back into real newlines before Firebase Admin uses them

### `auth.guard.ts`

This is the first real backend security layer.

It:

1. reads the `Authorization` header
2. expects `Bearer <firebase-id-token>`
3. verifies the token with Firebase Admin
4. attaches the decoded user to the request

If anything is wrong, it throws `401 Unauthorized`.

### `current-user.decorator.ts`

This is a small Nest helper.

Instead of manually reading `request.user` in every controller, we can write:

```ts
@CurrentUser() user
```

That keeps controllers cleaner.

### `auth.controller.ts`

This adds the first protected endpoint:

- `GET /api/auth/me`

If the token is valid, it returns a small user object:

- `uid`
- `email`
- `name`
- `picture`

This is a very good learning endpoint because it proves:

- frontend token exists
- backend can read it
- Firebase Admin verification works

### `auth.module.ts`

This groups the auth pieces together into a normal NestJS module.

That is how most Nest apps stay readable as they grow.

## Why this is the right Step 2

Before the backend touches Supabase, it needs to know:

- who the user is
- whether the request is trusted

Since your app keeps Firebase Auth, token verification is the first real backend responsibility.

That is why companies often do auth verification before database reads and writes.

## Environment setup you need

Create:

- `apps/backend/.env`

Using:

- `apps/backend/.env.example`

Fill in:

```env
PORT=3001
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

For now, only the Firebase values are required for this step.

## How to get Firebase Admin credentials

In Firebase Console:

1. open Project Settings
2. open `Service accounts`
3. generate a new private key
4. copy values into `apps/backend/.env`

Important:

- do not commit the downloaded service-account JSON
- keep the real secrets only in `.env`

For `FIREBASE_PRIVATE_KEY`, preserve the key value as one env string.

If needed, replace real line breaks with `\\n`.

## How to test Step 2

### 1. Start the backend

From repo root:

```bash
npm install
npm run dev:backend
```

### 2. Keep the frontend running

```bash
npm run dev:frontend
```

### 3. Get a Firebase ID token in the browser

After signing in from the frontend, open browser devtools console and run something like:

```js
const user = (await import('firebase/auth')).getAuth().currentUser
await user.getIdToken()
```

Copy that token.

### 4. Call the protected backend endpoint

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

Expected result:

```json
{
  "uid": "...",
  "email": "...",
  "name": "...",
  "picture": "..."
}
```

## What this step proves

After Step 2 works, you have verified:

- frontend Firebase Auth works
- backend trusts Firebase as auth provider
- backend can identify the signed-in user

That is the foundation for all later data endpoints.

## Next recommended step

Step 3 should be:

- create a Supabase module/service in NestJS
- connect the backend to your new database
- keep auth and database separate

Then Step 4 should be:

- build the first real resource module, most likely `children`
