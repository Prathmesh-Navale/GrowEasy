"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Database,
  FolderKanban,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftClose,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = { collapsed: boolean; onToggle: () => void };
type Theme = 'light' | 'gray' | 'dark';

const sidebarWidth = 280;
const collapsedWidth = 72;
const themeOrder: Theme[] = ['light', 'gray', 'dark'];
const storageKey = 'groweasy-theme';

const menu = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Lead Sources', href: '/lead-sources', icon: FolderKanban },
  { label: 'AI CSV Importer', href: '/import-csv', icon: Sparkles },
  { label: 'Import History', href: '/import-history', icon: History },
  { label: 'CRM Fields', href: '/crm-fields', icon: Database },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.remove('theme-light', 'theme-gray', 'theme-dark');
  document.documentElement.classList.add(`theme-${theme}`);
  window.localStorage.setItem(storageKey, theme);
}

function SidebarTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-[58px] top-1/2 z-50 -translate-y-1/2 rounded-lg border border-white/[0.08] bg-[#162033] px-3 py-2 text-xs font-medium text-[#F8FAFC] opacity-0 shadow-2xl shadow-black/30 transition duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:translate-x-1 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: (typeof menu)[number];
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const createRipple = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((current) => [
      ...current.slice(-2),
      { id, x: event.clientX - rect.left, y: event.clientY - rect.top },
    ]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id));
    }, 520);
  };

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      onClick={createRipple}
      className={cn(
        'group relative flex min-h-11 items-center rounded-xl border text-sm tracking-[-0.01em] outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]',
        collapsed ? 'h-11 w-11 justify-center overflow-visible px-0' : 'w-full gap-3 overflow-hidden px-3.5',
        active
          ? 'border-white/[0.06] bg-[#3B82F6]/18 text-[#F8FAFC] shadow-[0_12px_30px_rgba(59,130,246,0.14)]'
          : 'border-transparent text-[#94A3B8] hover:border-white/[0.04] hover:bg-[rgba(59,130,246,0.08)] hover:text-[#F8FAFC]',
      )}
    >
      {active && (
        <motion.span
          layoutId="activeSidebarItem"
          className="absolute inset-0 rounded-xl bg-[#3B82F6]/12"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
      {active && !collapsed && <span className="absolute left-0 top-2.5 h-6 w-1 rounded-r-full bg-[#3B82F6]" />}
      <motion.span
        className={cn(
          'relative z-10 flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-200',
          active ? 'text-[#F8FAFC]' : 'text-[#94A3B8] group-hover:text-[#F8FAFC]',
        )}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
      >
        <Icon size={19} strokeWidth={active ? 2.5 : 2.1} fill={active ? 'currentColor' : 'none'} />
      </motion.span>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.16 }}
            className={cn('relative z-10 truncate', active ? 'font-semibold' : 'font-medium')}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="pointer-events-none absolute h-8 w-8 rounded-full bg-white/20"
          style={{ left: ripple.x - 16, top: ripple.y - 16 }}
          initial={{ scale: 0, opacity: 0.45 }}
          animate={{ scale: 7, opacity: 0 }}
          transition={{ duration: 0.52, ease: 'easeOut' }}
        />
      ))}
      {collapsed && <SidebarTooltip label={item.label} />}
    </Link>
  );
}

