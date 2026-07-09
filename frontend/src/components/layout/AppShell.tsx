"use client";
import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

type Props = { children: React.ReactNode };

export default function AppShell({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarWidth = isMobile ? 0 : collapsed ? 72 : 280;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />
      <div className="main-area" style={{ marginLeft: sidebarWidth }}>
        <Header collapsed={collapsed || isMobile} />
        <main className="content">{children}</main>
      </div>

      <style jsx>{`
        :global(html) {
          color-scheme: light;
          --bg: #eef4f8;
          --surface: rgba(255,255,255,.78);
          --surface-strong: #ffffff;
          --surface-transparent: rgba(255,255,255,.72);
          --card: rgba(255,255,255,.84);
          --text: #152033;
          --muted: #66758a;
          --border: rgba(87,108,134,.22);
          --input: rgba(244,248,251,.86);
          --accent: #1f8f7a;
          --accent-strong: #136f64;
          --accent-soft: rgba(31,143,122,.13);
          --danger: #c2414b;
          --gold: #c99234;
          --violet: #6f63dc;
          --shadow: 0 22px 70px rgba(33,48,72,.11);
          --shadow-tight: 0 12px 28px rgba(33,48,72,.10);
        }
        :global(html.theme-gray) {
          color-scheme: light;
          --bg: #e6ebef;
          --surface: rgba(250,252,253,.82);
          --surface-strong: #f8fafc;
          --surface-transparent: rgba(248,250,252,.78);
          --card: rgba(255,255,255,.86);
          --text: #17202d;
          --muted: #526071;
          --border: rgba(83,96,112,.26);
          --input: rgba(238,243,247,.88);
          --accent: #475569;
          --accent-strong: #273445;
          --accent-soft: rgba(71,85,105,.13);
          --danger: #a9323c;
          --shadow: 0 22px 70px rgba(15,23,42,.10);
          --shadow-tight: 0 12px 28px rgba(15,23,42,.10);
        }
        :global(html.theme-dark) {
          color-scheme: dark;
          --bg: #070b14;
          --surface: rgba(17,24,39,.76);
          --surface-strong: #111827;
          --surface-transparent: rgba(12,18,32,.78);
          --card: rgba(20,30,47,.82);
          --text: #eef4fb;
          --muted: #9caec3;
          --border: rgba(148,163,184,.20);
          --input: rgba(25,35,53,.86);
          --accent: #2dd4bf;
          --accent-strong: #14b8a6;
          --accent-soft: rgba(45,212,191,.14);
          --danger: #fb7185;
          --gold: #f4b860;
          --violet: #a5a0ff;
          --shadow: 0 26px 80px rgba(0,0,0,.34);
          --shadow-tight: 0 14px 34px rgba(0,0,0,.28);
        }
        :global(body) {
          width:100%;
          overflow-x:hidden;
          background: var(--bg);
          color: var(--text);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        :global(::selection) { background: color-mix(in srgb, var(--accent) 24%, transparent); }
        .app-shell {
          position:relative;
          display:flex;
          min-height:100vh;
          overflow:hidden;
          background:
            linear-gradient(115deg, rgba(31,143,122,.12), transparent 32%),
            linear-gradient(245deg, rgba(111,99,220,.12), transparent 36%),
            repeating-linear-gradient(90deg, rgba(87,108,134,.05) 0 1px, transparent 1px 44px),
            repeating-linear-gradient(0deg, rgba(87,108,134,.04) 0 1px, transparent 1px 44px),
            var(--bg);
        }
        .app-shell::before {
          content:"";
          position:fixed;
          inset:0;
          pointer-events:none;
          background:linear-gradient(180deg, rgba(255,255,255,.22), transparent 30%, rgba(255,255,255,.08));
          mix-blend-mode:soft-light;
          opacity:.7;
        }
        .main-area {
          position:relative;
          flex:1;
          min-width:0;
          display:flex;
          flex-direction:column;
          transition:margin-left .22s ease;
        }
        .content {
          position:relative;
          padding:26px;
          margin-top:72px;
          overflow:auto;
          overflow-x:hidden;
          height:calc(100vh - 72px);
        }
        .content::before {
          content:"";
          position:fixed;
          left:${sidebarWidth}px;
          right:0;
          top:72px;
          height:1px;
          background:linear-gradient(90deg, transparent, var(--border), transparent);
          pointer-events:none;
        }
        @media (max-width:768px){
          .main-area{ margin-left:72px !important }
          .content{padding:16px}
        }
        @media (max-width:640px){
          .main-area{ margin-left:0 !important; width:100% }
          .content{
            height:auto;
            min-height:100vh;
            margin-top:76px;
            padding:14px;
            padding-bottom:96px;
            overflow:visible;
          }
          .content::before{left:0;top:76px}
        }
      `}</style>
    </div>
  );
}
