import { describe, expect, it } from 'vitest';
import { normalizeAiResponse } from '../aiNormalization.js';

describe('normalizeAiResponse', () => {
  it('normalizes whitespace and keeps valid structure', () => {
    const result = normalizeAiResponse({
      sourceRowIndex: 1,
      status: 'imported',
      confidence: 0.91,
      data: {
        created_at: '2024-01-01',
        name: '  Jane Doe  ',
        email: 'jane@example.com',
        country_code: '+91',
        mobile_without_country_code: '9876543210',
        company: 'GrowEasy',
        city: 'Bengaluru',
        state: 'KA',
        country: 'India',
        lead_owner: 'Sales',
        crm_status: 'GOOD_LEAD_FOLLOW_UP',
        crm_note: '  extra note  ',
        data_source: 'leads_on_demand',
        possession_time: '',
        description: '  Sample lead  '
      }
    });

    expect(result.data.name).toBe('Jane Doe');
    expect(result.data.crm_note).toBe('extra note');
    expect(result.data.description).toBe('Sample lead');
  });
});
