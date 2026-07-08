import { z } from 'zod';

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

export const normalizeAiResponse = (input: ParsedLeadRecord): ParsedLeadRecord => {
  const normalized = parsedLeadRecordSchema.parse(input);
  return {
    ...normalized,
    data: {
      ...normalized.data,
      crm_note: normalized.data.crm_note.replace(/\s+/g, ' ').trim(),
      description: normalized.data.description.replace(/\s+/g, ' ').trim(),
      name: normalized.data.name.replace(/\s+/g, ' ').trim()
    }
  };
};
