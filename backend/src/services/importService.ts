import Papa from 'papaparse';
import { z } from 'zod';
import { runAiBatchWithMeta, type AiBatchPayload } from './aiService.js';
import {
  createImportJob,
  saveRawRows,
  saveAiBatch,
  persistBatchResults,
  updateImportJobStatus
} from './importJobService.js';
import { hasUsableContact, normalizeAiResponse, type ParsedLeadRecord } from '../utils/aiNormalization.js';
import { allowedCrmStatuses, allowedDataSources } from '../constants/crmImportSchema.js';

const optionalCrmStatusSchema = z.union([z.enum(allowedCrmStatuses), z.literal('')]);
const optionalDataSourceSchema = z.union([z.enum(allowedDataSources), z.literal('')]);

type LeadData = {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
};

const crmFieldCandidates: Record<keyof LeadData, string[]> = {
  created_at: ['created_at', 'created at', 'date', 'created date', 'lead date', 'enquiry date', 'timestamp', 'time'],
  name: ['name', 'full name', 'full_name', 'customer name', 'client name', 'lead name', 'contact name', 'person', 'prospect'],
  email: ['email', 'email address', 'mail', 'e-mail'],
  country_code: ['country code', 'country_code', 'dial code', 'isd code'],
  mobile_without_country_code: ['mobile_without_country_code', 'mobile', 'phone', 'phone no', 'phone number', 'mobile no', 'contact number', 'cell', 'whatsapp'],
  company: ['company', 'company name', 'organization', 'organisation', 'firm', 'business'],
  city: ['city', 'town', 'location'],
  state: ['state', 'province', 'region'],
  country: ['country', 'nation'],
  lead_owner: ['lead_owner', 'lead owner', 'owner', 'assigned to', 'sales owner', 'agent', 'executive'],
  crm_status: ['crm_status', 'crm status', 'status', 'lead status'],
  crm_note: ['crm_note', 'crm note', 'remarks', 'remark', 'notes', 'note', 'follow up', 'follow-up', 'comments', 'comment', 'additional comments'],
  data_source: ['data_source', 'data source', 'source', 'lead source', 'campaign', 'project'],
  possession_time: ['possession_time', 'possession time', 'possession', 'handover', 'move in', 'move-in'],
  description: ['description', 'desc', 'requirement', 'requirements', 'interest', 'interested in', 'property details']
};

const mappedCrmFields = new Set(Object.keys(crmFieldCandidates).filter((field) => field !== 'crm_note'));

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
  crm_status: optionalCrmStatusSchema.optional().default(''),
  crm_note: z.string().optional().default(''),
  data_source: optionalDataSourceSchema.optional().default(''),
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
  const parsed = parseCsv(file);
  const headers = parsed.meta.fields ?? [];
  return {
    headers,
    rows: (parsed.data as Record<string, string>[]).slice(0, 25),
    totalRows: (parsed.data as Record<string, string>[]).length,
    parseErrors: parsed.errors.map((error) => ({
      row: error.row,
      code: error.code,
      message: error.message
    }))
  };
};

