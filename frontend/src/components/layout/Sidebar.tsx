"use client";
import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';

type Props = { collapsed: boolean; onToggle: () => void };

const menu = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Lead Sources', href: '/lead-sources' },
  { label: 'AI CSV Importer', href: '/import-csv' },
  { label: 'Import History', href: '/import-history' },
  { label: 'CRM Fields', href: '/settings' },
  { label: 'Settings', href: '/settings' },
];

export default function Sidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname() || '/';

  return (
    <aside className={`ge-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <div className="logo">GE</div>
        <div className="title">GrowEasy</div>
        <button onClick={onToggle} className="collapse-toggle" aria-label="Toggle sidebar">
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <div className="workspace">Workspace: Demo</div>

      <nav className="nav">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} className={`nav-item ${pathname.startsWith(m.href) ? 'active' : ''}`}>
            {m.label}
          </Link>
        ))}
      </nav>

      <style jsx>{`
        .ge-sidebar{position:fixed;left:0;top:0;bottom:0;width:260px;padding:20px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;transition:width .2s ease}
        .collapsed{width:72px}
        .brand{display:flex;align-items:center;gap:12px;margin-bottom:15px}
        .logo{width:40px;height:40px;border-radius:12px;background:linear-gradient(180deg,#2563eb,#1d4ed8);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
        .title{font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .collapse-toggle{margin-left:auto;background:transparent;border:1px solid var(--border);color:var(--text);width:36px;height:36px;border-radius:12px;cursor:pointer;transition:background .2s}
        .collapse-toggle:hover{background:var(--input)}
        .workspace{padding:10px;background:var(--input);border-radius:12px;margin-bottom:16px;font-size:13px;color:var(--muted)}
        .nav{display:flex;flex-direction:column;gap:8px}
        .nav-item{padding:12px 14px;border-radius:12px;color:var(--text);text-decoration:none;transition:background .2s,color .2s}
        .nav-item.active{background:var(--accent);color:#fff}
        .nav-item:hover{background:var(--input)}
        .collapsed .title{display:none}
        .collapsed .workspace{display:none}
        .collapsed .nav-item{justify-content:center;padding-left:0;padding-right:0;text-align:center}
        .collapsed .brand{justify-content:flex-start}
      `}</style>
    </aside>
  );
}
