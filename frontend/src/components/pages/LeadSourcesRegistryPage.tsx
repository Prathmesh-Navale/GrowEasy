"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  FileSpreadsheet,
  Globe2,
  Megaphone,
  MessageCircle,
  Plus,
  Settings2,
  ShieldCheck,
  UserPlus,
  Workflow,
  X
} from 'lucide-react';
import { createLeadSource, listLeadSources, type LeadSourcePayload } from '@/lib/api';

type LeadSourceRecord = LeadSourcePayload & {
  id: string;
  leadsToday: number;
  conversionRate: number;
  lastSyncLabel: string;
  createdAt?: string;
};

const starterSources: LeadSourceRecord[] = [
  {
    id: 'facebook',
    name: 'Facebook Ads',
    description: 'Lead forms from active Meta campaigns',
    channelType: 'Paid social',
    status: 'CONNECTED',
    owner: 'Inside Sales',
    connectionType: 'API',
    syncFrequency: 'REAL_TIME',
    duplicateRule: 'EMAIL_OR_MOBILE',
    autoAssignment: 'ROUND_ROBIN',
    qualityRules: ['Require email or mobile', 'Merge duplicates in 30 days'],
    fieldMappings: { full_name: 'name', phone: 'mobile_without_country_code', campaign: 'data_source' },
    leadsToday: 42,
    conversionRate: 18,
    lastSyncLabel: '8 min ago'
  },
  {
    id: 'website',
    name: 'Website Forms',
    description: 'Contact, pricing, and callback requests',
    channelType: 'Website',
    status: 'ATTENTION',
    owner: 'CRM Ops',
    connectionType: 'WEBHOOK',
    syncFrequency: 'REAL_TIME',
    webhookUrl: 'https://groweasy.app/api/forms',
    duplicateRule: 'EMAIL_OR_MOBILE',
    autoAssignment: 'SOURCE_OWNER',
    qualityRules: ['Review missing budget', 'Notify high-intent enquiries'],
    fieldMappings: { name: 'name', email: 'email', message: 'crm_note' },
    leadsToday: 17,
    conversionRate: 22,
    lastSyncLabel: 'Webhook issue'
  },
  {
    id: 'csv',
    name: 'Manual CSV',
    description: 'Bulk uploads with AI field cleanup',
    channelType: 'Manual import',
    status: 'CONNECTED',
    owner: 'Operations',
    connectionType: 'CSV',
    syncFrequency: 'ON_DEMAND',
    duplicateRule: 'EMAIL_OR_MOBILE',
    autoAssignment: 'MANUAL_REVIEW',
    qualityRules: ['Skip rows without contact info', 'Normalize names and notes'],
    fieldMappings: { name: 'name', mobile: 'mobile_without_country_code', notes: 'crm_note' },
    leadsToday: 58,
    conversionRate: 14,
    lastSyncLabel: 'Today, 2:40 AM'
  }
];

const emptyForm: LeadSourcePayload = {
  name: '',
  description: '',
  channelType: 'Partner portal',
  status: 'DRAFT',
  owner: 'Unassigned',
  connectionType: 'MANUAL',
  syncFrequency: 'ON_DEMAND',
  webhookUrl: '',
  duplicateRule: 'EMAIL_OR_MOBILE',
  autoAssignment: 'ROUND_ROBIN',
  qualityRules: ['Require email or mobile'],
  fieldMappings: {
    name: 'name',
    phone: 'mobile_without_country_code',
    notes: 'crm_note'
  }
};

const normalizeSource = (source: any): LeadSourceRecord => ({
  id: source.id,
  name: source.name,
  description: source.description ?? '',
  channelType: source.channelType,
  status: source.status,
  owner: source.owner ?? 'Unassigned',
  connectionType: source.connectionType,
  syncFrequency: source.syncFrequency,
  webhookUrl: source.webhookUrl ?? '',
  duplicateRule: source.duplicateRule,
  autoAssignment: source.autoAssignment,
  qualityRules: Array.isArray(source.qualityRules) ? source.qualityRules : [],
  fieldMappings: source.fieldMappings && typeof source.fieldMappings === 'object' ? source.fieldMappings : {},
  leadsToday: source.leadsToday ?? 0,
  conversionRate: source.conversionRate ?? 0,
  lastSyncLabel: source.lastSyncLabel ?? 'Not connected',
  createdAt: source.createdAt
});

