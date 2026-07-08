"use client";

import { CircleDot, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'gray' | 'dark';

const themeOrder: Theme[] = ['light', 'gray', 'dark'];
const themeIcons = {
  light: Sun,
  gray: CircleDot,
  dark: Moon,
};
const themeLabels = {
  light: 'Light Mode',
  gray: 'Gray Mode',
  dark: 'Dark Mode',
};

const storageKey = 'groweasy-theme';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.remove('theme-light', 'theme-gray', 'theme-dark');
  document.documentElement.classList.add(`theme-${theme}`);
  window.localStorage.setItem(storageKey, theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) as Theme | null;
    const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(preferred);
    applyTheme(preferred);
  }, []);

  const toggleTheme = () => {
    const nextTheme = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length];
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const Icon = themeIcons[theme];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle-button"
      title={`Switch theme (current: ${themeLabels[theme]})`}
      aria-label="Toggle theme"
    >
      <Icon size={18} />
      <span className="theme-label">{themeLabels[theme]}</span>
      <style jsx>{`
        .theme-toggle-button{height:44px;display:flex;align-items:center;gap:8px;padding:0 14px;border-radius:8px;border:1px solid var(--border);background:var(--input);color:var(--text);cursor:pointer;font-weight:760;transition:transform .18s,background .18s,border-color .18s;box-shadow:var(--shadow-tight)}
        .theme-toggle-button:hover{transform:translateY(-1px);background:var(--accent-soft);border-color:var(--accent)}
        .theme-label{display:none}@media(min-width:768px){.theme-label{display:inline-block}}
      `}</style>
    </button>
  );
}
