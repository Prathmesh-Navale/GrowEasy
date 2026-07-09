import { z } from 'zod';
import { allowedCrmStatuses, allowedDataSources } from '../constants/crmImportSchema.js';

export const leadDataSchema = z.object({
  created_at: z.string().default(''),
  name: z.string().default(''),
  email: z.string().default(''),
  country_code: z.string().default(''),
  mobile_without_country_code: z.string().default(''),
  company: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  country: z.string().default(''),
  lead_owner: z.string().default(''),
  crm_status: z.string().default(''),
  crm_note: z.string().default(''),
  data_source: z.string().default(''),
  possession_time: z.string().default(''),
  description: z.string().default('')
});

export const parsedLeadRecordSchema = z.object({
  sourceRowIndex: z.number(),
  status: z.enum(['imported', 'skipped']),
  confidence: z.number(),
  data: leadDataSchema
});

export type ParsedLeadRecord = z.infer<typeof parsedLeadRecordSchema>;

const normalizeSingleLine = (value: string) => value.replace(/\r?\n/g, '\\n').replace(/\s+/g, ' ').trim();

const normalizeToken = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const statusAliases: Record<string, string> = {
  GOOD_LEA: 'GOOD_LEAD_FOLLOW_UP',
  GOOD_LEAD: 'GOOD_LEAD_FOLLOW_UP',
  GOOD_LEAD_FOLLOW: 'GOOD_LEAD_FOLLOW_UP',
  FOLLOW_UP: 'GOOD_LEAD_FOLLOW_UP',
  DID_NOT: 'DID_NOT_CONNECT',
  DID_NOT_CONN: 'DID_NOT_CONNECT',
  DID_NOT_CONNECT: 'DID_NOT_CONNECT',
  NOT_CONNECT: 'DID_NOT_CONNECT',
  BAD: 'BAD_LEAD',
  BAD_LEAD: 'BAD_LEAD',
  SALE: 'SALE_DONE',
  SALE_DON: 'SALE_DONE',
  SALE_DONE: 'SALE_DONE'
};

const normalizeEnum = <T extends readonly string[]>(value: string, allowed: T) => {
  const trimmed = value.trim();
  return allowed.includes(trimmed) ? trimmed : '';
};

const normalizeCrmStatus = (value: string) => {
  const exact = normalizeEnum(value, allowedCrmStatuses);
  if (exact) return exact;

  const token = normalizeToken(value);
  if (!token || token.length < 3) return '';
  return allowedCrmStatuses.includes(statusAliases[token] as any) ? statusAliases[token] : '';
};

const normalizeDataSource = (value: string) => {
  const exact = normalizeEnum(value, allowedDataSources);
  if (exact) return exact;

  const token = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (token.length < 5) return '';

  const match = allowedDataSources.find((source) => source === token || source.startsWith(token) || token.startsWith(source));
  return match ?? '';
};

const normalizeDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^#+$/.test(trimmed)) return '';

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = Number(trimmed);
    if (serial > 20000 && serial < 80000) {
      const utcDays = Math.floor(serial - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      return Number.isNaN(dateInfo.getTime()) ? '' : dateInfo.toISOString();
    }
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

export const normalizeAiResponse = (input: ParsedLeadRecord): ParsedLeadRecord => {
  const normalized = parsedLeadRecordSchema.parse(input);
  return {
    ...normalized,
    confidence: Math.max(0, Math.min(1, normalized.confidence)),
    data: {
      ...normalized.data,
      created_at: normalizeDate(normalized.data.created_at),
      crm_status: normalizeCrmStatus(normalized.data.crm_status),
      data_source: normalizeDataSource(normalized.data.data_source),
      crm_note: normalizeSingleLine(normalized.data.crm_note),
      description: normalizeSingleLine(normalized.data.description),
      name: normalizeSingleLine(normalized.data.name),
      email: normalizeSingleLine(normalized.data.email),
      mobile_without_country_code: normalizeSingleLine(normalized.data.mobile_without_country_code)
    }
  };
};

export const hasUsableContact = (record: ParsedLeadRecord) => {
  return Boolean(record.data.email.trim() || record.data.mobile_without_country_code.trim());
};
