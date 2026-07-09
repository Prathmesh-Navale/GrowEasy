"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle
} from 'lucide-react';
import DataTable from '@/components/import/DataTable';
import { listLeadSources, previewImport, processImport, type LeadSourceRecord } from '@/lib/api';

type ImportResult = {
  imported: number;
  skipped: number;
  importedCount?: number;
  skippedCount?: number;
  totalRows: number;
  records?: Array<Record<string, string> | { data: Record<string, string> }>;
  skippedRecords?: Array<{ row?: number; sourceRowIndex?: number; reason: string; rawData?: Record<string, string> }>;
  parseErrors?: Array<{ row?: number; code?: string; message: string }>;
};

const steps = [
  { id: 1, title: 'Upload', desc: 'Choose source file' },
  { id: 2, title: 'Preview', desc: 'Validate columns' },
  { id: 3, title: 'Confirm', desc: 'Review rules' },
  { id: 4, title: 'Results', desc: 'Import summary' }
];

const expectedFields = [
  'name',
  'email',
  'mobile_without_country_code',
  'city',
  'crm_status',
  'crm_note',
  'data_source'
];

export default function ImportCsvProPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [parseErrors, setParseErrors] = useState<Array<{ row?: number; code?: string; message: string }>>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [tableMode, setTableMode] = useState<'inline' | 'popout' | 'maximized'>('inline');
  const [leadSources, setLeadSources] = useState<LeadSourceRecord[]>([]);
  const [selectedLeadSourceId, setSelectedLeadSourceId] = useState('');
  const [sourceError, setSourceError] = useState('');

  useEffect(() => {
    let mounted = true;
    listLeadSources()
      .then((data) => {
        if (!mounted) return;
        const sources = Array.isArray(data.sources) ? data.sources : [];
        setLeadSources(sources);
        setSelectedLeadSourceId((current) => current || sources[0]?.id || '');
      })
      .catch((loadError) => {
        if (!mounted) return;
        setSourceError(loadError instanceof Error ? loadError.message : 'Unable to load lead sources.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const total = result?.totalRows ?? totalRows;
    const imported = result?.importedCount ?? result?.imported ?? 0;
    const skipped = result?.skippedCount ?? result?.skipped ?? 0;
    const successRate = result ? Math.round((imported / Math.max(total, 1)) * 100) : 0;
    const mapped = expectedFields.filter((field) =>
      headers.some((header) => header.toLowerCase().replace(/\s+/g, '_').includes(field.split('_')[0]))
    ).length;

    return { total, imported, skipped, successRate, mapped };
  }, [headers, totalRows, result]);

  const selectFile = (nextFile: File | null) => {
    setError('');
    setResult(null);
    setFile(nextFile);
    if (nextFile) {
      void previewFile(nextFile);
    }
  };

  const previewFile = async (nextFile: File) => {
    setLoading(true);
    try {
      const data = await previewImport(nextFile);
      setHeaders(data.headers ?? data.columns ?? []);
      setPreviewRows(data.rows ?? data.previewRows ?? []);
      setTotalRows(data.totalRows ?? data.rows?.length ?? 0);
      setParseErrors(data.parseErrors ?? []);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setProcessingProgress(8);
    setProcessingStage('Uploading file to AI pipeline');
    const stages = [
      'Saving raw rows',
      'Preparing AI batches',
      'Mapping CRM fields',
      'Validating contacts',
      'Saving imported records'
    ];
    let stageIndex = 0;
    const progressTimer = window.setInterval(() => {
      setProcessingProgress((current) => Math.min(current + 9, 92));
      setProcessingStage(stages[Math.min(stageIndex, stages.length - 1)]);
      stageIndex += 1;
    }, 900);
    try {
      const data = await processImport(file, selectedLeadSourceId);
      window.clearInterval(progressTimer);
      setProcessingProgress(100);
      setProcessingStage('Import complete');
      setResult(data);
      setStep(4);
    } catch (err) {
      window.clearInterval(progressTimer);
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      window.setTimeout(() => {
        setLoading(false);
        setProcessingProgress(0);
        setProcessingStage('');
      }, 500);
    }
  };

  const parsedRows = result?.records?.map((record) => ('data' in record ? record.data : record)) ?? [];
  const parsedColumns = Object.keys(parsedRows[0] ?? {});
  const visibleRows = step === 4 && parsedRows.length ? parsedRows : previewRows;
  const visibleColumns = step === 4 && parsedColumns.length ? parsedColumns : headers;
  const hasVisibleTable = step !== 1 && visibleRows.length > 0 && visibleColumns.length > 0;
  const skippedRows = result?.skippedRecords?.map((record) => ({
    row: record.row ?? record.sourceRowIndex ?? '',
    reason: record.reason,
    rawData: record.rawData ? JSON.stringify(record.rawData) : ''
  })) ?? [];
  const selectedLeadSource = leadSources.find((source) => source.id === selectedLeadSourceId);

  return (
    <div className="import-page">
      <div className="hero">
        <div>
          <span className="eyebrow">Lead Source Import</span>
          <h2>AI Lead Importer</h2>
          <p>Upload lead files, preview the raw data, validate CRM mapping, and import clean records into GrowEasy.</p>
        </div>
        <div className="hero-metrics">
          <div><span>Rows detected</span><strong>{summary.total}</strong></div>
          <div><span>Mapped fields</span><strong>{summary.mapped}/{expectedFields.length}</strong></div>
          <div><span>Skipped rows</span><strong>{summary.skipped}</strong></div>
        </div>
      </div>

      <div className="stepper">
        {steps.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`step ${step === item.id ? 'active' : ''} ${step > item.id ? 'done' : ''}`}
            onClick={() => item.id <= step && setStep(item.id)}
          >
            <span>{step > item.id ? <CheckCircle2 size={16} /> : item.id}</span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.desc}</small>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {sourceError && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>Lead source list unavailable. You can still import, but records will not be linked to a source.</span>
        </div>
      )}

      {loading && step === 3 && (
        <section className="progress-panel" aria-live="polite">
          <div>
            <span><Sparkles size={17} /> AI Processing</span>
            <strong>{processingStage || 'Starting import'}</strong>
          </div>
          <div className="progress-track">
            <div style={{ width: `${processingProgress}%` }} />
          </div>
          <b>{processingProgress}%</b>
        </section>
      )}

      <div className="workspace">
        <section className="main-panel">
          <div className="panel-head">
            <div>
              <h3>{step === 4 ? 'Imported Records' : 'CSV Preview'}</h3>
              <p>{file ? file.name : 'Select a CSV file to start previewing leads.'}</p>
            </div>
            {loading && <span className="loading"><Loader2 size={16} className="spin" /> Processing</span>}
          </div>

          {step === 1 && (
            <div className="upload-stack">
              <label className="source-select">
                Lead source for this import
                <select
                  value={selectedLeadSourceId}
                  onChange={(event) => setSelectedLeadSourceId(event.target.value)}
                >
                  <option value="">No source selected</option>
                  {leadSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name} - {source.channelType}
                    </option>
                  ))}
                </select>
                <span>Imported records will be saved under the selected source.</span>
              </label>
              <label
                className="dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  selectFile(event.dataTransfer.files?.[0] ?? null);
                }}
              >
                <input type="file" accept=".csv" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
                <span className="upload-icon"><Upload size={30} /></span>
                <strong>Drop your CSV file here</strong>
                <p>or click to browse. Use one row per lead with headers in the first row.</p>
                <small>Maximum backend upload size is 5 MB.</small>
              </label>
            </div>
          )}

          {step !== 1 && (
            <div className="table-shell">
              {hasVisibleTable && (
                <div className="table-tools">
                  <button type="button" onClick={() => setTableMode('popout')}>
                    <ExternalLink size={15} />
                    Pop out
                  </button>
                  <button type="button" onClick={() => setTableMode('maximized')}>
                    <Maximize2 size={15} />
                    Maximize
                  </button>
                </div>
              )}
              {step === 4 && parsedRows.length ? (
                <DataTable columns={parsedColumns} rows={parsedRows} maxHeight={440} />
              ) : previewRows.length ? (
                <DataTable columns={headers} rows={previewRows} maxHeight={440} />
              ) : (
                <div className="empty-state">
                  <FileSpreadsheet size={28} />
                  <strong>No preview available</strong>
                  <p>Upload a valid CSV file to preview columns and rows.</p>
                </div>
              )}
            </div>
          )}

          <div className="actions">
            <button type="button" disabled={step === 1 || loading} onClick={() => setStep((current) => Math.max(1, current - 1))}>
              Back
            </button>
            {step < 3 && (
              <button type="button" className="primary" disabled={!previewRows.length || loading} onClick={() => setStep(3)}>
                Review Import
                <ArrowRight size={16} />
              </button>
            )}
            {step === 3 && (
              <button type="button" className="primary" disabled={loading || !file} onClick={runImport}>
                {loading ? 'Importing...' : 'Confirm Import'}
                <ArrowRight size={16} />
              </button>
            )}
            {step === 4 && (
              <button type="button" className="primary" onClick={() => {
                setStep(1);
                setFile(null);
                setHeaders([]);
                setPreviewRows([]);
                setTotalRows(0);
                setParseErrors([]);
                setResult(null);
              }}>
                New Import
              </button>
            )}
          </div>
        </section>

        <aside className="side-panel">
          <div className="source-card">
            <span><Database size={17} /> Destination</span>
            <strong>{selectedLeadSource ? selectedLeadSource.name : 'GrowEasy CRM Leads'}</strong>
            <p>
              {selectedLeadSource
                ? `Records will be linked to ${selectedLeadSource.channelType} source history.`
                : 'Imported leads are normalized, deduplicated, and saved with original row history.'}
            </p>
          </div>

          {step === 3 && (
            <div className="confirm-card">
              <h3>Confirm AI Processing</h3>
              <p>AI extraction starts only after you click Confirm Import. Preview never sends rows for AI mapping.</p>
            </div>
          )}

          <div className="checklist">
            <h3>Import Readiness</h3>
            <div className={file ? 'ok' : ''}>
              {file ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              CSV file selected
            </div>
            <div className={previewRows.length ? 'ok' : ''}>
              {previewRows.length ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              Preview rows loaded
            </div>
            <div className={headers.length ? 'ok' : ''}>
              {headers.length ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              Headers detected
            </div>
            <div className={selectedLeadSourceId ? 'ok' : ''}>
              {selectedLeadSourceId ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              Lead source selected
            </div>
            <div className={summary.mapped >= 3 ? 'ok' : ''}>
              {summary.mapped >= 3 ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              CRM fields likely mapped
            </div>
          </div>

          <div className="rules">
            <h3><ShieldCheck size={17} /> Quality Rules</h3>
            <p>Rows missing both email and mobile are skipped.</p>
            <p>AI keeps unmapped useful information inside CRM notes.</p>
            <p>Duplicate checks use email or mobile when available.</p>
          </div>

          <div className="mapping">
            <h3><Sparkles size={17} /> AI Mapping Targets</h3>
            {expectedFields.map((field) => (
              <div key={field}>
                <span>{field}</span>
                <strong>{headers.some((header) => header.toLowerCase().includes(field.split('_')[0])) ? 'Detected' : 'AI fill'}</strong>
              </div>
            ))}
          </div>

          {parseErrors.length > 0 && (
            <div className="parse-errors">
              <h3><AlertCircle size={17} /> CSV Parse Warnings</h3>
              {parseErrors.slice(0, 4).map((item, index) => (
                <p key={`${item.code}-${index}`}>Row {item.row ?? '-'}: {item.message}</p>
              ))}
            </div>
          )}

          {step === 4 && result && (
            <div className="result-card">
              <h3>Import Result</h3>
              <div><span>Total rows</span><strong>{summary.total}</strong></div>
              <div><span>Imported records</span><strong>{summary.imported}</strong></div>
              <div><span>Skipped records</span><strong>{summary.skipped}</strong></div>
              {skippedRows.length > 0 && (
                <div className="skip-reasons">
                  <span>Skipped reasons</span>
                  <strong>{Array.from(new Set(skippedRows.map((row) => row.reason))).join(', ')}</strong>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {step === 4 && skippedRows.length > 0 && (
        <section className="skipped-panel">
          <div className="panel-head">
            <div>
              <h3>Skipped Records</h3>
              <p>Rows skipped because they were unusable for CRM import.</p>
            </div>
          </div>
          <DataTable columns={['row', 'reason', 'rawData']} rows={skippedRows} maxHeight={260} />
        </section>
      )}

      {tableMode !== 'inline' && hasVisibleTable && (
        <div className={`table-overlay ${tableMode}`} role="dialog" aria-modal="true" aria-label="CSV table preview">
          <section className="table-window">
            <div className="table-window-head">
              <div>
                <h3>{step === 4 ? 'Imported Records' : 'CSV Preview'}</h3>
                <p>{file?.name ?? 'Current CSV table'}</p>
              </div>
              <div>
                {tableMode === 'popout' && (
                  <button type="button" onClick={() => setTableMode('maximized')}>
                    <Maximize2 size={15} />
                    Maximize
                  </button>
                )}
                {tableMode === 'maximized' && (
                  <button type="button" onClick={() => setTableMode('popout')}>
                    <Minimize2 size={15} />
                    Pop out
                  </button>
                )}
                <button type="button" onClick={() => setTableMode('inline')}>
                  <Minimize2 size={15} />
                  Pop in
                </button>
              </div>
            </div>
            <DataTable columns={visibleColumns} rows={visibleRows} maxHeight={tableMode === 'maximized' ? 680 : 520} />
          </section>
        </div>
      )}

      <style jsx>{`
        .import-page{display:flex;flex-direction:column;gap:18px;min-width:0}
        h2,h3,p{margin:0}
        .hero{display:flex;justify-content:space-between;gap:20px;align-items:stretch;min-width:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:18px;box-shadow:var(--shadow)}
        .eyebrow{color:var(--accent);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
        .hero h2{font-size:24px;color:var(--text);margin-top:4px}
        .hero p,.panel-head p,.source-card p,.rules p,.empty-state p{color:var(--muted);font-size:14px;margin-top:5px}
        .hero-metrics{display:grid;grid-template-columns:repeat(3,130px);gap:10px}
        .hero-metrics div{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px}
        .hero-metrics span,.result-card span{display:block;color:var(--muted);font-size:12px}
        .hero-metrics strong,.result-card strong{display:block;color:var(--text);font-size:22px;margin-top:5px}
        .stepper{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .step{border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:8px;padding:12px;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer}
        .step span{width:28px;height:28px;border-radius:999px;background:var(--input);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--muted)}
        .step strong{display:block;font-size:14px}
        .step small{display:block;color:var(--muted);margin-top:2px}
        .step.active{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.14)}
        .step.active span,.step.done span{background:var(--accent);color:#fff}
        .error-banner{border:1px solid rgba(192,31,37,.3);background:rgba(192,31,37,.1);color:var(--danger);border-radius:8px;padding:11px 12px;display:flex;align-items:center;gap:8px}
        .progress-panel{display:grid;grid-template-columns:minmax(180px,280px) minmax(0,1fr) auto;gap:14px;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px;box-shadow:var(--shadow)}
        .progress-panel span{display:flex;align-items:center;gap:8px;color:var(--accent);font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
        .progress-panel strong{display:block;color:var(--text);font-size:14px;margin-top:5px}
        .progress-panel b{color:var(--text);font-size:18px}
        .progress-track{height:10px;border-radius:999px;background:var(--input);border:1px solid var(--border);overflow:hidden}
        .progress-track div{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent),var(--violet));transition:width .35s ease}
        .workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,360px);gap:16px;align-items:start}
        .main-panel,.side-panel>div,.skipped-panel{background:var(--surface);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow)}
        .main-panel{min-width:0;padding:16px}
        .panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}
        .panel-head h3,.side-panel h3{font-size:16px;color:var(--text)}
        .loading{display:flex;align-items:center;gap:8px;color:var(--accent);font-size:13px;font-weight:700}
        .spin{animation:spin .9s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dropzone{min-height:310px;border:1px dashed var(--border);border-radius:8px;background:var(--card);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px;cursor:pointer}
        .upload-stack{display:flex;flex-direction:column;gap:14px}
        .source-select{display:flex;flex-direction:column;gap:7px;border:1px solid var(--border);border-radius:8px;background:var(--card);padding:14px;color:var(--text);font-size:13px;font-weight:800}
        .source-select select{min-height:44px;border:1px solid var(--border);border-radius:8px;background:var(--input);color:var(--text);padding:0 12px;outline:none}
        .source-select select:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
        .source-select span{color:var(--muted);font-size:12px;font-weight:600}
        .dropzone input{display:none}
        .upload-icon{width:64px;height:64px;border-radius:16px;background:rgba(37,99,235,.12);color:var(--accent);display:flex;align-items:center;justify-content:center;margin-bottom:14px}
        .dropzone strong{font-size:18px;color:var(--text)}
        .dropzone small{color:var(--muted);margin-top:12px}
        .table-shell{min-height:310px}
        .table-tools{display:flex;justify-content:flex-end;gap:8px;margin-bottom:10px}
        .table-tools button,.table-window-head button{min-height:38px;border:1px solid var(--border);border-radius:8px;background:var(--input);color:var(--text);display:inline-flex;align-items:center;gap:7px;padding:0 11px;cursor:pointer;font-weight:750}
        .empty-state{min-height:310px;border:1px dashed var(--border);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--muted);text-align:center}
        .empty-state strong{color:var(--text);margin-top:8px}
        .actions{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}
        .actions button{border:1px solid var(--border);background:var(--input);color:var(--text);border-radius:8px;min-height:40px;padding:0 14px;display:flex;align-items:center;gap:8px;cursor:pointer}
        .actions button:disabled{opacity:.55;cursor:not-allowed}
        .actions .primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:800}
        .side-panel{display:flex;min-width:0;flex-direction:column;gap:12px}
        .side-panel>div{padding:14px}
        .source-card span,.rules h3,.mapping h3,.parse-errors h3{display:flex;align-items:center;gap:8px;color:var(--accent);font-size:13px;font-weight:800}
        .source-card strong{display:block;color:var(--text);font-size:16px;margin-top:8px}
        .checklist div{display:flex;align-items:center;gap:9px;color:var(--muted);font-size:13px;border:1px solid var(--border);border-radius:8px;padding:10px;margin-top:8px}
        .checklist .ok{color:#16a34a;background:rgba(22,163,74,.08)}
        .rules p,.parse-errors p,.confirm-card p{border-left:3px solid var(--border);padding-left:10px;margin-top:10px}
        .parse-errors h3{color:var(--danger)}
        .mapping div,.result-card div{display:flex;justify-content:space-between;gap:12px;border:1px solid var(--border);border-radius:8px;padding:10px;margin-top:8px}
        .mapping span{color:var(--muted);font-size:13px}
        .mapping strong{color:var(--text);font-size:13px}
        .skipped-panel{padding:16px}
        .table-overlay{position:fixed;inset:0;z-index:90;background:rgba(2,6,23,.62);display:flex;padding:22px}
        .table-overlay.popout{align-items:center;justify-content:center}
        .table-overlay.maximized{align-items:stretch;justify-content:stretch;padding:12px}
        .table-window{width:min(1120px,100%);max-height:calc(100dvh - 44px);overflow:hidden;background:var(--surface);border:1px solid var(--border);border-radius:8px;box-shadow:0 24px 90px rgba(0,0,0,.38);padding:16px}
        .table-overlay.maximized .table-window{width:100%;max-height:calc(100dvh - 24px)}
        .table-window-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
        .table-window-head h3{font-size:16px;color:var(--text);margin:0}
        .table-window-head p{font-size:13px;color:var(--muted);margin-top:4px}
        .table-window-head>div:last-child{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
        @media (max-width:1180px){.workspace{grid-template-columns:1fr}.hero{flex-direction:column}.hero-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media (max-width:760px){.stepper,.hero-metrics,.progress-panel{grid-template-columns:1fr}.hero,.main-panel,.side-panel>div,.skipped-panel{padding:14px}.panel-head,.actions,.table-window-head{flex-direction:column}.actions button,.table-tools button,.table-window-head button{width:100%;justify-content:center;min-height:44px}.table-tools{flex-direction:column}.dropzone{min-height:240px;padding:22px}.upload-icon{width:56px;height:56px}.dropzone strong{text-wrap:balance}.mapping div,.result-card div{align-items:flex-start;flex-direction:column}.step{min-height:58px}.table-overlay{padding:10px}.table-window{padding:12px;max-height:calc(100dvh - 20px)}}
        @media (max-width:420px){.hero h2{font-size:21px}.hero p,.panel-head p,.source-card p,.rules p,.empty-state p{font-size:13px}.main-panel,.side-panel>div,.skipped-panel{padding:12px}.dropzone{min-height:220px;padding:18px}.step{padding:10px}}
      `}</style>
    </div>
  );
}
