"use client";
import React from 'react';

export default function DashboardPage() {
  return (
    <div>
      <div className="head"><h2>Dashboard</h2><p className="muted">Overview</p></div>
      <div className="stats">
        <div className="stat card">Total Leads<br/><strong>1,234</strong></div>
        <div className="stat card">Imported Today<br/><strong>24</strong></div>
        <div className="stat card">Skipped<br/><strong>3</strong></div>
        <div className="stat card">AI Accuracy<br/><strong>92%</strong></div>
      </div>

      <style jsx>{`
        .muted{color:var(--muted)}
        .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:12px}
        .card{padding:16px;border-radius:8px;background:var(--card);border:1px solid var(--border);box-shadow:var(--shadow)}
      `}</style>
    </div>
  );
}
