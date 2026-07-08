# GrowEasy CRM CSV Importer

An AI-powered CSV importer for GrowEasy CRM with upload, preview, confirmation, batch AI extraction, validation, retry handling, and a polished dashboard UI.

## Features
- Drag-and-drop CSV upload with validation
- Frontend preview table with sticky headers
- Backend parsing and persistence with Prisma + PostgreSQL
- AI-assisted semantic extraction for arbitrary CSV columns
- Validation and skipped-record handling
- Batch processing and retry-friendly batch logs

## Stack
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Express, TypeScript, Zod, Multer, PapaParse
- Database: PostgreSQL + Prisma

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and update the database URL.
3. Create PostgreSQL database and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
4. Start the app:
   ```bash
   npm run dev
   ```

## Notes
- The current AI flow uses a deterministic fallback extractor so the app runs even without an API key.
- For production, swap the fallback with a real LLM adapter in the AI service layer.
