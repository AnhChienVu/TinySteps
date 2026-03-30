# Deployment Guide

Recommended production setup:

- Frontend: Vercel
- Backend: Render
- Database: Supabase
- Auth: Firebase

## 1. Push to GitHub

From the repo root:

```bash
git add .
git commit -m "Prepare TinySteps for production"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## 2. Frontend on Vercel

In Vercel:

1. Import the GitHub repository
2. Set the root directory to `apps/frontend`
3. Let Vercel detect Next.js
4. Add env vars

Important frontend env var:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_URL/api
```

Make sure the value includes `/api` at the end, because the Nest backend uses a global `/api` prefix.

## 3. Backend on Render

This repo includes [`render.yaml`](/Users/anhchienvu/Code/tinysteps/render.yaml).

In Render:

1. Create a new Blueprint from this repository
2. Confirm the generated service
3. Add required env vars

Required backend env vars:

- `PORT`
- `CORS_ORIGINS`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Health check path:

```text
/api/health
```

Example production CORS value:

```env
CORS_ORIGINS=https://tiny-steps-frontend.vercel.app
```

## 4. Database and Auth

Apply the Supabase migration in:

- [`supabase/migrations/20260326_0001_core_schema.sql`](/Users/anhchienvu/Code/tinysteps/supabase/migrations/20260326_0001_core_schema.sql)

Make sure Firebase Authentication is configured for your production domain too.

## 5. CI/CD

Recommended model:

- GitHub Actions runs CI on push and pull request
- Vercel automatically deploys frontend from GitHub
- Render automatically deploys backend from GitHub

That gives you continuous integration plus automatic deployment from `main`.