export default function Sidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname() || '/';
  const [theme, setTheme] = useState<Theme>('light');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) as Theme | null;
    const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(preferred);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const toggleTheme = () => {
    const nextTheme = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length];
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  if (isMobile) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#0F172A]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 text-[#F8FAFC] shadow-[0_-18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
        aria-label="Primary navigation"
      >
        <div className="grid grid-cols-6 gap-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold tracking-[-0.01em] outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#3B82F6]',
                  active ? 'bg-[#3B82F6]/18 text-[#F8FAFC]' : 'text-[#94A3B8] hover:bg-[rgba(59,130,246,0.08)] hover:text-[#F8FAFC]',
                )}
              >
                <Icon size={19} strokeWidth={active ? 2.5 : 2.1} fill={active ? 'currentColor' : 'none'} />
                <span className="max-w-full truncate">{item.label.replace('AI CSV ', '').replace('Import ', '')}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? collapsedWidth : sidebarWidth }}
      transition={{ type: 'spring', stiffness: 360, damping: 38 }}
      className="fixed bottom-0 left-0 top-0 z-40 flex overflow-visible rounded-r-[22px] border-r border-white/[0.06] bg-[#0F172A] text-[#F8FAFC] shadow-[18px_0_70px_rgba(0,0,0,0.28)]"
      aria-label="Primary navigation"
    >
      <div className="flex h-full w-full flex-col px-3.5 py-4">
        <div className="flex min-h-[52px] items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#162033] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <Sparkles size={20} strokeWidth={2.4} className="text-[#3B82F6]" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16 }}
                className="min-w-0 flex-1 pt-0.5"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-bold tracking-[-0.02em]">GrowEasy</span>
                  <span className="rounded-full border border-[#3B82F6]/25 bg-[#3B82F6]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#93C5FD]">
                    Pro
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-medium text-[#94A3B8]">AI CRM Import Suite</p>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="ml-auto h-10 w-10 shrink-0 rounded-xl border-white/[0.06] bg-[#162033] text-[#94A3B8] hover:bg-[#1B2940] hover:text-[#F8FAFC]"
          >
            {collapsed ? <ChevronRight size={18} /> : <PanelLeftClose size={18} />}
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="mt-5 flex min-h-12 w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-[#162033] px-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-200 hover:border-[#3B82F6]/25 hover:bg-[#1A263A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
              aria-label="Switch workspace"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6] text-xs font-bold text-white">
                GE
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold tracking-[-0.01em] text-[#F8FAFC]">
                  Demo Workspace
                </span>
                <span className="block truncate text-xs font-medium text-[#94A3B8]">Sales operations</span>
              </span>
              <ChevronDown size={17} className="text-[#94A3B8]" />
            </motion.button>
          )}
        </AnimatePresence>

        <nav className={cn('mt-6 flex flex-col gap-1.5', collapsed && 'items-center')} aria-label="GrowEasy sections">
          {menu.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))}
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-white/[0.06] pt-4">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#162033] text-sm font-bold text-[#F8FAFC] ring-1 ring-white/[0.06]">
              JD
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.16 }}
                  className="min-w-0"
                >
                  <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[#F8FAFC]">Jordan Davis</p>
                  <p className="truncate text-xs font-medium text-[#94A3B8]">jordan@groweasy.ai</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={cn('mt-3 grid gap-2', collapsed ? 'place-items-center' : 'grid-cols-2')}>
            <Button
              type="button"
              variant="outline"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
              className={cn(
                'group relative min-h-11 rounded-xl border-white/[0.06] bg-[#162033] text-[#94A3B8] hover:bg-[rgba(59,130,246,0.08)] hover:text-[#F8FAFC]',
                collapsed ? 'w-11 px-0' : 'w-full gap-2 px-3',
              )}
            >
              <ThemeIcon size={18} />
              {!collapsed && <span className="truncate text-sm font-semibold">Theme</span>}
              {collapsed && <SidebarTooltip label="Theme" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-label="Log out"
              title="Log out"
              className={cn(
                'group relative min-h-11 rounded-xl border-white/[0.06] bg-[#162033] text-[#94A3B8] hover:bg-[rgba(59,130,246,0.08)] hover:text-[#F8FAFC]',
                collapsed ? 'w-11 px-0' : 'w-full gap-2 px-3',
              )}
            >
              <LogOut size={18} />
              {!collapsed && <span className="truncate text-sm font-semibold">Logout</span>}
              {collapsed && <SidebarTooltip label="Logout" />}
            </Button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
