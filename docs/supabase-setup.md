# Supabase Setup

This repo is now ready for a Supabase Postgres database, but it is not wired into the frontend yet.

Current state:

- Firebase stays in place for authentication only
- frontend data still uses mock services
- the Supabase schema below is the database foundation for the next backend phase

## Included schema

The initial migration lives at:

- `supabase/migrations/20260326_0001_core_schema.sql`

It creates the current active TinySteps data model:

- `app_users`
- `children`
- `child_caregivers`
- `feedings`
- `sleeps`
- `diapers`
- `health_logs`
- `invites`

It intentionally does **not** create paused domains like growth, milestones, reminders, or routines yet.

## Why `firebase_uid` is the user key

Authentication is handled by Firebase, not Supabase Auth.

Because of that:

- the backend should verify Firebase ID tokens
- the backend should upsert the authenticated user into `app_users`
- all ownership and audit fields use `firebase_uid`

That keeps your app identity consistent across Firebase Auth, NestJS, and Postgres.

## Create the database

1. Create a Supabase project in the Supabase dashboard.
2. Open the SQL Editor.
3. Run the contents of:
   - `supabase/migrations/20260326_0001_core_schema.sql`

If you prefer Supabase CLI later, you can also apply the same migration through a normal Supabase migrations workflow.

## Important note about RLS

The migration enables Row Level Security on all tables, but does not add client-facing policies yet.

That is intentional.

This project is heading toward:

- Firebase Auth on the frontend
- NestJS backend APIs
- Supabase Postgres accessed by the backend

So the expected production flow is:

- frontend never talks directly to Supabase tables
- backend uses a privileged server-side Supabase key
- backend enforces authorization rules

## Expected backend responsibilities

When NestJS is added, the backend should:

1. verify the Firebase bearer token
2. upsert the user into `app_users`
3. use `firebase_uid` to query and mutate child data
4. enforce caregiver access through `child_caregivers`

## Suggested first backend endpoints

- `GET /children`
- `POST /children`
- `PATCH /children/:childId`
- `DELETE /children/:childId`
- `GET /children/:childId/feedings`
- `POST /children/:childId/feedings`
- `GET /children/:childId/sleeps`
- `POST /children/:childId/sleeps`
- `GET /children/:childId/diapers`
- `POST /children/:childId/diapers`
- `GET /children/:childId/health`
- `POST /children/:childId/health`
- `GET /children/:childId/invites`
- `POST /children/:childId/invites`
- `PATCH /invites/:inviteId`

## Mapping from current frontend types

- `Child.ownerId` -> `children.owner_firebase_uid`
- `Child.caregivers[]` -> `child_caregivers`
- `Feeding.timestamp` -> `feedings.occurred_at`
- `Sleep.startTime` -> `sleeps.start_time`
- `Sleep.endTime` -> `sleeps.end_time`
- `Diaper.timestamp` -> `diapers.occurred_at`
- `Health.timestamp` -> `health_logs.occurred_at`
- `Invite.inviterId` -> `invites.inviter_firebase_uid`
- `Invite.timestamp` -> `invites.created_at`

## Next step after database creation

After the Supabase project exists, the clean next move is:

1. scaffold NestJS
2. connect NestJS to Supabase
3. replace the mock data services with HTTP services that call the backend
