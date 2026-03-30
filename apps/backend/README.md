# TinySteps Backend

This package contains the NestJS API for TinySteps.

## Responsibilities

- Verify Firebase Authentication ID tokens
- Expose REST APIs for children, activities, invites, and AI chat
- Read and write application data in Supabase
- Call Gemini from the backend for AI chat responses

## Development

Run from the monorepo root:

```bash
npm run dev:backend
```

## Environment

Create a local env file from the example:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Required values:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional AI values:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`

## Build

```bash
npm run build:backend
```

## Deployment

Recommended host: Render

The repository includes [`render.yaml`](/Users/anhchienvu/Code/tinysteps/render.yaml) for Render Blueprint deployment.
