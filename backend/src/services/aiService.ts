import dotenv from 'dotenv';
import { z } from 'zod';
import { allowedCrmStatuses, allowedDataSources, crmFields } from '../constants/crmImportSchema.js';

dotenv.config();

export interface AiBatchPayload {
  headers: string[];
  rows: Array<{
    sourceRowIndex: number;
    values: Record<string, string>;
  }>;
}

export interface AiBatchResult {
  records: Array<{
    sourceRowIndex: number;
    status: 'imported' | 'skipped';
    confidence: number;
    data: Record<string, string>;
  }>;
  skipped: Array<{
    sourceRowIndex: number;
    reason: string;
  }>;
}

const openAiResponseSchema = z.object({
  records: z.array(z.object({
    sourceRowIndex: z.number(),
    status: z.enum(['imported', 'skipped']),
    confidence: z.number(),
    data: z.record(z.string())
  })),
  skipped: z.array(z.object({
    sourceRowIndex: z.number(),
    reason: z.string()
  }))
});

const buildAiPrompt = (payload: AiBatchPayload) => {
  return [
    'You are an AI extraction assistant for GrowEasy CRM CSV imports.',
    'Your job is semantic field mapping, not exact header matching.',
    '',
    'Accept arbitrary CSV exports from Facebook Leads, Google Ads, Excel sheets, real estate CRMs, sales reports, marketing agencies, and manually created spreadsheets.',
    'Understand synonyms and context. Examples: Customer Name, Lead Name, Full Name, Person, Prospect => name. Phone, Mobile, Contact Number, Cell, Mobile No. => mobile_without_country_code.',
    '',
    'Return JSON only with exactly this shape:',
    '{"records":[{"sourceRowIndex":1,"status":"imported","confidence":0.95,"data":{...crm fields...}}],"skipped":[{"sourceRowIndex":2,"reason":"Missing both email and mobile number"}]}',
    '',
    'CRM fields:',
    JSON.stringify(crmFields),
    '',
    `Allowed crm_status values: ${allowedCrmStatuses.join(', ')}. Leave crm_status blank if not confident. Never invent other values.`,
    `Allowed data_source values: ${allowedDataSources.join(', ')}. Leave data_source blank if not confident. Never guess.`,
    '',
    'Validation and preservation rules:',
    '- Process every input row exactly once, either in records or skipped.',
    '- Preserve sourceRowIndex exactly as provided.',
    '- Skip rows that contain neither an email address nor a mobile number.',
    '- Use the first email as email; append remaining emails to crm_note.',
    '- Use the first mobile number as mobile_without_country_code; append remaining phone numbers to crm_note.',
    '- country_code should contain only the country dial code when available.',
    '- created_at must be parseable by JavaScript new Date(created_at); otherwise leave blank.',
    '- Do not invent values. Missing fields must be blank strings.',
    '- Ignore irrelevant columns unless useful information should be preserved in crm_note.',
    '- Put remarks, follow-up notes, extra comments, extra contacts, campaign metadata, and useful unmapped data into crm_note.',
    '- Keep crm_note and description single-line. Escape unavoidable newlines as \\n.',
    '',
    'Headers:',
    JSON.stringify(payload.headers),
    'Rows with stable source indexes:',
    JSON.stringify(payload.rows)
  ].join('\n');
};

const fallbackAiBatch = async (payload: AiBatchPayload): Promise<AiBatchResult> => {
  return { records: [], skipped: [] };
};

export const runAiBatch = async (payload: AiBatchPayload): Promise<AiBatchResult> => {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return fallbackAiBatch(payload);
  }

  const body = {
    model: process.env.AI_MODEL ?? 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildAiPrompt(payload) }],
    response_format: { type: 'json_object' },
    max_tokens: Number(process.env.AI_MAX_TOKENS ?? 3000),
    temperature: 0
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    return fallbackAiBatch(payload);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    return fallbackAiBatch(payload);
  }

  try {
    const cleaned = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    const parsed = openAiResponseSchema.safeParse(JSON.parse(cleaned));
    if (!parsed.success) {
      return fallbackAiBatch(payload);
    }

    return parsed.data;
  } catch {
    return fallbackAiBatch(payload);
  }
};
