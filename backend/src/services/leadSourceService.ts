import { z } from 'zod';
import prisma from './dbService.js';

const leadSourceSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  description: z.string().trim().optional().default(''),
  channelType: z.string().trim().min(2, 'Channel type is required'),
  status: z.enum(['CONNECTED', 'ATTENTION', 'DRAFT']).default('DRAFT'),
  owner: z.string().trim().optional().default('Unassigned'),
  connectionType: z.enum(['API', 'WEBHOOK', 'MANUAL', 'CSV']).default('MANUAL'),
  syncFrequency: z.enum(['REAL_TIME', 'HOURLY', 'DAILY', 'ON_DEMAND']).default('ON_DEMAND'),
  webhookUrl: z.string().trim().optional().default(''),
  duplicateRule: z.enum(['EMAIL_OR_MOBILE', 'EMAIL_ONLY', 'MOBILE_ONLY']).default('EMAIL_OR_MOBILE'),
  autoAssignment: z.enum(['ROUND_ROBIN', 'SOURCE_OWNER', 'MANUAL_REVIEW']).default('ROUND_ROBIN'),
  qualityRules: z.array(z.string()).default([]),
  fieldMappings: z.record(z.string()).default({})
});

export type LeadSourceInput = z.infer<typeof leadSourceSchema>;

export const listLeadSourcesService = async () => {
  return prisma.leadSource.findMany({ orderBy: { createdAt: 'desc' } });
};

export const createLeadSourceService = async (input: unknown) => {
  const data = leadSourceSchema.parse(input);

  return prisma.leadSource.create({
    data: {
      name: data.name,
      description: data.description,
      channelType: data.channelType,
      status: data.status,
      owner: data.owner,
      connectionType: data.connectionType,
      syncFrequency: data.syncFrequency,
      webhookUrl: data.webhookUrl || null,
      duplicateRule: data.duplicateRule,
      autoAssignment: data.autoAssignment,
      qualityRules: data.qualityRules,
      fieldMappings: data.fieldMappings,
      lastSyncLabel: data.status === 'CONNECTED' ? 'Ready to sync' : 'Not connected'
    }
  });
};
