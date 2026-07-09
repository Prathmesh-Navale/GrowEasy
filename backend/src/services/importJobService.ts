import prisma from './dbService.js';
import { AiBatchPayload, AiBatchResult } from './aiService.js';
import { normalizeAiResponse, type ParsedLeadRecord } from '../utils/aiNormalization.js';

export type ImportResultPayload = {
  leadSourceId?: string;
  imported: number;
  skipped: number;
  totalRows: number;
  records: ParsedLeadRecord[];
  skippedRecords: Array<{ sourceRowIndex: number; reason: string }>;
};

export type SavedRawRow = {
  id: string;
  rowIndex: number;
  rawData: Record<string, string>;
};

export const createImportJob = async (fileName: string, fileSize: number, totalRows: number, leadSourceId?: string) => {
  return prisma.importJob.create({
    data: {
      leadSourceId: leadSourceId || null,
      fileName,
      fileSize,
      totalRows,
      status: 'UPLOADED'
    }
  });
};

export const saveRawRows = async (importJobId: string, rows: Record<string, string>[]) => {
  const rawRows: SavedRawRow[] = [];
  for (const [index, row] of rows.entries()) {
    const created = await prisma.importRawRow.create({
      data: { importJobId, rowIndex: index + 1, rawData: row }
    });
    rawRows.push({ id: created.id, rowIndex: created.rowIndex, rawData: row });
  }
  return rawRows;
};

export const saveAiBatch = async (
  importJobId: string,
  batchNumber: number,
  payload: AiBatchPayload,
  response: AiBatchResult,
  error?: string,
  retryCount = 0
) => {
  return prisma.aiBatch.create({
    data: {
      importJobId,
      batchNumber,
      status: response.records.length > 0 || response.skipped.length > 0 ? 'COMPLETED' : 'FAILED',
      inputPayload: payload,
      outputPayload: response,
      errorMessage: error || null,
      retryCount
    }
  });
};

export const persistBatchResults = async (
  importJobId: string,
  rawRows: SavedRawRow[],
  results: ImportResultPayload
) => {
  const rowByIndex = new Map(rawRows.map((row) => [row.rowIndex, row.id]));

  const leadRecords = results.records.map((record) => ({
    importJobId,
    leadSourceId: results.leadSourceId,
    rawRowId: rowByIndex.get(record.sourceRowIndex),
    createdAtLead: record.data.created_at ? new Date(record.data.created_at) : undefined,
    name: record.data.name,
    email: record.data.email,
    countryCode: record.data.country_code,
    mobileWithoutCountryCode: record.data.mobile_without_country_code,
    company: record.data.company,
    city: record.data.city,
    state: record.data.state,
    country: record.data.country,
    leadOwner: record.data.lead_owner,
    crmStatus: record.data.crm_status,
    crmNote: record.data.crm_note,
    dataSource: record.data.data_source,
    possessionTime: record.data.possession_time,
    description: record.data.description,
    aiConfidence: record.confidence
  }));

  const skippedRecords = results.skippedRecords.map((skipped) => ({
    importJobId,
    rawRowId: rowByIndex.get(skipped.sourceRowIndex),
    reason: skipped.reason,
    rawData: rawRows.find((row) => row.rowIndex === skipped.sourceRowIndex)?.rawData ?? {}
  }));

  if (leadRecords.length) {
    await prisma.crmLead.createMany({ data: leadRecords });
  }
  if (skippedRecords.length) {
    await prisma.skippedRecord.createMany({ data: skippedRecords });
  }
};

export const updateImportJobStatus = async (importJobId: string, status: string, totals?: { imported: number; skipped: number }) => {
  const data: any = { status };
  if (totals) {
    data.totalImported = totals.imported;
    data.totalSkipped = totals.skipped;
  }

  return prisma.importJob.update({ where: { id: importJobId }, data });
};

export const listImportJobs = async () => {
  const jobs: Array<any> = await prisma.importJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      aiBatches: {
        select: {
          id: true,
          status: true,
          retryCount: true,
          errorMessage: true
        }
      },
      skippedRecords: {
        select: {
          id: true,
          reason: true,
          createdAt: true
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      leadSource: {
        select: {
          id: true,
          name: true,
          channelType: true
        }
      }
    }
  });

  return jobs.map((job: any) => ({
    id: job.id,
    fileName: job.fileName,
    fileSize: job.fileSize,
    totalRows: job.totalRows,
    totalImported: job.totalImported,
    totalSkipped: job.totalSkipped,
    status: job.status,
    leadSource: job.leadSource,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    batchCount: job.aiBatches.length,
    failedBatchCount: job.aiBatches.filter((batch: any) => batch.status === 'FAILED').length,
    skippedReasons: job.skippedRecords.map((record: any) => record.reason)
  }));
};
