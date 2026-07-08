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
      </div>

      <div className="workspace">Workspace: Demo</div>

      <nav className="nav">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} className={`nav-item ${pathname.startsWith(m.href) ? 'active' : ''}`}>
            {m.label}
          </Link>
        ))}
      </nav>

      <div className="bottom">
        <button onClick={onToggle} className="toggle">{collapsed ? '›' : '‹'}</button>
      </div>

      <style jsx>{`
        .ge-sidebar{position:fixed;left:0;top:0;bottom:0;width:260px;padding:20px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column}
        .collapsed{width:72px}
        .brand{display:flex;align-items:center;gap:12px;margin-bottom:12px}
        .logo{width:40px;height:40px;border-radius:8px;background:linear-gradient(180deg,#2563eb,#1d4ed8);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
        .title{font-weight:700}
        .workspace{padding:8px;background:var(--input);border-radius:8px;margin-bottom:12px;font-size:13px;color:var(--muted)}
        .nav{display:flex;flex-direction:column;gap:6px}
        .nav-item{padding:8px 10px;border-radius:8px;color:var(--text);text-decoration:none}
        .nav-item.active{background:var(--accent);color:#fff}
        .bottom{margin-top:auto}
        .toggle{background:transparent;border:1px solid var(--border);padding:6px;border-radius:6px;color:var(--text)}
      `}</style>
    </aside>
  );
}
