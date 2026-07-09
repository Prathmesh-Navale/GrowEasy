"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/layout/ThemeToggle';

type Props = { collapsed: boolean };

export default function Header({ collapsed }: Props) {
  const pathname = usePathname() || '/';
  const titleMap: Record<string, { title: string; subtitle?: string }> = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Overview' },
    '/lead-sources': { title: 'Lead Sources', subtitle: 'Connected sources' },
    '/import-csv': { title: 'AI CSV Importer', subtitle: 'Upload, preview, import' },
    '/import-history': { title: 'Import History', subtitle: 'Previous import batches' },
    '/crm-fields': { title: 'CRM Fields', subtitle: 'Mapping and normalization' },
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
        <button className="notif">🔔</button>
      </div>

      <style jsx>{`
        .ge-header{position:fixed;left:${collapsed ? '72px' : '280px'};right:0;height:72px;top:0;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 26px;background:var(--surface-transparent);backdrop-filter:blur(18px) saturate(1.2);border-bottom:1px solid var(--border);z-index:30;transition:left .22s ease;box-shadow:0 16px 40px rgba(17,24,39,.05)}
        .left{position:relative;padding-left:14px;min-width:0}
        .left::before{content:"";position:absolute;left:0;top:5px;bottom:5px;width:3px;border-radius:999px;background:linear-gradient(180deg,var(--accent),var(--gold))}
        .page-title{font-weight:850;font-size:1.08rem;color:var(--text);letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .page-sub{font-size:12px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .right{display:flex;align-items:center;gap:10px;min-width:0}
        .search{height:44px;padding:0 16px;border-radius:8px;border:1px solid var(--border);background:var(--input);color:var(--text);outline:none;min-width:0;width:clamp(180px,22vw,300px);box-shadow:inset 0 1px 0 rgba(255,255,255,.18);transition:border-color .18s, box-shadow .18s}
        .search:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
        .search::placeholder{color:var(--muted)}
        .notif{background:var(--input);border:1px solid var(--border);width:44px;height:44px;border-radius:8px;color:var(--text);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-tight)}
        .avatar{width:44px;height:44px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--violet));color:#fff;border:0;font-weight:850;box-shadow:0 14px 30px color-mix(in srgb, var(--accent) 24%, transparent)}
        @media (max-width:900px){ .search{display:none} }
        @media (max-width:768px){ .ge-header{left:72px!important;padding:0 14px} }
        @media (max-width:640px){
          .ge-header{left:0!important;height:76px;padding:10px 12px}
          .left::before{top:4px;bottom:4px}
          .page-title{font-size:1rem}
          .page-sub{max-width:46vw}
          .right{gap:8px}
          .notif,.avatar{width:40px;height:40px;border-radius:10px}
        }
        @media (max-width:380px){
          .page-sub{display:none}
          .notif{display:none}
        }
      `}</style>
    </header>
  );
}
