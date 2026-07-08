"use client";
import React from 'react';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Leads', value: '1,234', note: '+12% this month' },
    { label: 'Imported Today', value: '24', note: 'CSV and source sync' },
    { label: 'Skipped', value: '3', note: 'Missing contact info' },
    { label: 'AI Accuracy', value: '92%', note: 'Validated mappings' },
  ];

  return (
    <div className="dashboard-page">
      <div className="head"><h2>Dashboard</h2><p className="muted">Revenue-ready lead operations at a glance.</p></div>
      <div className="stats">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.note}</p>
          </div>
        ))}
      </div>
      <div className="ops-panel">
        <div>
          <h3>Import Health</h3>
          <p className="muted">AI mapping, duplicate filtering, and CRM persistence are active.</p>
        </div>
        <div className="pulse">Operational</div>
      </div>

      <style jsx>{`
        .dashboard-page{display:flex;flex-direction:column;gap:18px}
        h2,h3,p{margin:0}
        h2{font-size:24px;color:var(--text)}
        .muted{color:var(--muted);font-size:14px;margin-top:4px}
        .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}
        .stat-card{position:relative;overflow:hidden;padding:18px;border-radius:8px;background:var(--card);border:1px solid var(--border);box-shadow:var(--shadow)}
        .stat-card::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--accent),var(--gold),var(--violet))}
        .stat-card span{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em}
        .stat-card strong{display:block;margin-top:10px;color:var(--text);font-size:30px;line-height:1}
        .stat-card p{color:var(--muted);font-size:13px;margin-top:10px}
        .ops-panel{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px;border-radius:8px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow)}
        .ops-panel h3{font-size:16px;color:var(--text)}
        .pulse{border:1px solid color-mix(in srgb, var(--accent) 32%, var(--border));background:var(--accent-soft);color:var(--accent);border-radius:999px;padding:8px 12px;font-weight:800;font-size:13px}
      `}</style>
    </div>
  );
}
