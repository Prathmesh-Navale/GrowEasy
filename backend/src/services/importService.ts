import Papa from 'papaparse';
import { z } from 'zod';
import { runAiBatch, type AiBatchPayload, type AiBatchResult } from './aiService.js';
import {
  createImportJob,
  saveRawRows,
  saveAiBatch,
  persistBatchResults,
  updateImportJobStatus
} from './importJobService.js';
import { normalizeAiResponse, type ParsedLeadRecord } from '../utils/aiNormalization.js';

const allowedStatuses = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
const allowedDataSources = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];

const leadSchema = z.object({
  created_at: z.string().optional().default(''),
  name: z.string().optional().default(''),
  email: z.string().optional().default(''),
  country_code: z.string().optional().default(''),
  mobile_without_country_code: z.string().optional().default(''),
  company: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  country: z.string().optional().default(''),
  lead_owner: z.string().optional().default(''),
  crm_status: z.enum(allowedStatuses as [string, ...string[]]).optional().default(''),
  crm_note: z.string().optional().default(''),
  data_source: z.enum(allowedDataSources as [string, ...string[]]).optional().default(''),
  possession_time: z.string().optional().default(''),
  description: z.string().optional().default('')
});

const aiResponseSchema = z.object({
  records: z.array(z.object({
    sourceRowIndex: z.number(),
    status: z.enum(['imported', 'skipped']),
    confidence: z.number(),
    data: leadSchema,
  })),
  skipped: z.array(z.object({
    sourceRowIndex: z.number(),
    reason: z.string(),
  }))
});

