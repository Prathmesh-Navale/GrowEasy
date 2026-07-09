"use client";

import React, { useMemo, useState } from 'react';
import {
  Bell,
  Database,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

type SettingsState = {
  batchSize: number;
  aiRetries: number;
  requireContact: boolean;
  duplicateRule: string;
  assignment: string;
  defaultOwner: string;
  notifySkipped: boolean;
  notifyCompleted: boolean;
  theme: string;
  retentionDays: number;
};

const initialSettings: SettingsState = {
  batchSize: 10,
  aiRetries: 2,
  requireContact: true,
  duplicateRule: 'EMAIL_OR_MOBILE',
  assignment: 'MANUAL_REVIEW',
  defaultOwner: 'Operations',
  notifySkipped: true,
  notifyCompleted: true,
  theme: 'System',
  retentionDays: 90
};

function Toggle({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  const Icon = checked ? ToggleRight : ToggleLeft;

  return (
    <button type="button" className={`toggle ${checked ? 'on' : ''}`} onClick={onClick} aria-pressed={checked}>
      <Icon size={24} />
      <span>{label}</span>
      <style jsx>{`
        .toggle{min-height:44px;border:1px solid var(--border);border-radius:8px;background:var(--input);color:var(--muted);display:flex;align-items:center;gap:9px;padding:0 12px;cursor:pointer;font-weight:760}
        .toggle.on{color:var(--accent);background:var(--accent-soft);border-color:color-mix(in srgb,var(--accent) 32%,var(--border))}
      `}</style>
    </button>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(initialSettings);
  const [saved, setSaved] = useState(false);

  const summary = useMemo(() => [
    { label: 'AI batch size', value: settings.batchSize },
    { label: 'Retry attempts', value: settings.aiRetries },
    { label: 'Retention days', value: settings.retentionDays },
    { label: 'Default owner', value: settings.defaultOwner || 'Unassigned' }
  ], [settings]);

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = () => {
    window.localStorage.setItem('groweasy-settings', JSON.stringify(settings));
    setSaved(true);
  };

  const resetSettings = () => {
    setSettings(initialSettings);
    setSaved(false);
  };

  return (
    <div className="settings-page">
      <div className="toolbar">
        <div>
          <h2>Settings</h2>
          <p className="muted">Configure AI imports, validation, notifications, and workspace preferences.</p>
        </div>
        <div className="toolbar-actions">
          <button type="button" onClick={resetSettings}>
            <RefreshCw size={17} />
            Reset
          </button>
          <button type="button" className="primary" onClick={saveSettings}>
            <Save size={17} />
            {saved ? 'Saved' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="summary-grid">
        {summary.map((item) => (
          <div className="summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="settings-layout">
        <section className="settings-card">
          <h3><Sparkles size={17} /> AI Import Defaults</h3>
          <div className="form-grid">
            <label>
              Batch size
              <input
                type="number"
                min={1}
                max={100}
                value={settings.batchSize}
                onChange={(event) => update('batchSize', Number(event.target.value))}
              />
            </label>
            <label>
              AI retry attempts
              <input
                type="number"
                min={0}
                max={5}
                value={settings.aiRetries}
                onChange={(event) => update('aiRetries', Number(event.target.value))}
              />
            </label>
            <label>
              Default lead owner
              <input value={settings.defaultOwner} onChange={(event) => update('defaultOwner', event.target.value)} />
            </label>
            <label>
              Auto assignment
              <select value={settings.assignment} onChange={(event) => update('assignment', event.target.value)}>
                <option value="MANUAL_REVIEW">Manual review</option>
                <option value="ROUND_ROBIN">Round robin</option>
                <option value="SOURCE_OWNER">Source owner</option>
              </select>
            </label>
          </div>
        </section>

        <section className="settings-card">
          <h3><ShieldCheck size={17} /> Validation Rules</h3>
          <div className="stack">
            <Toggle
              checked={settings.requireContact}
              label="Skip rows without email or mobile"
              onClick={() => update('requireContact', !settings.requireContact)}
            />
            <label>
              Duplicate rule
              <select value={settings.duplicateRule} onChange={(event) => update('duplicateRule', event.target.value)}>
                <option value="EMAIL_OR_MOBILE">Email or mobile</option>
                <option value="EMAIL_ONLY">Email only</option>
                <option value="MOBILE_ONLY">Mobile only</option>
              </select>
            </label>
          </div>
        </section>

        <section className="settings-card">
          <h3><Bell size={17} /> Notifications</h3>
          <div className="stack">
            <Toggle
              checked={settings.notifyCompleted}
              label="Notify when import completes"
              onClick={() => update('notifyCompleted', !settings.notifyCompleted)}
            />
            <Toggle
              checked={settings.notifySkipped}
              label="Notify when rows are skipped"
              onClick={() => update('notifySkipped', !settings.notifySkipped)}
            />
          </div>
        </section>

        <section className="settings-card">
          <h3><Settings2 size={17} /> Workspace Preferences</h3>
          <div className="form-grid">
            <label>
              Theme preference
              <select value={settings.theme} onChange={(event) => update('theme', event.target.value)}>
                <option>System</option>
                <option>Light</option>
                <option>Dark</option>
                <option>Gray</option>
              </select>
            </label>
            <label>
              Import history retention
              <input
                type="number"
                min={7}
                max={365}
                value={settings.retentionDays}
                onChange={(event) => update('retentionDays', Number(event.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="settings-card wide">
          <h3><Database size={17} /> CRM Schema Controls</h3>
          <div className="schema-list">
            {['Allowed CRM statuses', 'Allowed data sources', 'CRM field mapping', 'CSV validation rules'].map((item) => (
              <div key={item}>
                <strong>{item}</strong>
                <span>Managed by backend schema and AI normalization.</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .settings-page{display:flex;flex-direction:column;gap:16px;min-width:0}
        h2,h3,p{margin:0}
        h2{font-size:24px;color:var(--text)}
        .muted{color:var(--muted);font-size:14px;margin-top:4px}
        .toolbar{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
        .toolbar-actions{display:flex;gap:10px;flex-wrap:wrap}
        .toolbar button{min-height:42px;border:1px solid var(--border);border-radius:8px;background:var(--input);color:var(--text);display:inline-flex;align-items:center;gap:8px;padding:0 14px;cursor:pointer;font-weight:760}
        .toolbar .primary{background:var(--accent);border-color:var(--accent);color:#fff}
        .summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .summary-card,.settings-card{border:1px solid var(--border);border-radius:8px;background:var(--surface);box-shadow:var(--shadow)}
        .summary-card{padding:14px}
        .summary-card span{display:block;color:var(--muted);font-size:12px}
        .summary-card strong{display:block;color:var(--text);font-size:20px;margin-top:6px}
        .settings-layout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .settings-card{padding:16px;min-width:0}
        .settings-card h3{display:flex;align-items:center;gap:8px;color:var(--text);font-size:16px;margin-bottom:14px}
        .settings-card h3 svg{color:var(--accent)}
        .wide{grid-column:1/-1}
        .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .stack{display:flex;flex-direction:column;gap:12px}
        label{display:flex;flex-direction:column;gap:6px;color:var(--text);font-size:13px;font-weight:760}
        input,select{width:100%;min-height:42px;border:1px solid var(--border);border-radius:8px;background:var(--input);color:var(--text);padding:0 12px;outline:none}
        input:focus,select:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
        .schema-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .schema-list div{border:1px solid var(--border);border-radius:8px;background:var(--card);padding:12px}
        .schema-list strong{display:block;color:var(--text);font-size:13px}
        .schema-list span{display:block;color:var(--muted);font-size:12px;line-height:1.45;margin-top:6px}
        @media (max-width:1100px){.summary-grid,.schema-list{grid-template-columns:repeat(2,minmax(0,1fr))}.settings-layout{grid-template-columns:1fr}}
        @media (max-width:640px){h2{font-size:21px}.toolbar,.toolbar-actions{flex-direction:column;align-items:stretch}.toolbar button{width:100%;justify-content:center;min-height:44px}.summary-grid,.schema-list,.form-grid{grid-template-columns:1fr}.settings-card{padding:14px}}
      `}</style>
    </div>
  );
}
