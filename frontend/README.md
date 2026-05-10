# Frontend Deployment (Vercel)

This frontend is a Next.js 14 app and can be deployed directly from GitHub to Vercel.

## Build settings

- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: _(leave empty / default for Next.js)_

## Required environment variable

- `NEXT_PUBLIC_API_URL` = your **public backend base URL**
  - Example: `https://api.your-domain.com`
  - Do **not** use localhost in production.
  - Must be configured in Vercel **before production deploy/build**.

If `NEXT_PUBLIC_API_URL` is missing in production, the app throws a clear error (it will not fall back to invalid `:8002` URLs).

## Local development

- `.env.local` should use local backend URL:
  - `NEXT_PUBLIC_API_URL=http://127.0.0.1:8002`
- Or copy:
  - `cp .env.example .env.local`

