-- CreateTable
CREATE TABLE "lead_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channelType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "owner" TEXT,
    "connectionType" TEXT NOT NULL DEFAULT 'MANUAL',
    "syncFrequency" TEXT NOT NULL DEFAULT 'ON_DEMAND',
    "webhookUrl" TEXT,
    "duplicateRule" TEXT NOT NULL DEFAULT 'EMAIL_OR_MOBILE',
    "autoAssignment" TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
    "qualityRules" JSONB,
    "fieldMappings" JSONB,
    "leadsToday" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" INTEGER NOT NULL DEFAULT 0,
    "lastSyncLabel" TEXT NOT NULL DEFAULT 'Not connected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_sources_pkey" PRIMARY KEY ("id")
);
