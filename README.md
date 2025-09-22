# Acquisitions – Dockerized with Neon (Local for Dev, Cloud for Prod)

This repo is configured to run locally with [Neon Local](https://neon.com/docs/local/neon-local) and deploy to production using your Neon Cloud database URL. The app uses the `@neondatabase/serverless` driver and `drizzle-orm`.

## Overview
- Development runs two services via Docker Compose:
  - `neon-local` – a local proxy to your Neon project, capable of creating ephemeral branches per run.
  - `app` – your Node.js Express API.
- Production runs only the `app` container. It connects to your Neon Cloud `DATABASE_URL` (no Neon Local).
- Environment switching is controlled through `DATABASE_URL` and a small client-side config in `src/config/database.js`.

## Prerequisites
- Docker and Docker Compose installed
- A Neon account, API key, and Project ID
- Optional: Arcjet key if you want to enable Arcjet in dev/prod

## Files added
- `Dockerfile` – multi-stage for dev/prod
- `docker-compose.dev.yml` – app + Neon Local
- `docker-compose.prod.yml` – app only, connects to Neon Cloud
- `.dockerignore` – prevents secrets and extra files from being baked into images
- `.env.development` – env vars for local dev with Neon Local
- `.env.production` – env vars template for production

## Environment variables

### Development (`.env.development`)
- `NEON_API_KEY` – your Neon API key
- `NEON_PROJECT_ID` – your Neon Project ID
- `PARENT_BRANCH_ID` – the parent branch to clone for ephemeral branches
- `DATABASE_NAME` – the logical database name (e.g., `appdb`)
- `PORT`, `LOG_LEVEL`, `ARCJET_KEY` – optional

### Production (`.env.production`)
- `DATABASE_URL` – your Neon Cloud connection string (e.g., `postgres://...neon.tech/...`)
- `PORT`, `LOG_LEVEL`, `ARCJET_KEY` – optional

## How the app selects the DB connection
- In `src/config/database.js`, when `NEON_LOCAL=true` or `NODE_ENV=development`, the Neon client is configured to talk to the Neon Local proxy at `http://neon-local:5432/sql` and uses the `DATABASE_URL` you provide.
- In development, `docker-compose.dev.yml` sets `DATABASE_URL` to:
  - `postgres://neon:npg@neon-local:5432/${DATABASE_NAME}`
- In production, you pass your Neon Cloud `DATABASE_URL` in `.env.production` (or your deployment platform’s secret manager).

## Run locally with Neon Local (development)
1. Copy `.env.development` to `.env` or export variables directly:
   ```bash
   cp .env.development .env
   # Fill in NEON_API_KEY, NEON_PROJECT_ID, PARENT_BRANCH_ID, DATABASE_NAME
   ```
2. Start the stack:
   ```bash
   docker compose -f docker-compose.dev.yml --env-file .env up --build
   ```
3. The API is available at http://localhost:3000.
   - Health check: http://localhost:3000/health
   - Root: http://localhost:3000/
4. Ephemeral branches
   - With `PARENT_BRANCH_ID` set, Neon Local will create an ephemeral branch on container startup and delete it on shutdown.

## Run for production (Neon Cloud)
1. Configure your `.env.production` (or use your platform’s secrets):
   ```env
   DATABASE_URL=postgres://USER:PASSWORD@<YOUR_PROJECT>.neon.tech:5432/DBNAME?sslmode=require
   ```
2. Start the production compose (for local prod-like testing):
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
   ```
3. The API is available at http://localhost:3000.

## Notes
- The application entrypoint is `src/index.js` (see `package.json` scripts).
- `drizzle` migrations/CLI are installed; you can run them inside the container if needed.
- Do not commit real secrets. `.dockerignore` ensures `.env*` files are excluded from the image.

## Troubleshooting
- If the app cannot connect in dev:
  - Ensure `NEON_API_KEY`, `NEON_PROJECT_ID`, and `PARENT_BRANCH_ID` are correct.
  - Check that `neon-local` is healthy and listening on port `5432`.
  - Logs: `docker compose -f docker-compose.dev.yml logs -f neon-local app`
- If using custom networks or ports, update `NEON_FETCH_ENDPOINT` and `DATABASE_URL` accordingly.
