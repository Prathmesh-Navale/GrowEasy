import { describe, expect, it } from 'vitest';
import { hasUsableContact, normalizeAiResponse } from '../aiNormalization.js';
import { mapRowToLeadData } from '../../services/importService.js';

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

  it('rejects unsupported status and data source values', () => {
    const result = normalizeAiResponse({
      sourceRowIndex: 1,
      status: 'imported',
      confidence: 1.5,
      data: {
        created_at: 'not a date',
        name: 'Jane Doe',
        email: 'jane@example.com',
        country_code: '',
        mobile_without_country_code: '',
        company: '',
        city: '',
        state: '',
        country: '',
        lead_owner: '',
        crm_status: 'CALL_LATER',
        crm_note: 'line 1\nline 2',
        data_source: 'random_source',
        possession_time: '',
        description: 'desc\nnext'
      }
    });

    expect(result.confidence).toBe(1);
    expect(result.data.created_at).toBe('');
    expect(result.data.crm_status).toBe('');
    expect(result.data.data_source).toBe('');
    expect(result.data.crm_note).toBe('line 1\\nline 2');
    expect(result.data.description).toBe('desc\\nnext');
  });

  it('marks records without email and mobile as unusable', () => {
    const result = normalizeAiResponse({
      sourceRowIndex: 2,
      status: 'imported',
      confidence: 0.5,
      data: {
        created_at: '',
        name: 'No Contact',
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
      }
    });

    expect(hasUsableContact(result)).toBe(false);
  });

  it('maps CSV fields into CRM fields without duplicating them in crm_note', () => {
    const result = mapRowToLeadData({
      created_at: '2026-05-13 14:20',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91 9876543210',
      company: 'GrowEasy',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      owner: 'Rahul',
      status: 'GOOD_LEA',
      source: 'meridian tower',
      possession: 'Dec-26',
      description: 'Interested in 2BHK apartment',
      remarks: 'Client requested callback'
    });

    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.country_code).toBe('91');
    expect(result.mobile_without_country_code).toBe('9876543210');
    expect(result.crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(result.data_source).toBe('meridian_tower');
    expect(result.crm_note).toContain('Client requested callback');
    expect(result.crm_note).not.toContain('created_at');
    expect(result.crm_note).not.toContain('John Doe');
    expect(result.crm_note).not.toContain('GrowEasy');
  });

  it('keeps invalid data sources blank', () => {
    const result = mapRowToLeadData({
      name: 'Jane Doe',
      email: 'jane@example.com',
      source: 'ABS',
      comments: 'Asked for floor plan'
    });

    expect(result.data_source).toBe('');
    expect(result.crm_note).toContain('Asked for floor plan');
  });
});
