# NestJS + Supabase Migration Plan

## Confirmed direction

Firebase Authentication will remain the authentication provider for this app.

That means the target architecture is:

- Firebase Auth for sign-in, sign-up, Google auth, and frontend auth state
- NestJS for backend APIs and business logic
- Supabase Postgres for application data storage

The migration is therefore focused on replacing Firestore data access, not replacing auth.

## Current delivery priority

Frontend comes first.

We will:

1. finish the Next.js product flows and UI
2. keep Firebase Auth in place
3. keep the frontend service boundary so backend migration stays easy later
4. defer NestJS and Supabase implementation until the frontend is functionally ready

So for now, this repo should optimize for:

- complete user flows
- better UI/UX
- stable frontend state management
- minimal churn to auth while building features

Backend and database migration will happen after the frontend scope is in a good place.

## Current frontend coupling

The current Next.js app still talks directly to Firebase from UI components and route pages:

- Auth and session flow:
  - `components/Auth.tsx`
  - `components/AuthGuard.tsx`
  - `components/LogoutButton.tsx`
  - `components/AppHeader.tsx`
  - `app/auth/page.tsx`
- Child state and profile creation:
  - `components/ActiveChildProvider.tsx`
  - `app/(protected)/children/new/page.tsx`
- Invites and dashboard data:
  - `app/(protected)/invites/page.tsx`
  - `app/(protected)/dashboard/page.tsx`

This means the UI currently knows about Firebase Auth, Firestore collections, and subscription details.

## Target architecture

### Frontend

The Next.js frontend should eventually depend on app-level services only:

- `authService`
- `sessionService`
- `childrenService`
- `inviteService`
- `activityService`

Later:

- `authService` can stay Firebase-based
- `sessionService` may be replaced or adjusted depending on how NestJS handles app sessions
- data services like `childrenService`, `inviteService`, and `activityService` should stop calling Firestore and instead call NestJS APIs

### Backend

Suggested NestJS modules:

- `auth`
  - Firebase token verification
  - optional session exchange endpoint if needed
- `children`
  - CRUD child profiles
  - caregiver membership checks
- `activities`
  - feedings
  - sleeps
  - diapers
  - health
  - growth
  - milestones
  - reminders
  - routines
- `invites`
  - create invite
  - list child invites
  - accept/decline invite
- `analytics`
  - dashboard summaries
  - insights
- `ai`
  - AI chat endpoints

### Database

Supabase Postgres should become the source of truth for:

- users
- children
- caregivers / memberships
- feedings
- sleeps
- diapers
- health_logs
- invites

For the current active frontend scope, the first database pass should prioritize:

- users
- children
- child_caregivers
- feedings
- sleeps
- diapers
- health_logs
- invites

Paused domains like growth, milestones, reminders, and routines can be added later when those features return.

## Recommended migration order

### Phase 1: Frontend first

1. Finish protected pages and user flows in Next.js.
2. Keep Firebase Auth as-is.
3. Keep using the service layer so UI code stays decoupled from direct data-source details.
4. Avoid deep backend rewrites until product flows are validated.

### Phase 2: Backend + database migration

1. Stand up NestJS API with Firebase Admin token verification.
2. Model the current Firestore data in Supabase Postgres.
3. Move reads/writes collection by collection from Firestore services to NestJS HTTP services.
4. Remove Firestore usage from the frontend after all data domains are migrated.

The current repo is in Phase 1.

## Current step completed

This repo now has a frontend service layer in `lib/services/` that the UI can use instead of importing Firebase directly. That is the seam to replace next.

## Notes from current app model

- Child-related activity data is currently stored under Firestore-style child subcollections.
- The dashboard depends on live updates for:
  - feedings
  - sleeps
  - diapers
  - health
  - growth
  - milestones
  - reminders
- Invites are top-level documents linked by `childId`.

## Auth strategy

Recommended production auth flow:

1. User signs in on the frontend with Firebase Auth.
2. Frontend obtains the Firebase ID token.
3. Frontend sends `Authorization: Bearer <firebase-id-token>` to NestJS.
4. NestJS verifies the token with Firebase Admin SDK.
5. NestJS treats Firebase `uid` as the app user identity.
6. NestJS stores and queries application data in Supabase Postgres.

This keeps the current auth UX while moving your data and business logic out of Firebase client access.

## Future backend contract direction

Recommended REST shape for the frontend:

- `GET /me`
- `POST /auth/session` (optional, only if you want backend-managed app sessions)
- `GET /children`
- `POST /children`
- `GET /children/:childId/dashboard`
- `GET /children/:childId/feedings`
- `GET /children/:childId/sleeps`
- `GET /children/:childId/diapers`
- `GET /children/:childId/health`
- `GET /children/:childId/growth`
- `GET /children/:childId/milestones`
- `GET /children/:childId/reminders`
- `GET /children/:childId/routines`
- `GET /children/:childId/invites`
- `POST /children/:childId/invites`
- `PATCH /invites/:inviteId`

## Migration note for this repo

The current `authService` remains Firebase-backed on purpose.

While we are still in the frontend-first phase, the immediate focus should be on finishing pages and interactions.

After that, the next services to migrate away from Firebase should be:

1. `childrenService`
2. `inviteService`
3. dashboard/activity subscriptions

Those are the places where Firestore is still the active data source today.

## Official references

- NestJS docs: https://docs.nestjs.com/
- Supabase SSR/auth docs: https://supabase.com/docs/guides/auth/server-side/oauth-with-pkce-flow-for-ssr
