"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Database, RefreshCw, Search, ShieldCheck, Tags } from 'lucide-react';
import { getCrmSchema, type CrmSchema } from '@/lib/api';

const fallbackSchema: CrmSchema = {
  fields: [
    'created_at',
    'name',
    'email',
    'country_code',
    'mobile_without_country_code',
    'company',
    'city',
    'state',
    'country',
    'lead_owner',
    'crm_status',
    'crm_note',
    'data_source',
    'possession_time',
    'description'
  ],
  statuses: ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'],
  dataSources: ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots']
};

const requiredFields = new Set(['name', 'email', 'mobile_without_country_code', 'crm_status', 'data_source']);

const prettify = (value: string) => value
  .split('_')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

export default function CrmFieldsPage() {
  const [schema, setSchema] = useState<CrmSchema>(fallbackSchema);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSchema = async () => {
    setLoading(true);
    setError('');
    try {
      setSchema(await getCrmSchema());
    } catch (loadError) {
      setSchema(fallbackSchema);
      setError(loadError instanceof Error ? loadError.message : 'Using local CRM schema fallback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchema();
  }, []);

  const filteredFields = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return schema.fields;
    return schema.fields.filter((field) => field.toLowerCase().includes(value) || prettify(field).toLowerCase().includes(value));
  }, [schema.fields, query]);

  return (
    <div className="crm-fields-page">
      <div className="toolbar">
        <div>
          <h2>CRM Fields</h2>
          <p className="muted">Inspect the importer schema, status catalog, and allowed data sources.</p>
        </div>
        <button type="button" onClick={loadSchema} disabled={loading}>
          <RefreshCw size={17} className={loading ? 'spin' : ''} />
          Sync Schema
        </button>
      </div>

      {error && (
        <div className="notice">
          <AlertCircle size={17} />
          Backend schema unavailable. Showing local schema from the frontend fallback.
        </div>
      )}

      <div className="metrics">
        <div><Database size={18} /><span>CRM Fields</span><strong>{schema.fields.length}</strong></div>
        <div><ShieldCheck size={18} /><span>Lead Statuses</span><strong>{schema.statuses.length}</strong></div>
        <div><Tags size={18} /><span>Data Sources</span><strong>{schema.dataSources.length}</strong></div>
      </div>

      <section className="schema-panel">
        <div className="panel-head">
          <div>
            <h3>Field Schema</h3>
            <p className="muted">These fields are used by AI mapping and backend validation.</p>
          </div>
          <label className="search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fields..." />
          </label>
        </div>

        <div className="field-grid">
          {filteredFields.map((field) => (
            <article className="field-card" key={field}>
              <div>
                <strong>{prettify(field)}</strong>
                <code>{field}</code>
              </div>
              <span className={requiredFields.has(field) ? 'required' : 'optional'}>
                {requiredFields.has(field) ? 'Core' : 'Optional'}
              </span>
            </article>
          ))}
        </div>
      </section>

      <div className="catalog-grid">
        <section className="catalog-card">
          <h3><ShieldCheck size={17} /> Allowed Lead Statuses</h3>
          {schema.statuses.map((status) => (
            <div className="catalog-row" key={status}>
              <CheckCircle2 size={15} />
              <span>{prettify(status.toLowerCase())}</span>
              <code>{status}</code>
            </div>
          ))}
        </section>

        <section className="catalog-card">
          <h3><Tags size={17} /> Data Source Catalog</h3>
          {schema.dataSources.map((source) => (
            <div className="catalog-row" key={source}>
              <CheckCircle2 size={15} />
              <span>{prettify(source)}</span>
              <code>{source}</code>
            </div>
          ))}
        </section>
      </div>

      <style jsx>{`
        .crm-fields-page{display:flex;flex-direction:column;gap:16px;min-width:0}
        h2,h3,p{margin:0}
        h2{font-size:24px;color:var(--text)}
        .muted{color:var(--muted);font-size:14px;margin-top:4px}
        .toolbar,.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;min-width:0}
        .toolbar button{min-height:40px;border:1px solid var(--border);border-radius:8px;background:var(--input);color:var(--text);display:flex;align-items:center;gap:8px;padding:0 14px;cursor:pointer;font-weight:700}
        .toolbar button:disabled{opacity:.65;cursor:not-allowed}
        .spin{animation:spin .9s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .notice{border:1px solid rgba(217,119,6,.3);background:rgba(217,119,6,.1);color:#d97706;border-radius:8px;padding:10px 12px;font-size:13px;display:flex;gap:8px;align-items:center}
        .metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .metrics div{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px;display:grid;grid-template-columns:auto 1fr;gap:4px 10px;align-items:center;box-shadow:var(--shadow)}
        .metrics svg{grid-row:span 2;color:var(--accent)}
        .metrics span{color:var(--muted);font-size:12px}
        .metrics strong{color:var(--text);font-size:21px}
        .schema-panel,.catalog-card{min-width:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;box-shadow:var(--shadow)}
        .search{height:40px;min-width:260px;border:1px solid var(--border);border-radius:8px;background:var(--input);display:flex;align-items:center;gap:8px;padding:0 11px;color:var(--muted)}
        .search input{border:0;outline:0;background:transparent;color:var(--text);width:100%}
        .field-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-top:14px}
        .field-card{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;min-width:0;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:13px}
        .field-card strong{display:block;color:var(--text);font-size:14px}
        code{display:block;color:var(--muted);font-size:12px;margin-top:5px;word-break:break-word}
        .required,.optional{border-radius:999px;padding:5px 8px;font-size:11px;font-weight:800}
        .required{background:rgba(37,99,235,.12);color:var(--accent)}
        .optional{background:var(--input);color:var(--muted)}
        .catalog-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .catalog-card h3{display:flex;align-items:center;gap:8px;color:var(--text);font-size:16px;margin-bottom:12px}
        .catalog-card h3 svg{color:var(--accent)}
        .catalog-row{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(120px,.9fr);gap:10px;align-items:center;border:1px solid var(--border);border-radius:8px;background:var(--card);padding:10px;margin-top:8px}
        .catalog-row svg{color:#16a34a}
        .catalog-row span{color:var(--text);font-size:13px}
        @media (max-width:900px){.metrics,.catalog-grid{grid-template-columns:1fr}.toolbar,.panel-head{flex-direction:column}.toolbar button{width:100%;justify-content:center;min-height:44px}.search{min-width:0;width:100%}}
        @media (max-width:620px){.field-grid{grid-template-columns:1fr}.catalog-row{grid-template-columns:auto 1fr}.catalog-row code{grid-column:2}.field-card{flex-direction:column}.required,.optional{width:max-content}}
        @media (max-width:420px){h2{font-size:21px}.schema-panel,.catalog-card{padding:12px}.metrics div{padding:12px}.catalog-row{padding:9px}}
      `}</style>
    </div>
  );
}
