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

const normalizeEnum = <T extends readonly string[]>(value: string, allowed: T) => {
  const trimmed = value.trim();
  return allowed.includes(trimmed) ? trimmed : '';
};

const normalizeDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return Number.isNaN(new Date(trimmed).getTime()) ? '' : trimmed;
};

export const normalizeAiResponse = (input: ParsedLeadRecord): ParsedLeadRecord => {
  const normalized = parsedLeadRecordSchema.parse(input);
  return {
    ...normalized,
    confidence: Math.max(0, Math.min(1, normalized.confidence)),
    data: {
      ...normalized.data,
      created_at: normalizeDate(normalized.data.created_at),
      crm_status: normalizeEnum(normalized.data.crm_status, allowedCrmStatuses),
      data_source: normalizeEnum(normalized.data.data_source, allowedDataSources),
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
