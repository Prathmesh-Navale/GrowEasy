"use client";
import React from 'react';
import Link from 'next/link';

export default function LeadSourcesPage() {
  const sources = [
    { title: 'Facebook Ads', desc: 'Facebook lead forms' },
    { title: 'Google Ads', desc: 'Google leads' },
    { title: 'Website Forms', desc: 'Site contact forms' },
    { title: 'WhatsApp', desc: 'WhatsApp leads' },
    { title: 'Manual CSV', desc: 'Upload CSV files' },
  ];

  return (
    <div>
      <div className="page-head">
        <h2>Lead Sources</h2>
        <p className="muted">Connected lead sources and quick actions</p>
      </div>

      <div className="grid">
        {sources.map((s) => (
          <div key={s.title} className="card">
            <div>
              <h3>{s.title}</h3>
              <p className="muted">{s.desc}</p>
            </div>
            {s.title === 'Manual CSV' ? (
              <Link href="/import-csv" className="btn">Import CSV</Link>
            ) : (
              <button className="btn ghost">Manage</button>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .page-head{margin-bottom:12px}
        .muted{color:var(--muted)}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
        .card{padding:16px;border-radius:8px;background:var(--card);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;box-shadow:var(--shadow)}
        .btn{background:var(--accent);color:#fff;padding:8px 12px;border-radius:8px;text-decoration:none}
        .ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
      `}</style>
    </div>
  );
}
