# TinySteps Frontend

This package contains the Next.js frontend for TinySteps.

## Development

Run from the monorepo root:

```bash
npm run dev:frontend
```

## Deployment

Recommended host: Vercel

Set the Vercel project root directory to:

```text
apps/frontend
```

Important env var:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_URL/api
```

## Notes

- Firebase handles client-side authentication
- The frontend fetches application data from the NestJS backend
- The AI chat UI talks to the backend AI endpoint
