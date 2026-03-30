# Backend Step 4

This step builds the first real resource module: `children`.

Goal:

- create a normal NestJS feature module
- protect it with Firebase auth
- connect it to Supabase
- return data in a shape the frontend can understand later

## What was added

### New backend files

- `apps/backend/src/children/children.module.ts`
- `apps/backend/src/children/children.controller.ts`
- `apps/backend/src/children/children.service.ts`
- `apps/backend/src/children/dto/create-child.dto.ts`
- `apps/backend/src/children/dto/update-child.dto.ts`

### Updated files

- `apps/backend/src/app.module.ts`

## Endpoints added

All of these routes are protected by the Firebase auth guard.

- `GET /api/children`
- `GET /api/children/:childId`
- `POST /api/children`
- `PATCH /api/children/:childId`
- `DELETE /api/children/:childId`

## What each file does

### `children.module.ts`

This is the feature container for the `children` resource.

It groups:

- controller
- service
- database dependency

This is the normal NestJS pattern you will reuse for later modules like feedings, sleeps, and invites.

### `children.controller.ts`

This defines the API routes.

The controller does not contain database logic itself.

Its job is:

- receive request input
- use DTO validation
- get the authenticated Firebase user
- delegate real work to the service

### `children.service.ts`

This is the business logic layer.

It handles:

- syncing the signed-in Firebase user into `app_users`
- listing children the user can access
- creating a child and owner membership
- updating a child
- deleting a child
- checking caregiver access
- checking owner-only access for update/delete

This is the first place where the backend starts enforcing your app’s rules instead of just exposing raw database access.

### DTO files

- `create-child.dto.ts`
- `update-child.dto.ts`

These define what request bodies are valid.

Because `ValidationPipe` is enabled globally, Nest will automatically reject invalid input before your service runs.

## Important design choices

### 1. We upsert the Firebase user into `app_users`

Every protected `children` request first calls `ensureAppUser()`.

That means:

- the backend trusts Firebase for identity
- but still keeps a local application user row in Supabase

This is very common when auth and application data live in different systems.

### 2. We store caregivers separately from children

The frontend currently uses:

- `caregivers: string[]`

But in Supabase we modeled this properly with:

- `children`
- `child_caregivers`

That is a more scalable relational design.

The service maps that relational shape back into the simpler frontend-like response shape.

### 3. Update/delete are owner-only

For now:

- caregivers can read
- only owners can update or delete

That matches the safer default while the product is still evolving.

## Response shape

The service currently returns children in a frontend-friendly shape:

```json
{
  "id": "...",
  "name": "...",
  "birthDate": "2025-01-01",
  "notes": "",
  "photo": null,
  "caregivers": ["firebaseUid1", "firebaseUid2"],
  "ownerId": "firebaseUid1"
}
```

That is intentional because later the frontend service replacement will be easier.

## How to test Step 4

Use the same Firebase ID token from Step 2.

### 1. List children

```bash
curl http://localhost:3001/api/children \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

### 2. Create a child

```bash
curl http://localhost:3001/api/children \
  -X POST \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Leo",
    "birthDate": "2025-01-15",
    "notes": "Loves contact naps"
  }'
```

### 3. Get a child by id

```bash
curl http://localhost:3001/api/children/CHILD_ID \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

### 4. Update a child

```bash
curl http://localhost:3001/api/children/CHILD_ID \
  -X PATCH \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Updated note"
  }'
```

### 5. Delete a child

```bash
curl http://localhost:3001/api/children/CHILD_ID \
  -X DELETE \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

## What this step proves

After Step 4 works, you have proven that the backend can:

- authenticate a real user
- persist real application data in Supabase
- enforce authorization rules
- expose a real feature module the frontend can later call

That means the backend is now beyond infrastructure setup and into real application behavior.

## Next recommended step

Step 5 should be one of these:

1. connect the frontend `children-service` to these new HTTP endpoints
2. build the `feedings` module in the backend

Learning-wise, I recommend:

- Step 5 = connect frontend children service to backend

That will let you see the first full frontend -> backend -> database loop working.
