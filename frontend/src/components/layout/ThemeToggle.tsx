"use client";

import { CircleDot, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'gray' | 'dark';

const themes: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'gray', label: 'Gray', icon: CircleDot },
  { value: 'dark', label: 'Dark', icon: Moon },
];

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

  const handleChange = (value: Theme) => {
    setTheme(value);
    applyTheme(value);
  };

  return (
    <div className="theme-switcher" role="group" aria-label="Theme switcher">
      {themes.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => handleChange(item.value)}
            className={`theme-button ${theme === item.value ? 'active' : ''}`}
            aria-pressed={theme === item.value}
            aria-label={`${item.label} theme`}
          >
            <Icon size={18} />
          </button>
        );
      })}
      <style jsx>{`
        .theme-switcher{display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:4px}
        .theme-button{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;border:0;background:transparent;color:var(--text);cursor:pointer;transition:background .2s,color .2s}
        .theme-button:hover{background:rgba(255,255,255,0.12)}
        .theme-button.active{background:var(--accent);color:var(--surface)}
      `}</style>
    </div>
  );
}
