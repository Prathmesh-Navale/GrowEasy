ALTER TABLE "import_jobs" ADD COLUMN "leadSourceId" TEXT;

ALTER TABLE "crm_leads" ADD COLUMN "leadSourceId" TEXT;

ALTER TABLE "import_jobs"
ADD CONSTRAINT "import_jobs_leadSourceId_fkey"
FOREIGN KEY ("leadSourceId") REFERENCES "lead_sources"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_leads"
ADD CONSTRAINT "crm_leads_leadSourceId_fkey"
FOREIGN KEY ("leadSourceId") REFERENCES "lead_sources"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
