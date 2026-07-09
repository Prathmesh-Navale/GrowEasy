"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, FileSpreadsheet, RefreshCw, XCircle } from 'lucide-react';
import { listImportHistory, type ImportHistoryJob } from '@/lib/api';

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

export default function ImportHistoryPage() {
  const [jobs, setJobs] = useState<ImportHistoryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listImportHistory();
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (loadError) {
      setJobs([]);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load import history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const totals = useMemo(() => ({
    imports: jobs.length,
    rows: jobs.reduce((sum, job) => sum + job.totalRows, 0),
    imported: jobs.reduce((sum, job) => sum + job.totalImported, 0),
    skipped: jobs.reduce((sum, job) => sum + job.totalSkipped, 0)
  }), [jobs]);

  return (
    <div className="history-page">
      <div className="toolbar">
        <div>
          <h2>Import History</h2>
          <p className="muted">Review completed CSV imports, AI batches, and skipped row reasons.</p>
        </div>
        <button type="button" onClick={loadJobs} disabled={loading}>
          <RefreshCw size={17} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="notice">
          <AlertCircle size={17} />
          Backend unavailable. Import history will appear here after the API is running.
        </div>
      )}

      <div className="metrics">
        <div><FileSpreadsheet size={18} /><span>Imports</span><strong>{totals.imports}</strong></div>
        <div><Clock3 size={18} /><span>Total Rows</span><strong>{totals.rows}</strong></div>
        <div><CheckCircle2 size={18} /><span>Imported</span><strong>{totals.imported}</strong></div>
        <div><XCircle size={18} /><span>Skipped</span><strong>{totals.skipped}</strong></div>
      </div>

      <section className="history-card">
        {loading ? (
          <div className="empty-state">Loading import history...</div>
        ) : jobs.length ? (
          <div className="table">
            <div className="row header">
              <span>File</span>
              <span>Status</span>
              <span>Rows</span>
              <span>Imported</span>
              <span>Skipped</span>
              <span>Source</span>
              <span>Batches</span>
              <span>Created</span>
            </div>
            {jobs.map((job) => (
              <article className="row" key={job.id}>
                <div className="file-cell">
                  <span className="file-icon"><FileSpreadsheet size={18} /></span>
                  <div>
                    <strong>{job.fileName}</strong>
                    <small>{formatBytes(job.fileSize)} - {job.id.slice(0, 8)}</small>
                  </div>
                </div>
                <span className={`status ${job.status.toLowerCase()}`}>{job.status.toLowerCase()}</span>
                <span>{job.totalRows}</span>
                <span>{job.totalImported}</span>
                <span>{job.totalSkipped}</span>
                <span>{job.leadSource?.name ?? 'Unassigned'}</span>
                <span>{job.batchCount}{job.failedBatchCount ? ` (${job.failedBatchCount} failed)` : ''}</span>
                <span>{formatDate(job.createdAt)}</span>
                {job.skippedReasons.length > 0 && (
                  <div className="reasons">
                    {job.skippedReasons.map((reason, index) => <em key={`${job.id}-${index}`}>{reason}</em>)}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileSpreadsheet size={30} />
            <h3>No imports recorded yet</h3>
            <p className="muted">Complete an import from AI Lead Importer and it will be listed here automatically.</p>
          </div>
        )}
      </section>

      <style jsx>{`
        .history-page{display:flex;flex-direction:column;gap:16px;min-width:0}
        h2,h3,p{margin:0}
        h2{font-size:24px;color:var(--text)}
        .muted{color:var(--muted);font-size:14px;margin-top:4px}
        .toolbar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;min-width:0}
        .toolbar button{min-height:40px;border:1px solid var(--border);border-radius:8px;background:var(--input);color:var(--text);display:flex;align-items:center;gap:8px;padding:0 14px;cursor:pointer;font-weight:700}
        .toolbar button:disabled{opacity:.65;cursor:not-allowed}
        .spin{animation:spin .9s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .notice{border:1px solid rgba(217,119,6,.3);background:rgba(217,119,6,.1);color:#d97706;border-radius:8px;padding:10px 12px;font-size:13px;display:flex;gap:8px;align-items:center}
        .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .metrics div{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:14px;display:grid;grid-template-columns:auto 1fr;gap:4px 10px;align-items:center;box-shadow:var(--shadow)}
        .metrics svg{grid-row:span 2;color:var(--accent)}
        .metrics span{color:var(--muted);font-size:12px}
        .metrics strong{color:var(--text);font-size:21px}
        .history-card{min-width:0;border-radius:8px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow);overflow:hidden}
        .table{display:flex;flex-direction:column}
        .row{display:grid;grid-template-columns:minmax(230px,1.5fr) 110px 80px 90px 80px 120px 100px 170px;gap:12px;align-items:center;border-top:1px solid var(--border);background:var(--card);padding:13px;color:var(--text);font-size:13px}
        .row:first-child{border-top:0}
        .row.header{background:var(--input);color:var(--muted);font-size:12px;font-weight:800;text-transform:uppercase}
        .file-cell{display:flex;align-items:center;gap:10px;min-width:0}
        .file-icon{width:36px;height:36px;border-radius:8px;background:var(--input);color:var(--accent);display:flex;align-items:center;justify-content:center}
        .file-cell div{min-width:0}
        .file-cell strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .file-cell small{display:block;color:var(--muted);margin-top:3px}
        .status{border-radius:999px;padding:5px 9px;font-size:12px;text-transform:capitalize;width:max-content;background:var(--input);color:var(--muted)}
        .status.completed{background:rgba(22,163,74,.12);color:#16a34a}
        .status.failed{background:rgba(192,31,37,.12);color:var(--danger)}
        .status.processing,.status.uploaded{background:rgba(217,119,6,.14);color:#d97706}
        .reasons{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;padding-left:46px}
        .reasons em{font-style:normal;border:1px solid var(--border);border-radius:999px;background:var(--input);color:var(--muted);font-size:12px;padding:5px 9px}
        .empty-state{min-height:260px;padding:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--muted)}
        .empty-state svg{color:var(--accent);margin-bottom:12px}
        .empty-state h3{color:var(--text);font-size:17px}
        @media (max-width:1000px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.row,.row.header{grid-template-columns:1fr 90px 70px 80px}.row span:nth-child(5),.row span:nth-child(6),.row span:nth-child(7),.row span:nth-child(8){display:none}}
        @media (max-width:680px){.toolbar{flex-direction:column}.toolbar button{width:100%;justify-content:center;min-height:44px}.metrics{grid-template-columns:1fr}.row,.row.header{grid-template-columns:1fr}.row.header{display:none}.row{gap:9px;padding:12px}.reasons{padding-left:0}.empty-state{min-height:220px;padding:22px}}
        @media (max-width:420px){h2{font-size:21px}.metrics div{padding:12px}.file-cell{align-items:flex-start}.file-icon{width:32px;height:32px;min-width:32px}}
      `}</style>
    </div>
  );
}
