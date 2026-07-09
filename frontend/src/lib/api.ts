const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export async function previewImport(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/import/preview`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function processImport(file: File, leadSourceId?: string) {
  const form = new FormData();
  form.append('file', file);
  if (leadSourceId) form.append('leadSourceId', leadSourceId);
  const res = await fetch(`${API_BASE_URL}/api/import/process`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type ImportHistoryJob = {
  id: string;
  leadSource?: {
    id: string;
    name: string;
    channelType: string;
  } | null;
  fileName: string;
  fileSize: number;
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  batchCount: number;
  failedBatchCount: number;
  skippedReasons: string[];
};

export async function listImportHistory(): Promise<{ jobs: ImportHistoryJob[] }> {
  const res = await fetch(`${API_BASE_URL}/api/import/history`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type CrmSchema = {
  fields: string[];
  statuses: string[];
  dataSources: string[];
};

export async function getCrmSchema(): Promise<CrmSchema> {
  const res = await fetch(`${API_BASE_URL}/api/import/schema`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type LeadSourcePayload = {
  name: string;
  description?: string;
  channelType: string;
  status: 'CONNECTED' | 'ATTENTION' | 'DRAFT';
  owner?: string;
  connectionType: 'API' | 'WEBHOOK' | 'MANUAL' | 'CSV';
  syncFrequency: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'ON_DEMAND';
  webhookUrl?: string;
  duplicateRule: 'EMAIL_OR_MOBILE' | 'EMAIL_ONLY' | 'MOBILE_ONLY';
  autoAssignment: 'ROUND_ROBIN' | 'SOURCE_OWNER' | 'MANUAL_REVIEW';
  qualityRules: string[];
  fieldMappings: Record<string, string>;
};

export type LeadSourceRecord = LeadSourcePayload & {
  id: string;
  leadsToday?: number;
  conversionRate?: number;
  lastSyncLabel?: string;
  createdAt?: string;
};

export async function listLeadSources(): Promise<{ sources: LeadSourceRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/api/lead-sources`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createLeadSource(payload: LeadSourcePayload) {
  const res = await fetch(`${API_BASE_URL}/api/lead-sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default { previewImport, processImport, listImportHistory, getCrmSchema, listLeadSources, createLeadSource };
