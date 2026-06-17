import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Ночной режим — лёгкий CSS-фильтр на весь сайт (класс на <html>), состояние в localStorage.
export default function NightToggle({ className = '' }: { className?: string }) {
  const [night, setNight] = useState(() => {
    try { return localStorage.getItem('scladpro_night') === '1'; } catch { return false; }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (night) root.classList.add('night'); else root.classList.remove('night');
    try { localStorage.setItem('scladpro_night', night ? '1' : '0'); } catch {}
  }, [night]);
  // Синхронизация между вкладками/компонентами
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'scladpro_night') setNight(e.newValue === '1');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return (
    <button
      onClick={() => setNight((v) => !v)}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors ${className}`}
      title={night ? 'Дневной режим' : 'Ночной режим'}
      aria-label="Переключить тему"
      data-no-invert
    >
      {night ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