export const processCsvService = async (file: Express.Multer.File, leadSourceId?: string) => {
  const parsed = parseCsv(file);
  const rows = parsed.data as Record<string, string>[];
  const headers = parsed.meta.fields ?? [];

  if (!rows.length) {
    throw new Error('CSV does not contain any data rows');
  }

  const importJob = await createImportJob(file.originalname, file.size, rows.length, leadSourceId);
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
    const rowOffset = batchIndex * batchSize;
    const batchPayload: AiBatchPayload = {
      headers,
      rows: batchRows.map((row, index) => ({
        sourceRowIndex: rowOffset + index + 1,
        values: row
      }))
    };
    let batchResponse: NormalizedAiBatchResult = { records: [], skipped: [] };
    let batchError: string | undefined;
    let retryCount = 0;

    try {
      const aiRun = await runAiBatchWithMeta(batchPayload);
      retryCount = aiRun.retryCount;
      const rawResponse = aiRun.result;
      batchError = aiRun.error;
      const normalizedRecords = rawResponse.records.map((record) =>
        sanitizeMappedRecord(normalizeAiResponse({
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
        }), batchPayload.rows.find((row) => row.sourceRowIndex === record.sourceRowIndex)?.values ?? {})
      );
      batchResponse.records = [];
      batchResponse.skipped = [...rawResponse.skipped];

      normalizedRecords.forEach((record) => {
        if (!hasUsableContact(record)) {
          batchResponse.skipped.push({
            sourceRowIndex: record.sourceRowIndex,
            reason: 'Missing both email and mobile number'
          });
          return;
        }

        batchResponse.records.push({ ...record, status: 'imported' });
      });

      if (!batchResponse.records.length && !batchResponse.skipped.length) {
        const fallback = buildFallbackResult(batchPayload.rows);
        batchResponse = { records: fallback.records, skipped: fallback.skipped };
      }
    } catch (error) {
      batchError = error instanceof Error ? error.message : 'Unknown AI batch error';
      const fallback = buildFallbackResult(batchPayload.rows);
      batchResponse = { records: fallback.records, skipped: fallback.skipped };
    }

    await saveAiBatch(importJob.id, batchIndex + 1, batchPayload, {
      records: batchResponse.records,
      skipped: batchResponse.skipped
    }, batchError, retryCount);
    resultRecords.push(...batchResponse.records);
    resultSkipped.push(...batchResponse.skipped);
  }

  const totals = {
    imported: resultRecords.filter((record) => record.status === 'imported').length,
    skipped: resultSkipped.length
  };

  await persistBatchResults(importJob.id, savedRawRows, { leadSourceId, imported: totals.imported, skipped: totals.skipped, totalRows: rows.length, records: resultRecords, skippedRecords: resultSkipped });
  await updateImportJobStatus(importJob.id, 'COMPLETED', totals);

  const parsedResult = aiResponseSchema.safeParse({ records: resultRecords, skipped: resultSkipped });
  if (!parsedResult.success) {
    await updateImportJobStatus(importJob.id, 'FAILED');
    throw new Error('Unable to normalize AI response');
  }

  return {
    imported: totals.imported,
    skipped: totals.skipped,
    importedCount: totals.imported,
    skippedCount: totals.skipped,
    totalRows: rows.length,
    leadSourceId: leadSourceId || '',
    parseErrors: parsed.errors,
    records: resultRecords.map((record) => record.data),
    skippedRecords: resultSkipped.map((record) => ({
      row: record.sourceRowIndex,
      reason: record.reason
    }))
  };
};

const parseCsv = (file: Express.Multer.File) => {
  return Papa.parse<Record<string, string>>(file.buffer.toString('utf8'), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
    transform: (value) => String(value ?? '').trim()
  });
};

type IndexedRow = AiBatchPayload['rows'][number];

const buildFallbackResult = (rows: IndexedRow[]) => {
  const records: ParsedLeadRecord[] = [];
  const skipped: Array<{ sourceRowIndex: number; reason: string }> = [];

  rows.forEach((row) => {
    const mappedData = mapRowToLeadData(row.values);
    if (!mappedData.email && !mappedData.mobile_without_country_code) {
      skipped.push({ sourceRowIndex: row.sourceRowIndex, reason: 'Missing both email and mobile number' });
      return;
    }

    const normalized = normalizeAiResponse({
      sourceRowIndex: row.sourceRowIndex,
      status: 'imported',
      confidence: 0.45,
      data: mappedData
    });

    records.push(normalized);
  });

  return { records, skipped };
};

export const mapRowToLeadData = (row: Record<string, string>, aiData?: Partial<LeadData>): LeadData => {
  const emails = extractEmails(row);
  const phones = extractPhones(row);
  const data: LeadData = {
    created_at: findValue(row, crmFieldCandidates.created_at) || aiData?.created_at || '',
    name: findValue(row, crmFieldCandidates.name) || aiData?.name || '',
    email: findValue(row, crmFieldCandidates.email) || emails[0] || aiData?.email || '',
    country_code: findValue(row, crmFieldCandidates.country_code) || phones[0]?.countryCode || aiData?.country_code || '',
    mobile_without_country_code: phones[0]?.mobile || findValue(row, crmFieldCandidates.mobile_without_country_code) || aiData?.mobile_without_country_code || '',
    company: findValue(row, crmFieldCandidates.company) || aiData?.company || '',
    city: findValue(row, crmFieldCandidates.city) || aiData?.city || '',
    state: findValue(row, crmFieldCandidates.state) || aiData?.state || '',
    country: findValue(row, crmFieldCandidates.country) || aiData?.country || '',
    lead_owner: findValue(row, crmFieldCandidates.lead_owner) || aiData?.lead_owner || '',
    crm_status: findValue(row, crmFieldCandidates.crm_status) || aiData?.crm_status || '',
    crm_note: '',
    data_source: findValue(row, crmFieldCandidates.data_source) || aiData?.data_source || '',
    possession_time: findValue(row, crmFieldCandidates.possession_time) || aiData?.possession_time || '',
    description: findValue(row, crmFieldCandidates.description) || aiData?.description || ''
  };

  data.crm_note = buildCleanNote(row, data, aiData?.crm_note ?? '', emails.slice(1), phones.slice(1).map((phone) => phone.original));
  return normalizeAiResponse({
    sourceRowIndex: 1,
    status: 'imported',
    confidence: 1,
    data
  }).data;
};

