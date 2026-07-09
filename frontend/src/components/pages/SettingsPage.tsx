"use client";
import React from 'react';

export default function SettingsPage() {
  const items = ['CRM field schema', 'Allowed lead statuses', 'Data source catalog', 'Import validation rules'];

  return (
    <div className="settings-page">
      <div>
        <h2>Settings</h2>
        <p className="muted">CRM fields and configuration for the importer pipeline.</p>
      </div>
      <div className="settings-grid">
        {items.map((item, index) => (
          <div className="setting-card" key={item}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{item}</strong>
            <p>Managed through structured backend constants and validation.</p>
          </div>
        ))}
      </div>
      <style jsx>{`
        .settings-page{display:flex;flex-direction:column;gap:16px;min-width:0}
        h2,p{margin:0}
        h2{font-size:24px;color:var(--text)}
        .muted{color:var(--muted);font-size:14px;margin-top:4px}
        .settings-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:14px}
        .setting-card{padding:18px;border-radius:8px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow)}
        .setting-card span{color:var(--accent);font-size:12px;font-weight:900;letter-spacing:.08em}
        .setting-card strong{display:block;color:var(--text);font-size:15px;margin-top:10px}
        .setting-card p{color:var(--muted);font-size:13px;margin-top:8px}
        @media (max-width:640px){h2{font-size:21px}.setting-card{padding:14px}}
      `}</style>
    </div>
  );
}
