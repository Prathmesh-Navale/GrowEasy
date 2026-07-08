"use client";
import React from 'react';

export default function ImportHistoryPage() {
  const rows = [] as any[];
  return (
    <div>
      <h2>Import History</h2>
      <p className="muted">Previous CSV import batches</p>
      <div className="card" style={{marginTop:12}}>
        <div className="muted">No history yet</div>
      </div>
      <style jsx>{`.muted{color:var(--muted)}.card{padding:16px;border-radius:8px;background:var(--card);border:1px solid var(--border);box-shadow:var(--shadow)}`}</style>
    </div>
  );
}
