"use client";
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Facebook,
  FileSpreadsheet,
  Globe2,
  Megaphone,
  MessageCircle,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  Workflow
} from 'lucide-react';

type LeadSource = {
  id: string;
  title: string;
  desc: string;
  type: string;
  status: 'connected' | 'attention' | 'draft';
  leadsToday: number;
  conversion: number;
  lastSync: string;
  owner: string;
  fieldsMapped: number;
  icon: React.ElementType;
};

const initialSources: LeadSource[] = [
  {
    id: 'facebook',
    title: 'Facebook Ads',
    desc: 'Lead forms from active Meta campaigns',
    type: 'Paid social',
    status: 'connected',
    leadsToday: 42,
    conversion: 18,
    lastSync: '8 min ago',
    owner: 'Inside Sales',
    fieldsMapped: 12,
    icon: Facebook
  },
  {
    id: 'google',
    title: 'Google Ads',
    desc: 'Search and display campaign enquiries',
    type: 'Paid search',
    status: 'connected',
    leadsToday: 31,
    conversion: 16,
    lastSync: '14 min ago',
    owner: 'Pre Sales',
    fieldsMapped: 11,
    icon: Megaphone
  },
  {
    id: 'website',
    title: 'Website Forms',
    desc: 'Contact, pricing, and callback requests',
    type: 'Website',
    status: 'attention',
    leadsToday: 17,
    conversion: 22,
    lastSync: 'Webhook issue',
    owner: 'CRM Ops',
    fieldsMapped: 9,
    icon: Globe2
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    desc: 'Inbound messages converted to leads',
    type: 'Messaging',
    status: 'connected',
    leadsToday: 26,
    conversion: 28,
    lastSync: '3 min ago',
    owner: 'Calling Team',
    fieldsMapped: 10,
    icon: MessageCircle
  },
  {
    id: 'csv',
    title: 'Manual CSV',
    desc: 'Bulk uploads with AI field cleanup',
    type: 'Manual import',
    status: 'connected',
    leadsToday: 58,
    conversion: 14,
    lastSync: 'Today, 2:40 AM',
    owner: 'Operations',
    fieldsMapped: 14,
    icon: FileSpreadsheet
  }
];

const recentLeads = [
  { name: 'Rohan Mehta', source: 'Facebook Ads', status: 'New', score: 86 },
  { name: 'Priya Nair', source: 'Website Forms', status: 'Needs review', score: 72 },
  { name: 'Aman Shah', source: 'WhatsApp', status: 'Assigned', score: 91 }
];

