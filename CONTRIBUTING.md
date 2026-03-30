# Contributing

## Workflow

- branch from `main`
- keep commits focused
- open a pull request for review

Suggested branch names:

- `feature/incoming-invites`
- `fix/stats-sleep-count`
- `docs/deployment-guide`

## Before Opening a PR

Run:

```bash
npm install
npm run ci
```

## Commit Message Examples

- `feat: add backend AI chat endpoint`
- `fix: correct local-day handling for sleep logs`
- `docs: add render and vercel deployment guide`

## Secrets

Never commit:

- `.env`
- `.env.local`
- Firebase private keys
- Supabase service role keys
- Gemini API keys
