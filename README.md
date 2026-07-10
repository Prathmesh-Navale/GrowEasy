# GrowEasy CRM CSV Importer

GrowEasy is an AI-assisted CRM import suite for cleaning, mapping, validating, and importing lead CSV files into a PostgreSQL-backed CRM database. It includes a polished Next.js dashboard, an Express API, Prisma models, lead-source management, import history, skipped-record tracking, and batch AI extraction support.

## Features

- Upload and preview CSV files before importing
- Map arbitrary CSV headers into GrowEasy CRM lead fields
- Process CSV rows in batches with OpenAI-powered semantic extraction
- Fall back to deterministic local mapping when an API key is unavailable
- Validate contact usability and skip rows with no email or mobile number
- Store import jobs, raw rows, CRM leads, skipped records, and AI batch logs
- Attach imports to configured lead sources
- View dashboard, lead sources, CRM fields, import history, and settings pages
- Responsive Next.js UI with theme support and sidebar navigation

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, lucide-react
- Backend: Node.js, Express, TypeScript, Multer, PapaParse, Zod
- Database: PostgreSQL with Prisma ORM
- Tooling: pnpm workspaces, Vitest, Docker Compose

## Project Structure

```text
GrowEasy/
├── backend/                 # Express API, services, routes, tests
│   └── src/
├── frontend/                # Next.js app router UI
│   └── src/
├── prisma/                  # Prisma schema and migrations
├── API_DOCUMENTATION.md     # Detailed API reference
├── DEPLOYMENT.md            # Production deployment guide
├── docker-compose.yml       # Local PostgreSQL service
├── package.json             # Root workspace scripts
├── pnpm-lock.yaml           # pnpm lockfile
└── pnpm-workspace.yaml      # Workspace package config
```

## Prerequisites

- Node.js 18 or newer
- pnpm
- Docker Desktop, or a local PostgreSQL instance
- Optional: OpenAI API key for AI extraction

Install pnpm if it is not already available:

```bash
npm install -g pnpm
```

## Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Default local values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/groweasy
PORT=4000
OPENAI_API_KEY=
AI_MODEL=gpt-4o-mini
BATCH_SIZE=10
```

Frontend API URL can be configured with:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

If `NEXT_PUBLIC_API_BASE_URL` is not set, the frontend uses `http://localhost:4000`.

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start PostgreSQL with Docker:

   ```bash
   docker compose up -d
   ```

   If your Docker version still uses the old command, run:

   ```bash
   docker-compose up -d
   ```

3. Generate the Prisma client:

   ```bash
   pnpm prisma:generate
   ```

4. Run database migrations:

   ```bash
   pnpm exec prisma migrate dev --schema prisma/schema.prisma
   ```

5. Start backend and frontend together:

   ```bash
   pnpm run dev
   ```

6. Open the app:

   - Frontend: `http://localhost:3000`
   - Backend health check: `http://localhost:4000/health`
   - PostgreSQL: `localhost:5432`

## Running Services Separately

Backend only:

```bash
pnpm --dir backend dev
```

Frontend only:

```bash
pnpm --dir frontend dev
```

## Available Scripts

Root scripts:

```bash
pnpm dev                # Run backend and frontend in development
pnpm build              # Generate Prisma client and build both apps
pnpm start              # Start compiled backend
pnpm backend:build      # Build backend only
pnpm frontend:build     # Build frontend only
pnpm prisma:generate    # Generate Prisma client
```

Backend scripts:

```bash
pnpm --dir backend dev
pnpm --dir backend build
pnpm --dir backend start
pnpm --dir backend test
```

Frontend scripts:

```bash
pnpm --dir frontend dev
pnpm --dir frontend build
pnpm --dir frontend start
```

## Database

The Prisma schema defines these main tables:

- `import_jobs`
- `import_raw_rows`
- `crm_leads`
- `skipped_records`
- `ai_batches`
- `lead_sources`

Useful Prisma commands:

```bash
pnpm exec prisma studio --schema prisma/schema.prisma
pnpm exec prisma migrate dev --schema prisma/schema.prisma
pnpm exec prisma migrate deploy --schema prisma/schema.prisma
```

## API Overview

Base URL:

```text
http://localhost:4000
```

Core routes:

```text
GET  /health
GET  /api/import/history
GET  /api/import/schema
POST /api/import/preview
POST /api/import/process
GET  /api/lead-sources
POST /api/lead-sources
```

CSV upload endpoints expect a multipart form field named `file`. `POST /api/import/process` also accepts an optional `leadSourceId` form field.

See `API_DOCUMENTATION.md` for detailed request and response examples.

## App Pages

- `/dashboard` - import and lead source summary
- `/lead-sources` - lead source management
- `/import-csv` - AI CSV importer workflow
- `/import-history` - previous import jobs and skipped details
- `/crm-fields` - supported CRM fields, statuses, and data sources
- `/settings` - app settings UI

The root page redirects to `/dashboard`.

## AI Import Behavior

When `OPENAI_API_KEY` is configured, the backend sends CSV batches to the configured `AI_MODEL` and asks it to return structured CRM records. The API validates the returned JSON with Zod before storing results.

When `OPENAI_API_KEY` is empty, the app still runs and uses the local fallback mapping flow. This is useful for development and demos, but production imports should use a real API key for better semantic column matching.

## Testing

Run backend tests:

```bash
pnpm --dir backend test
```

The current test suite covers AI response normalization and CSV-to-CRM field mapping behavior.

## Production Build

Build both apps:

```bash
pnpm build
```

Run production database migrations:

```bash
pnpm exec prisma migrate deploy --schema prisma/schema.prisma
```

Start backend:

```bash
pnpm --dir backend start
```

Start frontend:

```bash
pnpm --dir frontend start
```

For more deployment details, see `DEPLOYMENT.md`.

## Troubleshooting

- Database connection fails: confirm PostgreSQL is running and `DATABASE_URL` matches your local credentials.
- Prisma client errors: run `pnpm prisma:generate`.
- Tables are missing: run `pnpm exec prisma migrate dev --schema prisma/schema.prisma`.
- Frontend cannot reach backend: set `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` and restart the frontend.
- CSV upload fails: make sure the file extension is `.csv` and the file size is under the backend upload limit.
- AI import returns empty or skipped data: check `OPENAI_API_KEY`, `AI_MODEL`, and backend logs.

## Related Documentation

- `API_DOCUMENTATION.md` - API endpoint details
- `DEPLOYMENT.md` - deployment checklist and production notes
- `COMPLETION_SUMMARY.md` - project completion summary
