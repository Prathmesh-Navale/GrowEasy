"use client";
import React from 'react';

type Props = { columns: string[]; rows: any[]; maxHeight?: number };

export default function DataTable({ columns, rows, maxHeight = 360 }: Props) {
  return (
    <div className="ge-table">
      <div className="wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx}>
                {columns.map((c) => (
                  <td key={c} title={String(r[c] ?? '')}>{String(r[c] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .wrap{width:100%;max-width:100%;max-height:${maxHeight}px;overflow:auto;border:1px solid var(--border);border-radius:8px;background:var(--surface);box-shadow:inset 0 1px 0 rgba(255,255,255,.16);-webkit-overflow-scrolling:touch}
        table{width:100%;border-collapse:separate;border-spacing:0;min-width:720px}
        thead th{position:sticky;top:0;z-index:2;background:linear-gradient(180deg,var(--surface-strong),var(--surface));padding:12px 14px;border-bottom:1px solid var(--border);text-align:left;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
        tbody tr{transition:background .16s}
        tbody tr:hover{background:var(--accent-soft)}
        td{padding:12px 14px;border-bottom:1px solid var(--border);max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);font-size:13px}
        tbody tr:last-child td{border-bottom:0}
        @media (max-width:640px){
          table{min-width:620px}
          thead th,td{padding:10px 12px;font-size:12px}
        }
      `}</style>
    </div>
  );
}