const sanitizeMappedRecord = (record: ParsedLeadRecord, rawRow: Record<string, string>): ParsedLeadRecord => {
  const data = mapRowToLeadData(rawRow, record.data);
  return normalizeAiResponse({
    ...record,
    data
  });
};

const findValue = (row: Record<string, string>, candidateKeys: string[]) => {
  const keys = Object.keys(row);
  const normalized = new Set(keys.map((key) => normalizeHeader(key)));
  for (const candidate of candidateKeys) {
    if (normalized.has(normalizeHeader(candidate))) {
      const actualKey = keys.find((key) => normalizeHeader(key) === normalizeHeader(candidate));
      return actualKey ? row[actualKey] : '';
    }
  }
  return '';
};

const buildCleanNote = (
  row: Record<string, string>,
  mappedData: LeadData,
  aiNote: string,
  extraEmails: string[],
  extraPhones: string[]
) => {
  const mappedValues = new Set(
    Object.entries(mappedData)
      .filter(([key, value]) => key !== 'crm_note' && Boolean(value))
      .map(([, value]) => normalizeValue(value))
  );
  const noteParts: string[] = [];

  Object.entries(row).forEach(([key, value]) => {
    const cleanValue = String(value ?? '').trim();
    if (!cleanValue) return;

    const field = getCrmFieldForHeader(key);
    const normalizedValue = normalizeValue(cleanValue);
    if (field && mappedCrmFields.has(field)) return;
    if (mappedValues.has(normalizedValue)) return;

    if (field === 'crm_note' || isUsefulLeftoverHeader(key)) {
      noteParts.push(`${key}: ${cleanValue}`);
    }
  });

  if (extraEmails.length) noteParts.push(`Extra emails: ${extraEmails.join(', ')}`);
  if (extraPhones.length) noteParts.push(`Extra mobile numbers: ${extraPhones.join(', ')}`);

  const cleanAiNote = stripMappedItemsFromNote(aiNote, mappedValues);
  if (cleanAiNote) noteParts.push(cleanAiNote);

  return Array.from(new Set(noteParts)).join(' | ');
};

const stripMappedItemsFromNote = (note: string, mappedValues: Set<string>) => {
  return String(note ?? '')
    .split(/\s*\|\s*|\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const [maybeKey, ...rest] = part.split(':');
      const key = maybeKey ? getCrmFieldForHeader(maybeKey) : undefined;
      const value = rest.join(':').trim();
      if (key && mappedCrmFields.has(key)) return false;
      return !value || !mappedValues.has(normalizeValue(value));
    })
    .join(' | ');
};

const getCrmFieldForHeader = (header: string) => {
  const normalized = normalizeHeader(header);
  return Object.entries(crmFieldCandidates).find(([, candidates]) =>
    candidates.some((candidate) => normalizeHeader(candidate) === normalized)
  )?.[0];
};

const isUsefulLeftoverHeader = (header: string) => {
  const normalized = normalizeHeader(header);
  return ['remark', 'remarks', 'note', 'notes', 'comment', 'comments', 'follow_up', 'followup', 'additional_info'].some((token) =>
    normalized.includes(token)
  );
};

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const normalizeValue = (value: string) => String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

const extractEmails = (row: Record<string, string>) => {
  return Object.values(row)
    .flatMap((value) => String(value ?? '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [])
    .map((email) => email.trim());
};

const extractPhones = (row: Record<string, string>) => {
  const entries = Object.entries(row);
  const phoneEntries = entries.filter(([key]) => getCrmFieldForHeader(key) === 'mobile_without_country_code');
  const otherEntries = entries.filter(([key]) => !['created_at', 'country_code', 'mobile_without_country_code'].includes(getCrmFieldForHeader(key) ?? ''));

  return [...phoneEntries, ...otherEntries]
    .flatMap(([, value]) => String(value ?? '').match(/\+?\d[\d\s().-]{6,}\d/g) ?? [])
    .map((original) => {
      const digits = original.replace(/\D/g, '');
      const mobile = digits.length > 10 ? digits.slice(-10) : digits;
      const countryCode = digits.length > 10 ? digits.slice(0, digits.length - 10) : '';
      return { original: original.trim(), countryCode, mobile };
    })
    .filter((phone) => phone.mobile.length >= 7);
};
