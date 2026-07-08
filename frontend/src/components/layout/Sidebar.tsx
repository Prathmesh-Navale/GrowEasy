"use client";
import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';

type Props = { collapsed: boolean; onToggle: () => void };

const menu = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Lead Sources', href: '/lead-sources', icon: Database },
  { label: 'AI CSV Importer', href: '/import-csv', icon: Bot },
  { label: 'Import History', href: '/import-history', icon: Clock },
  { label: 'CRM Fields', href: '/settings', icon: SlidersHorizontal },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname() || '/';

  return (
    <aside className={`ge-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <div className="logo">GE</div>
        <div className="title">GrowEasy</div>
        <button onClick={onToggle} className="collapse-toggle" aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="workspace">Workspace: Demo</div>

      <nav className="nav">
        {menu.map((m) => {
          const Icon = m.icon;

          return (
            <Link
              key={m.label}
              href={m.href}
              className={`nav-item ${pathname.startsWith(m.href) ? 'active' : ''}`}
              title={collapsed ? m.label : undefined}
              aria-label={collapsed ? m.label : undefined}
            >
              <Icon className="nav-icon" size={20} strokeWidth={2.1} aria-hidden="true" />
              <span className="nav-label">{m.label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        .ge-sidebar{position:fixed;left:0;top:0;bottom:0;width:260px;padding:18px;background:linear-gradient(180deg,var(--surface-strong),var(--surface));border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .22s ease;z-index:40;box-shadow:18px 0 60px rgba(17,24,39,.08)}
        .ge-sidebar::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(135deg,var(--accent-soft),transparent 38%),repeating-linear-gradient(0deg,rgba(127,143,164,.06) 0 1px,transparent 1px 36px);opacity:.8}
        .ge-sidebar>*{position:relative}
        .collapsed{width:72px}
        .brand{display:flex;align-items:center;gap:12px;margin-bottom:18px;min-height:46px}
        .logo{position:relative;width:46px;height:46px;min-width:46px;border-radius:14px;background:conic-gradient(from 160deg,var(--accent),var(--violet),var(--gold),var(--accent));color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:950;letter-spacing:.5px;isolation:isolate;box-shadow:0 18px 32px color-mix(in srgb, var(--accent) 28%, transparent),inset 0 1px 0 rgba(255,255,255,.5);overflow:hidden}
        .logo::before{content:"";position:absolute;inset:4px;border-radius:10px;border:1px solid rgba(255,255,255,.34);background:linear-gradient(145deg,rgba(255,255,255,.35),rgba(255,255,255,0) 45%);z-index:-1}
        .logo::after{content:"";position:absolute;left:8px;right:8px;bottom:8px;height:3px;border-radius:999px;background:rgba(255,255,255,.48)}
        .title{font-weight:850;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.01em}
        .collapse-toggle{margin-left:auto;background:var(--input);border:1px solid var(--border);color:var(--text);width:38px;height:38px;min-width:38px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .18s,background .18s,border-color .18s;box-shadow:var(--shadow-tight)}
        .collapse-toggle:hover{background:var(--accent-soft);border-color:var(--accent);transform:translateY(-1px)}
        .workspace{padding:12px;background:var(--input);border:1px solid var(--border);border-radius:8px;margin-bottom:18px;font-size:13px;color:var(--muted);box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
        .nav{display:flex;flex-direction:column;gap:10px}
        .nav-item{position:relative;min-height:48px;padding:0 14px;border-radius:8px;color:var(--text);text-decoration:none;display:flex;align-items:center;line-height:1.2;transition:background .18s,color .18s,transform .18s,border-color .18s;border:1px solid transparent}
        .nav-item::before{content:"";position:absolute;left:8px;top:12px;bottom:12px;width:3px;border-radius:999px;background:transparent}
        .nav-icon{display:none;flex:0 0 auto}
        .nav-label{white-space:normal;font-weight:720}
        .nav-item.active{background:linear-gradient(135deg,var(--accent),var(--accent-strong));color:#fff;box-shadow:0 14px 28px color-mix(in srgb, var(--accent) 24%, transparent)}
        .nav-item.active::before{background:rgba(255,255,255,.7)}
        .nav-item:hover{background:var(--input);border-color:var(--border);transform:translateX(2px)}
        .nav-item.active:hover{background:linear-gradient(135deg,var(--accent),var(--accent-strong))}
        .collapsed .title{display:none}
        .collapsed .workspace{display:none}
        .collapsed .brand{justify-content:center;gap:0;margin-bottom:28px}
        .collapsed .logo{display:none}
        .collapsed .collapse-toggle{margin-left:0}
        .collapsed .nav{gap:12px;align-items:center}
        .collapsed .nav-item{width:46px;height:46px;min-height:46px;justify-content:center;padding:0;text-align:center}
        .collapsed .nav-item::before{display:none}
        .collapsed .nav-icon{display:block}
        .collapsed .nav-label{display:none}
      `}</style>
    </aside>
  );
}
