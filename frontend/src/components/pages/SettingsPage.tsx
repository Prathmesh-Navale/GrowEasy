"use client";
import React from 'react';

export default function SettingsPage() {
  return (
    <div>
      <h2>Settings</h2>
      <p className="muted">CRM fields and configuration</p>
      <div className="card" style={{marginTop:12}}>
        <div className="muted">Settings UI placeholder</div>
      </div>
      <style jsx>{`.muted{color:var(--muted)}.card{padding:16px;border-radius:8px;background:var(--card);border:1px solid var(--border);box-shadow:var(--shadow)}`}</style>
    </div>
  );
}