export const previewCsvService = async (file: Express.Multer.File) => {
  const parsed = Papa.parse(file.buffer.toString('utf8'), { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields ?? [];
  return {
    headers,
    rows: (parsed.data as Record<string, string>[]).slice(0, 25)
  };
};

export const processCsvService = async (file: Express.Multer.File) => {
  const parsed = Papa.parse(file.buffer.toString('utf8'), { header: true, skipEmptyLines: true });
  const rows = parsed.data as Record<string, string>[];
  const headers = parsed.meta.fields ?? [];

  const importJob = await createImportJob(file.originalname, file.size, rows.length);
  await updateImportJobStatus(importJob.id, 'PROCESSING');

  const batchSize = Number(process.env.BATCH_SIZE ?? 10);
  const resultRecords: ParsedLeadRecord[] = [];
  const resultSkipped: Array<{ sourceRowIndex: number; reason: string }> = [];

  const batches = Array.from({ length: Math.ceil(rows.length / batchSize) }, (_, index) => {
    const start = index * batchSize;
    const end = start + batchSize;
    return rows.slice(start, end);
  });

  const savedRawRows = await saveRawRows(importJob.id, rows);

  type NormalizedAiBatchResult = {
    records: ParsedLeadRecord[];
    skipped: Array<{ sourceRowIndex: number; reason: string }>;
  };

  for (const [batchIndex, batchRows] of batches.entries()) {
    const batchPayload: AiBatchPayload = { headers, rows: batchRows };
    let batchResponse: NormalizedAiBatchResult = { records: [], skipped: [] };
    let batchError: string | undefined;

    try {
      const rawResponse = await runAiBatch(batchPayload);
      batchResponse.records = rawResponse.records.map((record) =>
        normalizeAiResponse({
          sourceRowIndex: record.sourceRowIndex,
          status: record.status,
          confidence: record.confidence,
          data: {
            created_at: String(record.data.created_at ?? ''),
            name: String(record.data.name ?? ''),
            email: String(record.data.email ?? ''),
            country_code: String(record.data.country_code ?? ''),
            mobile_without_country_code: String(record.data.mobile_without_country_code ?? ''),
            company: String(record.data.company ?? ''),
            city: String(record.data.city ?? ''),
            state: String(record.data.state ?? ''),
            country: String(record.data.country ?? ''),
            lead_owner: String(record.data.lead_owner ?? ''),
            crm_status: String(record.data.crm_status ?? ''),
            crm_note: String(record.data.crm_note ?? ''),
            data_source: String(record.data.data_source ?? ''),
            possession_time: String(record.data.possession_time ?? ''),
            description: String(record.data.description ?? '')
          }
        })
      );
      batchResponse.skipped = rawResponse.skipped;

      if (!batchResponse.records.length && !batchResponse.skipped.length) {
        const fallback = buildFallbackResult(batchRows);
        batchResponse = { records: fallback.records, skipped: fallback.skipped };
      }
    } catch (error) {
      batchError = error instanceof Error ? error.message : 'Unknown AI batch error';
      const fallback = buildFallbackResult(batchRows);
      batchResponse = { records: fallback.records, skipped: fallback.skipped };
    }

    await saveAiBatch(importJob.id, batchIndex + 1, batchPayload, {
      records: batchResponse.records,
      skipped: batchResponse.skipped
    }, batchError);
    resultRecords.push(...batchResponse.records);
    resultSkipped.push(...batchResponse.skipped);
  }

  const totals = {
    imported: resultRecords.filter((record) => record.status === 'imported').length,
    skipped: resultSkipped.length
  };

  await persistBatchResults(importJob.id, savedRawRows, { imported: totals.imported, skipped: totals.skipped, totalRows: rows.length, records: resultRecords, skippedRecords: resultSkipped });
  await updateImportJobStatus(importJob.id, 'COMPLETED', totals);

  const parsedResult = aiResponseSchema.safeParse({ records: resultRecords, skipped: resultSkipped });
  if (!parsedResult.success) {
    await updateImportJobStatus(importJob.id, 'FAILED');
    throw new Error('Unable to normalize AI response');
  }

  return {
    imported: totals.imported,
    skipped: totals.skipped,
    totalRows: rows.length,
    records: resultRecords,
    skippedRecords: resultSkipped
  };
};

const buildFallbackResult = (rows: Record<string, string>[]) => {
  const records: ParsedLeadRecord[] = [];
  const skipped: Array<{ sourceRowIndex: number; reason: string }> = [];

  rows.forEach((row, index) => {
    const email = extractEmail(row);
    const mobile = extractMobile(row);
    if (!email && !mobile) {
      skipped.push({ sourceRowIndex: index + 1, reason: 'Missing both email and mobile number' });
      return;
    }

    const normalized = normalizeAiResponse({
      sourceRowIndex: index + 1,
      status: 'imported',
      confidence: 0.82,
      data: {
        created_at: extractDate(row),
        name: extractName(row),
        email,
        country_code: '',
        mobile_without_country_code: mobile,
        company: extractCompany(row),
        city: extractCity(row),
        state: extractState(row),
        country: extractCountry(row),
        lead_owner: '',
        crm_status: '',
        crm_note: buildNote(row),
        data_source: '',
        possession_time: '',
        description: ''
      }
    });

    records.push(normalized);
  });

  return { records, skipped };
};

const extractEmail = (row: Record<string, string>) => {
  const values = Object.values(row).filter(Boolean);
  const emailValue = values.find((value) => /@/.test(value));
  return emailValue?.trim() ?? '';
};

const extractMobile = (row: Record<string, string>) => {
  const values = Object.values(row).filter(Boolean);
  const mobileValue = values.find((value) => /\d{7,}/.test(value));
  return mobileValue?.trim() ?? '';
};

const extractDate = (row: Record<string, string>) => {
  const candidates = Object.values(row).filter(Boolean);
  const match = candidates.find((value) => !Number.isNaN(new Date(value).getTime()) && value.length > 4);
  return match?.trim() ?? '';
};

const extractName = (row: Record<string, string>) => {
  const candidateKeys = ['name', 'full_name', 'full name', 'contact_name', 'lead_name'];
  const match = findValue(row, candidateKeys);
  return match ?? '';
};

const extractCompany = (row: Record<string, string>) => {
  const candidateKeys = ['company', 'organization', 'company_name', 'firm'];
  const match = findValue(row, candidateKeys);
  return match ?? '';
};

const extractCity = (row: Record<string, string>) => {
  const candidateKeys = ['city', 'location', 'town'];
  const match = findValue(row, candidateKeys);
  return match ?? '';
};

const extractState = (row: Record<string, string>) => {
  const candidateKeys = ['state', 'province'];
  const match = findValue(row, candidateKeys);
  return match ?? '';
};

const extractCountry = (row: Record<string, string>) => {
  const candidateKeys = ['country', 'nation'];
  const match = findValue(row, candidateKeys);
  return match ?? '';
};

const findValue = (row: Record<string, string>, candidateKeys: string[]) => {
  const keys = Object.keys(row);
  const normalized = new Set(keys.map((key) => key.toLowerCase().trim()));
  for (const candidate of candidateKeys) {
    if (normalized.has(candidate.toLowerCase())) {
      const actualKey = keys.find((key) => key.toLowerCase().trim() === candidate.toLowerCase());
      return actualKey ? row[actualKey] : '';
    }
  }
  return '';
};

const buildNote = (row: Record<string, string>) => {
  return Object.entries(row)
    .filter(([, value]) => Boolean(value))
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' | ');
};
