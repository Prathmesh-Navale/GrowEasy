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
        .wrap{max-height:${maxHeight}px;overflow:auto;border:1px solid var(--border);border-radius:8px;background:var(--surface)}
        table{width:100%;border-collapse:collapse}
        thead th{position:sticky;top:0;background:var(--surface);padding:10px;border-bottom:1px solid var(--border);text-align:left;color:var(--text)}
        td{padding:10px;border-bottom:1px solid var(--border);max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)}
      `}</style>
    </div>
  );
}