export default function LeadSourcesPage() {
  const [sources, setSources] = useState(initialSources);
  const [activeId, setActiveId] = useState(initialSources[0].id);
  const [draftName, setDraftName] = useState('');
  const [draftType, setDraftType] = useState('Partner portal');

  const activeSource = sources.find((source) => source.id === activeId) ?? sources[0];
  const totals = useMemo(() => {
    const leadsToday = sources.reduce((sum, source) => sum + source.leadsToday, 0);
    const connected = sources.filter((source) => source.status === 'connected').length;
    const avgConversion = Math.round(
      sources.reduce((sum, source) => sum + source.conversion, 0) / Math.max(sources.length, 1)
    );

    return { leadsToday, connected, avgConversion };
  }, [sources]);

  const addFutureSource = () => {
    const cleanName = draftName.trim() || 'Future Lead Source';
    const id = `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const nextSource: LeadSource = {
      id,
      title: cleanName,
      desc: 'Draft source ready for API, webhook, or manual import setup',
      type: draftType,
      status: 'draft',
      leadsToday: 0,
      conversion: 0,
      lastSync: 'Not connected',
      owner: 'Unassigned',
      fieldsMapped: 0,
      icon: UserPlus
    };

    setSources((current) => [nextSource, ...current]);
    setActiveId(id);
    setDraftName('');
  };

  return (
    <div className="lead-sources">
      <div className="top-row">
        <div>
          <h2>Lead Sources</h2>
          <p className="muted">Monitor every channel, manage routing, and prepare future lead sources.</p>
        </div>
        <Link href="/import-csv" className="primary-action">
          <FileSpreadsheet size={18} />
          Import CSV
        </Link>
      </div>

      <div className="metrics">
        <div className="metric">
          <Activity size={19} />
          <div>
            <span>Leads Today</span>
            <strong>{totals.leadsToday}</strong>
          </div>
        </div>
        <div className="metric">
          <ShieldCheck size={19} />
          <div>
            <span>Connected</span>
            <strong>{totals.connected}/{sources.length}</strong>
          </div>
        </div>
        <div className="metric">
          <Workflow size={19} />
          <div>
            <span>Avg Conversion</span>
            <strong>{totals.avgConversion}%</strong>
          </div>
        </div>
      </div>

      <div className="workspace-layout">
        <section className="source-list">
          <div className="section-title">
            <div>
              <h3>Channels</h3>
              <p className="muted">Click Manage to configure a source.</p>
            </div>
            <button className="icon-btn" type="button" onClick={addFutureSource} aria-label="Add future lead source">
              <Plus size={18} />
            </button>
          </div>

          <div className="add-source">
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Future source name"
            />
            <select value={draftType} onChange={(event) => setDraftType(event.target.value)}>
              <option>Partner portal</option>
              <option>Broker network</option>
              <option>Landing page</option>
              <option>Offline event</option>
            </select>
            <button type="button" onClick={addFutureSource}>
              <Plus size={16} />
              Add
            </button>
          </div>

          <div className="source-grid">
            {sources.map((source) => {
              const Icon = source.icon;
              const isActive = activeSource.id === source.id;

              return (
                <article key={source.id} className={`source-card ${isActive ? 'selected' : ''}`}>
                  <div className="source-main">
                    <div className="source-icon">
                      <Icon size={21} />
                    </div>
                    <div className="source-copy">
                      <div className="card-topline">
                        <h4>{source.title}</h4>
                        <span className={`status ${source.status}`}>{source.status}</span>
                      </div>
                      <p>{source.desc}</p>
                    </div>
                  </div>

                  <div className="source-stats">
                    <span>{source.leadsToday} today</span>
                    <span>{source.conversion}% conversion</span>
                    <span>{source.lastSync}</span>
                  </div>

                  <div className="card-actions">
                    {source.id === 'csv' && (
                      <Link href="/import-csv" className="text-link">
                        Upload
                        <ArrowRight size={15} />
                      </Link>
                    )}
                    <button type="button" className="manage-btn" onClick={() => setActiveId(source.id)}>
                      Manage
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="manage-panel" key={activeSource.id}>
          <div className="panel-head">
            <div>
              <span className="eyebrow">Manage Source</span>
              <h3>{activeSource.title}</h3>
              <p className="muted">{activeSource.type} - {activeSource.owner}</p>
            </div>
            <span className={`health ${activeSource.status}`}>
              {activeSource.status === 'attention' ? <CircleAlert size={16} /> : <CheckCircle2 size={16} />}
              {activeSource.status === 'draft' ? 'Draft' : activeSource.status === 'attention' ? 'Review needed' : 'Healthy'}
            </span>
          </div>

          <div className="manage-actions">
            <button type="button"><RefreshCw size={16} /> Sync now</button>
            <button type="button"><Settings2 size={16} /> Connection</button>
            <button type="button" className="danger"><Trash2 size={16} /> Disable</button>
          </div>

          <div className="config-grid">
            <div className="config-item">
              <span>Lead owner</span>
              <strong>{activeSource.owner}</strong>
            </div>
            <div className="config-item">
              <span>Mapped fields</span>
              <strong>{activeSource.fieldsMapped}/14</strong>
            </div>
            <div className="config-item">
              <span>Duplicate rule</span>
              <strong>Email or mobile</strong>
            </div>
            <div className="config-item">
              <span>Auto assignment</span>
              <strong>Round robin</strong>
            </div>
          </div>

          <div className="rules">
            <h4><SlidersHorizontal size={17} /> Quality rules</h4>
            <label><input type="checkbox" defaultChecked /> Skip leads without email or mobile</label>
            <label><input type="checkbox" defaultChecked /> Merge duplicates created in the last 30 days</label>
            <label><input type="checkbox" defaultChecked={activeSource.status !== 'draft'} /> Notify owner when lead score is above 80</label>
          </div>

          <div className="mapping">
            <h4><ClipboardList size={17} /> Field mapping</h4>
            {[
              ['Full name', 'name'],
              ['Phone / WhatsApp', 'mobile_without_country_code'],
              ['Campaign / Form', 'data_source'],
              ['Notes', 'crm_note']
            ].map(([incoming, crm]) => (
              <div className="mapping-row" key={incoming}>
                <span>{incoming}</span>
                <ArrowRight size={14} />
                <strong>{crm}</strong>
              </div>
            ))}
          </div>

          <div className="recent">
            <h4>Recent leads</h4>
            {recentLeads.map((lead) => (
              <div className="lead-row" key={lead.name}>
                <div>
                  <strong>{lead.name}</strong>
                  <span>{lead.source} - {lead.status}</span>
                </div>
                <b>{lead.score}</b>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style jsx>{`
        .lead-sources{display:flex;flex-direction:column;gap:18px}
        .top-row{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
        h2,h3,h4,p{margin:0}
        h2{font-size:22px;color:var(--text)}
        h3{font-size:17px;color:var(--text)}
        h4{font-size:15px;color:var(--text)}
        .muted{color:var(--muted);font-size:14px;margin-top:4px}
        .primary-action,.manage-btn,.text-link,.add-source button,.manage-actions button,.icon-btn{border:1px solid var(--border);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;text-decoration:none;cursor:pointer}
        .primary-action{background:var(--accent);color:#fff;padding:0 14px;border-color:var(--accent);font-weight:700}
        .metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .metric{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px;display:flex;align-items:center;gap:12px;box-shadow:var(--shadow)}
        .metric svg{color:var(--accent)}
        .metric span,.config-item span,.lead-row span{display:block;color:var(--muted);font-size:12px}
        .metric strong{display:block;color:var(--text);font-size:22px;line-height:1.1;margin-top:4px}
        .workspace-layout{display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:16px;align-items:start}
        .source-list,.manage-panel{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;box-shadow:var(--shadow)}
        .section-title,.panel-head,.card-topline,.card-actions{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .icon-btn{width:40px;background:var(--input);color:var(--text)}
        .add-source{display:grid;grid-template-columns:1fr 160px auto;gap:10px;margin:14px 0}
        .add-source input,.add-source select{height:40px;border-radius:8px;border:1px solid var(--border);background:var(--input);color:var(--text);padding:0 12px;outline:none}
        .add-source button{background:var(--accent);color:#fff;padding:0 14px;border-color:var(--accent);font-weight:700}
        .source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .source-card{border:1px solid var(--border);background:var(--card);border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:14px}
        .source-card.selected{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.14)}
        .source-main{display:flex;gap:12px;align-items:flex-start}
        .source-icon{width:42px;height:42px;min-width:42px;border-radius:8px;background:var(--input);color:var(--accent);display:flex;align-items:center;justify-content:center}
        .source-copy{min-width:0;flex:1}
        .source-copy p{color:var(--muted);font-size:13px;margin-top:5px;line-height:1.4}
        .source-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;color:var(--muted);font-size:12px}
        .source-stats span{background:var(--input);border-radius:8px;padding:8px;min-height:34px}
        .status,.health{border-radius:999px;padding:5px 9px;font-size:12px;text-transform:capitalize;white-space:nowrap}
        .status.connected,.health.connected{background:rgba(22,163,74,.12);color:#16a34a}
        .status.attention,.health.attention{background:rgba(217,119,6,.14);color:#d97706}
        .status.draft,.health.draft{background:var(--input);color:var(--muted)}
        .text-link{color:var(--accent);background:transparent;border:0;min-height:36px;font-weight:700}
        .manage-btn{background:var(--input);color:var(--text);padding:0 12px}
        .eyebrow{color:var(--accent);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
        .health{display:flex;align-items:center;gap:6px}
        .manage-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:16px 0}
        .manage-actions button{background:var(--input);color:var(--text);padding:0 10px;font-size:13px}
        .manage-actions .danger{color:var(--danger)}
        .config-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .config-item{border:1px solid var(--border);border-radius:8px;padding:12px;background:var(--card)}
        .config-item strong{display:block;color:var(--text);margin-top:4px;font-size:14px}
        .rules,.mapping,.recent{border-top:1px solid var(--border);margin-top:16px;padding-top:16px}
        .rules h4,.mapping h4{display:flex;align-items:center;gap:8px;margin-bottom:10px}
        .rules label{display:flex;align-items:center;gap:10px;color:var(--text);font-size:13px;line-height:1.4;margin-top:10px}
        .rules input{accent-color:var(--accent)}
        .mapping-row,.lead-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--border);border-radius:8px;padding:10px;margin-top:8px;background:var(--card)}
        .mapping-row span{color:var(--muted);font-size:13px}
        .mapping-row strong{font-size:13px;color:var(--text);text-align:right}
        .lead-row strong{display:block;color:var(--text);font-size:13px}
        .lead-row b{width:34px;height:34px;border-radius:999px;background:rgba(37,99,235,.12);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:13px}
        @media (max-width:1180px){.workspace-layout{grid-template-columns:1fr}.manage-panel{order:-1}.source-grid{grid-template-columns:1fr 1fr}}
        @media (max-width:760px){.top-row,.panel-head{flex-direction:column;align-items:stretch}.metrics,.source-grid,.config-grid{grid-template-columns:1fr}.add-source{grid-template-columns:1fr}.workspace-layout{gap:12px}.source-stats,.manage-actions{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
