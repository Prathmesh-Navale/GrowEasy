"use client";
import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

type Props = { children: React.ReactNode };

export default function AppShell({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />
      <div className="main-area" style={{ marginLeft: collapsed ? 72 : 260 }}>
        <Header />
        <main className="content">{children}</main>
      </div>

      <style jsx>{`
        .app-shell { display:flex; min-height:100vh; background: var(--bg); }
        .main-area { flex:1; display:flex; flex-direction:column; }
        .content { padding:20px; margin-top:64px; overflow:auto; height:calc(100vh - 64px); }
        @media (max-width:768px){ .main-area{ margin-left:72px !important } }
      `}</style>
    </div>
  );
}
