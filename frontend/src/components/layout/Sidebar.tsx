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
        .ge-sidebar{position:fixed;left:0;top:0;bottom:0;width:260px;padding:20px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .2s ease}
        .collapsed{width:72px}
        .brand{display:flex;align-items:center;gap:12px;margin-bottom:18px;min-height:44px}
        .logo{position:relative;width:44px;height:44px;min-width:44px;border-radius:14px;background:linear-gradient(135deg,#16a34a 0%,#2563eb 58%,#7c3aed 100%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;letter-spacing:.4px;isolation:isolate;box-shadow:0 12px 24px rgba(37,99,235,.24),inset 0 1px 0 rgba(255,255,255,.42);overflow:hidden}
        .logo::before{content:"";position:absolute;inset:3px;border-radius:11px;border:1px solid rgba(255,255,255,.34);background:linear-gradient(145deg,rgba(255,255,255,.28),rgba(255,255,255,0) 44%);z-index:-1}
        .logo::after{content:"";position:absolute;right:-10px;bottom:-12px;width:30px;height:30px;border-radius:999px;background:rgba(255,255,255,.24);box-shadow:-23px -24px 0 -12px rgba(255,255,255,.28)}
        .title{font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .collapse-toggle{margin-left:auto;background:transparent;border:1px solid var(--border);color:var(--text);width:36px;height:36px;min-width:36px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s}
        .collapse-toggle:hover{background:var(--input)}
        .workspace{padding:10px;background:var(--input);border-radius:12px;margin-bottom:16px;font-size:13px;color:var(--muted)}
        .nav{display:flex;flex-direction:column;gap:12px}
        .nav-item{min-height:48px;padding:12px 14px;border-radius:12px;color:var(--text);text-decoration:none;display:flex;align-items:center;line-height:1.2;transition:background .2s,color .2s}
        .nav-icon{display:none;flex:0 0 auto}
        .nav-label{white-space:normal}
        .nav-item.active{background:var(--accent);color:#fff}
        .nav-item:hover{background:var(--input)}
        .nav-item.active:hover{background:var(--accent-strong)}
        .collapsed .title{display:none}
        .collapsed .workspace{display:none}
        .collapsed .brand{justify-content:center;gap:0;margin-bottom:26px}
        .collapsed .logo{display:none}
        .collapsed .collapse-toggle{margin-left:0}
        .collapsed .nav{gap:14px;align-items:center}
        .collapsed .nav-item{width:48px;height:48px;min-height:48px;justify-content:center;padding:0;text-align:center}
        .collapsed .nav-icon{display:block}
        .collapsed .nav-label{display:none}
      `}</style>
    </aside>
  );
}
