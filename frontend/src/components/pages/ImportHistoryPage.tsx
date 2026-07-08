"use client";
import React from 'react';

export default function ImportHistoryPage() {
  return (
    <div className="history-page">
      <div>
        <h2>Import History</h2>
        <p className="muted">Previous CSV import batches and AI processing runs.</p>
      </div>
      <div className="empty-card">
        <div className="mark">IH</div>
        <h3>No imports recorded yet</h3>
        <p className="muted">Your completed CSV imports will appear here with status, totals, and skipped-row reasons.</p>
      </div>
      <style jsx>{`
        .history-page{display:flex;flex-direction:column;gap:16px}
        h2,h3,p{margin:0}
        h2{font-size:24px;color:var(--text)}
        .muted{color:var(--muted);font-size:14px;margin-top:4px}
        .empty-card{min-height:260px;padding:28px;border-radius:8px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
        .mark{width:54px;height:54px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--violet));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;margin-bottom:14px}
        .empty-card h3{color:var(--text);font-size:17px}
      `}</style>
    </div>
  );
}
