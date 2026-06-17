import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

// Pull-to-refresh: сильный потяг сверху вниз перезагружает страницу.
// Работает на тач-устройствах. Срабатывает только когда скролл-контейнер вверху.
const THRESHOLD = 110; // насколько сильно нужно потянуть (px после сопротивления)
const MAX = 160;

const scrollableAtTop = (target: EventTarget | null): boolean => {
  let node = target as HTMLElement | null;
  while (node && node !== document.body) {
    try {
      const oy = getComputedStyle(node).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) {
        return node.scrollTop <= 0;
      }
    } catch { /* ignore */ }
    node = node.parentElement;
  }
  return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
};

export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const pullRef = useRef(0);

  useEffect(() => {
    // Только тач-устройства.
    if (!('ontouchstart' in window)) return;

    const onStart = (e: TouchEvent) => {
      if (refreshing || e.touches.length !== 1) { pulling.current = false; return; }
      if (scrollableAtTop(e.target)) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      } else {
        pulling.current = false;
        startY.current = null;
      }
    };

    const onMove = (e: TouchEvent) => {
      if (!pulling.current || startY.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { if (pullRef.current !== 0) { pullRef.current = 0; setPull(0); } return; }
      // сопротивление: тянуть нужно ощутимо
      const dist = Math.min(MAX, dy * 0.5);
      pullRef.current = dist;
      setPull(dist);
      // preventDefault не вызываем: слушатель пассивный, нативный overscroll гасим через CSS
      // (overscroll-behavior-y), чтобы не тормозить прокрутку всего приложения.
    };

    const onEnd = () => {
      if (pulling.current && pullRef.current >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPull(THRESHOLD);
        setTimeout(() => { window.location.reload(); }, 300);
      } else {
        pullRef.current = 0;
        setPull(0);
      }
      pulling.current = false;
      startY.current = null;
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove as EventListener);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [refreshing]);

  if (pull <= 0 && !refreshing) return null;

  const progress = Math.min(1, pull / THRESHOLD);
  const ready = progress >= 1;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[10000] flex justify-center pointer-events-none"
      style={{ transform: `translateY(${Math.max(0, pull - 36)}px)`, transition: refreshing ? 'transform 0.2s' : 'none' }}
      data-no-invert
    >
      <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border ${ready || refreshing ? 'border-indigo-300' : 'border-slate-200'}`}>
        <RefreshCw
          className={`h-5 w-5 ${ready || refreshing ? 'text-indigo-600' : 'text-slate-400'} ${refreshing ? 'animate-spin' : ''}`}
          style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
        />
      </div>
    </div>
  );
}