const getSourceIcon = (source: LeadSourceRecord) => {
  const value = `${source.name} ${source.channelType}`.toLowerCase();
  if (value.includes('csv') || value.includes('manual')) return FileSpreadsheet;
  if (value.includes('whatsapp') || value.includes('message')) return MessageCircle;
  if (value.includes('ad') || value.includes('campaign')) return Megaphone;
  if (value.includes('web') || value.includes('landing')) return Globe2;
  return UserPlus;
};

export default function LeadSourcesRegistryPage() {
  const [sources, setSources] = useState<LeadSourceRecord[]>(starterSources);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LeadSourcePayload>(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    listLeadSources()
      .then((data) => {
        if (!mounted) return;
        setError('');
        const apiSources = Array.isArray(data.sources) ? data.sources.map(normalizeSource) : [];
        if (apiSources.length) setSources(apiSources);
      })
      .catch((loadError) => {
        if (mounted) {
          const message = loadError instanceof Error ? loadError.message : 'Unable to reach backend';
          setError(`Lead source API unavailable: ${message}`);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedSource = sources.find((source) => source.id === selectedId) ?? null;
  const totals = useMemo(() => ({
    today: sources.reduce((sum, source) => sum + source.leadsToday, 0),
    connected: sources.filter((source) => source.status === 'CONNECTED').length,
    review: sources.filter((source) => source.status === 'ATTENTION').length
  }), [sources]);

  const updateForm = (key: keyof LeadSourcePayload, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitSource = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim(),
        owner: form.owner?.trim() || 'Unassigned',
        webhookUrl: form.webhookUrl?.trim()
      };

      if (!payload.name) {
        throw new Error('Lead source name is required.');
      }

      const result = await createLeadSource(payload);
      const created = normalizeSource(result.source);
      setSources((current) => [created, ...current]);
      setSelectedId(created.id);
    } catch (apiError) {
      const fallback: LeadSourceRecord = {
        ...form,
        id: `local-${Date.now()}`,
        name: form.name.trim() || 'New Lead Source',
        owner: form.owner?.trim() || 'Unassigned',
        leadsToday: 0,
        conversionRate: 0,
        lastSyncLabel: 'Not connected'
      };
      setSources((current) => [fallback, ...current]);
      setSelectedId(fallback.id);
      setError(apiError instanceof Error ? apiError.message : 'Saved locally because backend failed.');
    } finally {
      setSaving(false);
      setShowForm(false);
      setForm(emptyForm);
    }
  };

  return (
    <div className="lead-page">
      <div className="page-toolbar">
        <div>
          <h2>Lead Sources</h2>
          <p>Build and manage every source that can create CRM leads.</p>
        </div>
        <div className="toolbar-actions">
          <Link href="/import-csv" className="secondary-action">
            <FileSpreadsheet size={17} />
            Import CSV
          </Link>
          <button className="primary-action" type="button" onClick={() => setShowForm(true)}>
            <Plus size={17} />
            Add Lead Source
          </button>
        </div>
      </div>

      {error && <div className="notice">{error}</div>}

      <div className="metrics">
        <div><Activity size={18} /><span>Leads Today</span><strong>{totals.today}</strong></div>
        <div><ShieldCheck size={18} /><span>Connected Sources</span><strong>{totals.connected}</strong></div>
        <div><CircleAlert size={18} /><span>Needs Review</span><strong>{totals.review}</strong></div>
      </div>

      <div className="registry-layout">
        <section className="source-table">
          <div className="section-head">
            <div>
              <h3>Source Registry</h3>
              <p>Select Manage to open full source information.</p>
            </div>
          </div>

          <div className="table">
            <div className="table-row header">
              <span>Source</span>
              <span>Type</span>
              <span>Status</span>
              <span>Owner</span>
              <span>Today</span>
              <span></span>
            </div>
            {sources.map((source) => {
              const Icon = getSourceIcon(source);
              return (
                <div className={`table-row ${selectedId === source.id ? 'active' : ''}`} key={source.id}>
                  <div className="source-name">
                    <span className="source-icon"><Icon size={18} /></span>
                    <div>
                      <strong>{source.name}</strong>
                      <small>{source.description || 'No description added'}</small>
                    </div>
                  </div>
                  <span>{source.channelType}</span>
                  <span className={`status ${source.status.toLowerCase()}`}>{source.status.toLowerCase()}</span>
                  <span>{source.owner}</span>
                  <span>{source.leadsToday}</span>
                  <button type="button" onClick={() => setSelectedId(source.id)}>
                    Manage
                    <ArrowRight size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="details-panel" key={selectedSource?.id ?? 'empty'}>
          {!selectedSource ? (
            <div className="empty-details">
              <Settings2 size={28} />
              <h3>No source opened</h3>
              <p>Click Manage on any lead source to view connection, rules, mappings, and performance details.</p>
            </div>
          ) : (
            <>
              <div className="details-head">
                <div>
                  <span>Lead Source Details</span>
                  <h3>{selectedSource.name}</h3>
                  <p>{selectedSource.description || 'No description added'}</p>
                </div>
                <span className={`health ${selectedSource.status.toLowerCase()}`}>
                  {selectedSource.status === 'ATTENTION' ? <CircleAlert size={16} /> : <CheckCircle2 size={16} />}
                  {selectedSource.status.toLowerCase()}
                </span>
              </div>

              <div className="info-grid">
                <div><span>Channel</span><strong>{selectedSource.channelType}</strong></div>
                <div><span>Connection</span><strong>{selectedSource.connectionType}</strong></div>
                <div><span>Sync</span><strong>{selectedSource.syncFrequency}</strong></div>
                <div><span>Owner</span><strong>{selectedSource.owner}</strong></div>
                <div><span>Duplicate Rule</span><strong>{selectedSource.duplicateRule}</strong></div>
                <div><span>Assignment</span><strong>{selectedSource.autoAssignment}</strong></div>
                <div><span>Conversion</span><strong>{selectedSource.conversionRate}%</strong></div>
                <div><span>Last Sync</span><strong>{selectedSource.lastSyncLabel}</strong></div>
              </div>

              <div className="detail-section">
                <h4><Workflow size={16} /> Quality Rules</h4>
                {selectedSource.qualityRules.length ? selectedSource.qualityRules.map((rule) => (
                  <div className="rule" key={rule}><CheckCircle2 size={15} /> {rule}</div>
                )) : <p>No rules configured yet.</p>}
              </div>

              <div className="detail-section">
                <h4><ClipboardList size={16} /> Field Mapping</h4>
                {Object.entries(selectedSource.fieldMappings).map(([incoming, crm]) => (
                  <div className="mapping-row" key={incoming}>
                    <span>{incoming}</span>
                    <ArrowRight size={14} />
                    <strong>{crm}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>

      {showForm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="source-form" onSubmit={submitSource}>
            <div className="form-head">
              <div>
                <h3>Add Lead Source</h3>
                <p>Create a source once, then manage its rules and mapping from the registry.</p>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowForm(false)} aria-label="Close form">
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Source name
                <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Example: Expo 2026 Leads" />
              </label>
              <label>
                Channel type
                <select value={form.channelType} onChange={(event) => updateForm('channelType', event.target.value)}>
                  <option>Partner portal</option>
                  <option>Broker network</option>
                  <option>Landing page</option>
                  <option>Offline event</option>
                  <option>Paid campaign</option>
                  <option>Manual import</option>
                </select>
              </label>
              <label>
                Owner
                <input value={form.owner} onChange={(event) => updateForm('owner', event.target.value)} placeholder="Sales team" />
              </label>
              <label>
                Status
                <select value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                  <option value="DRAFT">Draft</option>
                  <option value="CONNECTED">Connected</option>
                  <option value="ATTENTION">Needs review</option>
                </select>
              </label>
              <label>
                Connection type
                <select value={form.connectionType} onChange={(event) => updateForm('connectionType', event.target.value)}>
                  <option value="MANUAL">Manual</option>
                  <option value="CSV">CSV</option>
                  <option value="WEBHOOK">Webhook</option>
                  <option value="API">API</option>
                </select>
              </label>
              <label>
                Sync frequency
                <select value={form.syncFrequency} onChange={(event) => updateForm('syncFrequency', event.target.value)}>
                  <option value="ON_DEMAND">On demand</option>
                  <option value="REAL_TIME">Real time</option>
                  <option value="HOURLY">Hourly</option>
                  <option value="DAILY">Daily</option>
                </select>
              </label>
              <label className="wide">
                Webhook URL
                <input value={form.webhookUrl} onChange={(event) => updateForm('webhookUrl', event.target.value)} placeholder="Optional" />
              </label>
              <label className="wide">
                Description
                <textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Where these leads come from and how sales should treat them" />
              </label>
            </div>

            <div className="form-footer">
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="submit-btn" disabled={saving}>{saving ? 'Creating...' : 'Create Source'}</button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .lead-page{display:flex;flex-direction:column;gap:18px;min-width:0}
        h2,h3,h4,p{margin:0}
        .page-toolbar{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
        .page-toolbar h2{font-size:22px;color:var(--text)}
        .page-toolbar p,.section-head p,.empty-details p,.details-head p,.source-form p{color:var(--muted);font-size:14px;margin-top:4px}
        .toolbar-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .primary-action,.secondary-action,.table-row button,.form-footer button,.close-btn{border:1px solid var(--border);border-radius:8px;min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;cursor:pointer}
        .primary-action,.submit-btn{background:var(--accent);border-color:var(--accent);color:#fff;padding:0 14px;font-weight:700}
        .secondary-action{background:var(--input);color:var(--text);padding:0 14px}
        .notice{border:1px solid rgba(217,119,6,.3);background:rgba(217,119,6,.1);color:#d97706;border-radius:8px;padding:10px 12px;font-size:13px}
        .metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .metrics div{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px;display:grid;grid-template-columns:auto 1fr;gap:4px 10px;align-items:center;box-shadow:var(--shadow)}
        .metrics svg{grid-row:span 2;color:var(--accent)}
        .metrics span{color:var(--muted);font-size:12px}
        .metrics strong{color:var(--text);font-size:21px}
        .registry-layout{display:grid;grid-template-columns:minmax(0,1fr) 410px;gap:16px;align-items:start}
        .source-table,.details-panel{min-width:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;box-shadow:var(--shadow)}
        .section-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}
        .table{display:flex;flex-direction:column;border:1px solid var(--border);border-radius:8px;overflow:hidden}
        .table-row{display:grid;grid-template-columns:minmax(220px,1.5fr) 120px 110px 110px 70px 110px;gap:12px;align-items:center;padding:12px;border-top:1px solid var(--border);background:var(--card);color:var(--text);font-size:13px}
        .table-row:first-child{border-top:0}
        .table-row.header{background:var(--input);color:var(--muted);font-size:12px;font-weight:700;text-transform:uppercase}
        .table-row.active{box-shadow:inset 3px 0 0 var(--accent);background:rgba(37,99,235,.06)}
        .source-name{display:flex;align-items:center;gap:10px;min-width:0}
        .source-name div{min-width:0}
        .source-name strong{display:block;color:var(--text);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .source-name small{display:block;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .source-icon{width:36px;height:36px;min-width:36px;border-radius:8px;background:var(--input);color:var(--accent);display:flex;align-items:center;justify-content:center}
        .status,.health{border-radius:999px;padding:5px 9px;font-size:12px;text-transform:capitalize;white-space:nowrap;width:max-content}
        .connected{background:rgba(22,163,74,.12);color:#16a34a}
        .attention{background:rgba(217,119,6,.14);color:#d97706}
        .draft{background:var(--input);color:var(--muted)}
        .table-row button{background:var(--input);color:var(--text);padding:0 10px;font-weight:700}
        .empty-details{text-align:center;padding:64px 24px;color:var(--muted)}
        .empty-details svg{color:var(--accent);margin-bottom:12px}
        .empty-details h3{color:var(--text)}
        .details-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:1px solid var(--border);padding-bottom:14px}
        .details-head span:first-child{color:var(--accent);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
        .health{display:flex;align-items:center;gap:6px}
        .info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}
        .info-grid div{border:1px solid var(--border);border-radius:8px;padding:11px;background:var(--card)}
        .info-grid span{display:block;color:var(--muted);font-size:12px}
        .info-grid strong{display:block;color:var(--text);font-size:13px;margin-top:4px}
        .detail-section{border-top:1px solid var(--border);padding-top:14px;margin-top:14px}
        .detail-section h4{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text);margin-bottom:10px}
        .detail-section p{color:var(--muted);font-size:13px}
        .rule,.mapping-row{border:1px solid var(--border);border-radius:8px;background:var(--card);padding:10px;margin-top:8px;color:var(--text);font-size:13px}
        .rule{display:flex;align-items:center;gap:8px}
        .rule svg{color:#16a34a}
        .mapping-row{display:flex;justify-content:space-between;align-items:center;gap:10px}
        .mapping-row span{color:var(--muted)}
        .modal-backdrop{position:fixed;inset:0;background:rgba(2,6,23,.62);z-index:80;display:flex;align-items:center;justify-content:center;padding:20px}
        .source-form{width:min(760px,100%);max-height:calc(100vh - 40px);overflow:auto;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.35)}
        .form-head{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--border);padding-bottom:14px;margin-bottom:14px}
        .close-btn{width:40px;background:var(--input);color:var(--text)}
        .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        label{display:flex;flex-direction:column;gap:6px;color:var(--text);font-size:13px;font-weight:700}
        input,select,textarea{width:100%;min-width:0;border:1px solid var(--border);background:var(--input);color:var(--text);border-radius:8px;padding:10px 12px;outline:none;font-weight:400}
        textarea{min-height:84px;resize:vertical}
        .wide{grid-column:1/-1}
        .form-footer{display:flex;justify-content:flex-end;gap:10px;border-top:1px solid var(--border);padding-top:14px;margin-top:16px}
        .form-footer button{padding:0 14px;background:var(--input);color:var(--text)}
        .form-footer .submit-btn{background:var(--accent);color:#fff;border-color:var(--accent)}
        @media (max-width:1180px){.registry-layout{grid-template-columns:1fr}.details-panel{order:-1}.table-row{grid-template-columns:minmax(220px,1fr) 110px 100px 90px}.table-row span:nth-child(4),.table-row span:nth-child(5){display:none}}
        @media (max-width:760px){.page-toolbar,.toolbar-actions,.details-head,.form-head{flex-direction:column;align-items:stretch}.primary-action,.secondary-action{width:100%}.metrics,.form-grid,.info-grid{grid-template-columns:1fr}.table-row,.table-row.header{grid-template-columns:1fr}.table-row.header{display:none}.table-row button{width:100%}.modal-backdrop{align-items:flex-start;padding:12px}.source-form{max-height:calc(100dvh - 24px);padding:14px}.form-footer{flex-direction:column}.form-footer button{width:100%;min-height:44px}.empty-details{padding:34px 16px}}
        @media (max-width:420px){.source-table,.details-panel{padding:12px}.metrics div{padding:12px}.table-row{padding:11px}.health{width:100%;justify-content:center}.mapping-row{align-items:flex-start;flex-direction:column}}
      `}</style>
    </div>
  );
}
