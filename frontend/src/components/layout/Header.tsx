"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function Header() {
  const pathname = usePathname() || '/';
  const titleMap: Record<string, { title: string; subtitle?: string }> = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Overview' },
    '/lead-sources': { title: 'Lead Sources', subtitle: 'Connected sources' },
    '/import-csv': { title: 'AI CSV Importer', subtitle: 'Upload, preview, import' },
    '/import-history': { title: 'Import History', subtitle: 'Previous import batches' },
    '/settings': { title: 'Settings', subtitle: 'CRM fields & configuration' },
  };
  const info = Object.keys(titleMap).find((p) => pathname.startsWith(p)) ?? '/dashboard';
  const { title, subtitle } = titleMap[info] || { title: 'GrowEasy', subtitle: '' };

  return (
    <header className="ge-header">
      <div className="left">
        <div className="page-title">{title}</div>
        <div className="page-sub">{subtitle}</div>
      </div>
      <div className="right">
        <input placeholder="Search leads..." className="search" />
        <ThemeToggle />
        <button className="notif">🔔</button>
        <button className="avatar">JD</button>
      </div>

      <style jsx>{`
        .ge-header{position:fixed;left:260px;right:0;height:64px;top:0;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:var(--surface-transparent);backdrop-filter:blur(12px);z-index:30}
        .page-title{font-weight:700;font-size:1rem;color:var(--text)}
        .page-sub{font-size:12px;color:var(--muted)}
        .right{display:flex;align-items:center;gap:10px}
        .search{padding:10px 12px;border-radius:12px;border:1px solid var(--border);background:var(--input);color:var(--text);outline:none;min-width:220px}
        .search::placeholder{color:var(--muted)}
        .notif{background:rgba(37,99,235,0.14);border:0;width:40px;height:40px;border-radius:12px;color:var(--text);display:flex;align-items:center;justify-content:center}
        .avatar{width:42px;height:42px;border-radius:999px;background:linear-gradient(180deg,#2563eb,#1d4ed8);color:#fff;border:0;font-weight:700}
        @media (max-width:768px){ .ge-header{left:72px;padding:0 14px} .search{display:none} }
      `}</style>
    </header>
  );
}
