# Backend Step 10

This step moves caregiver invites to the backend.

Goal:

- add child-scoped invite endpoints
- protect them with Firebase auth
- keep child access checks consistent with the other modules
- store invites in Supabase
- wire the existing invites page to real backend data

## What was added

### New backend files

- `apps/backend/src/invites/invites.module.ts`
- `apps/backend/src/invites/invites.controller.ts`
- `apps/backend/src/invites/invites.service.ts`
- `apps/backend/src/invites/dto/create-invite.dto.ts`

### Updated files

- `apps/backend/src/app.module.ts`
- `apps/backend/requests.http`
- `apps/frontend/lib/services/invite-service.ts`
- `apps/frontend/app/(protected)/invites/page.tsx`

## Endpoints added

These routes are protected:

- `GET /api/children/:childId/invites`
- `POST /api/children/:childId/invites`
- `PATCH /api/children/:childId/invites/:inviteId/decline`
- `GET /api/invites/me`
- `PATCH /api/invites/:inviteId/accept`
- `PATCH /api/invites/:inviteId/decline`

## Backend flow

`InvitesService`:

- checks child access through `ChildrenService`
- lists invites for the active child
- lists incoming invites by the signed-in user email
- creates new invite rows in Supabase
- declines existing invites
- accepts incoming invites and creates caregiver membership
- maps database columns into the frontend invite shape

## Frontend wiring

The invites page already used a dedicated service, so this step swaps the service implementation:

- `subscribeToInvites()` now loads from the backend
- `subscribeToIncomingInvites()` loads invites sent to the current account
- `createInvite()` now posts to the backend
- `declineInvite()` now patches the backend
- `acceptInvite()` accepts the invite and gives caregiver access

That means:

- the child owner can send and manage invites for the active child
- the invited caregiver can see incoming requests
- accepting an invite adds the caregiver to `child_caregivers`
- the child becomes available in the caregiver account after refresh
