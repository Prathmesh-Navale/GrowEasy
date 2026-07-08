"use client";
import React, { useMemo, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import DataTable from '@/components/import/DataTable';
import { previewImport, processImport } from '@/lib/api';

type ImportResult = {
  imported: number;
  skipped: number;
  totalRows: number;
  records?: any[];
  skippedRecords?: any[];
};

export default function ImportCsvPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    setError(null);
    setFile(f);
    if (f) {
      // auto preview
      void doPreview(f);
    }
  };

  const doPreview = async (f: File) => {
    setLoading(true);
    setError(null);
    try {
      const data = await previewImport(f);
      setHeaders(data.headers ?? data.columns ?? []);
      setPreviewRows(data.rows ?? data.previewRows ?? []);
      setStep(2);
    } catch (e: any) {
      setError(e.message || 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  const doImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await processImport(file);
      setResult(data);
      setStep(4);
    } catch (e: any) {
      setError(e.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => ({
    total: result?.totalRows ?? previewRows.length,
    imported: result?.imported ?? 0,
    skipped: result?.skipped ?? 0,
    successRate: result ? Math.round((result.imported / Math.max(result.totalRows, 1)) * 100) : 0
  }), [result, previewRows]);

  return (
    <div>
      <div className="page-head"><h2>AI CSV Importer</h2><p className="muted">Upload, preview and import leads</p></div>

      <div className="steps">
        <div className={`step ${step===1? 'active':''}`}>1. Upload</div>
        <div className={`step ${step===2? 'active':''}`}>2. Preview</div>
        <div className={`step ${step===3? 'active':''}`}>3. Confirm</div>
        <div className={`step ${step===4? 'active':''}`}>4. Results</div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="upload">
            <label className="dropzone" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); const f=e.dataTransfer.files?.[0]; if(f) handleFile(f);}}>
              <Upload size={28} />
              <div>Drop CSV here or <input type="file" accept=".csv" onChange={(e)=>handleFile(e.target.files?.[0] ?? null)} /></div>
            </label>
            {loading && <div className="mt-2"> <Loader2 className="animate-spin"/> Processing...</div>}
            {error && <div className="error">{error}</div>}
          </div>
        </div>

        <div className="card">
          <h3>Preview</h3>
          {previewRows.length === 0 ? <div className="muted">No preview available</div> : <DataTable columns={headers} rows={previewRows} />}
        </div>
      </div>

      <div style={{marginTop:12, display:'flex', gap:8}}>
        <button className="btn" onClick={()=> setStep(1)}>Back</button>
        <button className="btn primary" disabled={!previewRows.length || loading} onClick={()=> setStep(3)}>Proceed</button>
        {step===3 && <button className="btn primary" onClick={doImport} disabled={loading}>{loading ? 'Importing...' : 'Confirm Import'}</button>}
      </div>

      {step===4 && result && (
        <div style={{marginTop:16}}>
          <div className="summary">
            <div className="stat card">Total Rows<br/><strong>{summary.total}</strong></div>
            <div className="stat card">Imported<br/><strong>{summary.imported}</strong></div>
            <div className="stat card">Skipped<br/><strong>{summary.skipped}</strong></div>
            <div className="stat card">Success Rate<br/><strong>{summary.successRate}%</strong></div>
          </div>
          <div style={{marginTop:12}}>
            <h4>Parsed Results</h4>
            {result.records ? <DataTable columns={Object.keys(result.records[0]?.data ?? {})} rows={result.records.map((r)=>r.data)} /> : <div className="muted">No records</div>}
          </div>
        </div>
      )}

      <style jsx>{`
        .muted{color:var(--muted)}
        .page-head{margin-bottom:12px}
        .steps{display:flex;gap:8px;margin-bottom:12px}
        .step{padding:8px 12px;border-radius:8px;background:var(--input);color:var(--text)}
        .step.active{background:var(--accent);color:#fff}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .card{padding:16px;border-radius:8px;background:var(--card);border:1px solid var(--border);box-shadow:var(--shadow)}
        .dropzone{border:1px dashed var(--border);padding:20px;border-radius:8px;display:flex;flex-direction:column;align-items:center;gap:8px;background:var(--surface)}
        .btn{padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text)}
        .primary{background:var(--accent);color:#fff;border:0}
        .error{color:var(--danger)}
        .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
      `}</style>
    </div>
  );
}
