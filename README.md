# TinySteps

TinySteps is a parenting companion for tracking baby care activity across feeding, sleep, diapers, health notes, caregiver invites, and AI-assisted summaries.

This repository is a monorepo with:

- `apps/frontend`: Next.js frontend for the user-facing app
- `apps/backend`: NestJS API for auth verification, business logic, and AI chat
- `supabase/`: SQL migrations for the production database
- `docs/`: implementation notes, backend learning steps, and deployment guides

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: NestJS
- Auth: Firebase Authentication
- Database: Supabase Postgres
- AI: Gemini with backend fallback logic

## Repository Structure

```text
tinysteps/
  apps/
    frontend/
    backend/
  docs/
  supabase/
    migrations/
```

## Getting Started

Install dependencies:

```bash
npm install
```

Set up env files:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

Run the apps:

```bash
npm run dev:frontend
npm run dev:backend
```

## Common Commands

```bash
npm run dev:frontend
npm run dev:backend
npm run lint:frontend
npm run typecheck:frontend
npm run typecheck:backend
npm run build:frontend
npm run build:backend
npm run ci
```

## Deployment

Recommended production setup:

- Frontend: Vercel
- Backend: Render
- Database: Supabase

See [`docs/deployment.md`](/Users/anhchienvu/Code/tinysteps/docs/deployment.md) for setup details.

## CI/CD

- CI: GitHub Actions via [`.github/workflows/ci.yml`](/Users/anhchienvu/Code/tinysteps/.github/workflows/ci.yml)
- Frontend CD: Vercel GitHub integration
- Backend CD: Render auto deploy through [`render.yaml`](/Users/anhchienvu/Code/tinysteps/render.yaml)

## Product Docs

- [`docs/backend-step-01.md`](/Users/anhchienvu/Code/tinysteps/docs/backend-step-01.md) through [`docs/backend-step-11.md`](/Users/anhchienvu/Code/tinysteps/docs/backend-step-11.md)
- [`docs/supabase-setup.md`](/Users/anhchienvu/Code/tinysteps/docs/supabase-setup.md)
- [`docs/nest-supabase-migration.md`](/Users/anhchienvu/Code/tinysteps/docs/nest-supabase-migration.md)

## Contributing

See [`CONTRIBUTING.md`](/Users/anhchienvu/Code/tinysteps/CONTRIBUTING.md).
