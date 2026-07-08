import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export interface AiBatchPayload {
  headers: string[];
  rows: Record<string, string>[];
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
    'You are an AI extraction assistant for GrowEasy CRM.',
    'Map each row to the official GrowEasy CRM schema using only the input values.',
    'Do not hardcode source-specific mappings. Infer fields semantically.',
    'Supported fields:',
    JSON.stringify({
      created_at: '',
      name: '',
      email: '',
      country_code: '',
      mobile_without_country_code: '',
      company: '',
      city: '',
      state: '',
      country: '',
      lead_owner: '',
      crm_status: '',
      crm_note: '',
      data_source: '',
      possession_time: '',
      description: ''
    }),
    'Allowed crm_status: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE',
    'Allowed data_source: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots',
    'Rules:',
    '- Use the first email as email and remaining emails in crm_note.',
    '- Use the first mobile number as mobile_without_country_code and remaining numbers in crm_note.',
    '- created_at must parse with JavaScript new Date().',
    '- If neither email nor mobile exists, mark row as skipped and provide reason.',
    '- Do not invent values. Leave missing fields blank.',
    '- Keep crm_note for remarks and extra useful unmapped information.',
    '- Return JSON only, no markdown.',
    'Headers:',
    JSON.stringify(payload.headers),
    'Rows:',
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
    max_tokens: 1200,
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

  const cleaned = content.trim().replace(/^```json|```$/g, '').trim();
  const parsed = openAiResponseSchema.safeParse(JSON.parse(cleaned));
  if (!parsed.success) {
    return fallbackAiBatch(payload);
  }

  return parsed.data;
};
