import React from 'react';

// Lightweight shimmer skeletons used as loading placeholders instead of bare text.

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
);

// A full-page skeleton that mimics the dashboard layout (header card + content grid).
export const PageSkeleton = () => (
  <div className="min-h-screen bg-slate-50 p-4 md:p-6">
    <div className="mb-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
      <Skeleton className="h-4 w-64 max-w-[60%]" />
      <Skeleton className="mt-2 h-3 w-80 max-w-[80%]" />
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

// A compact skeleton for sections/tabs loading inside an already-rendered shell.
export const SectionSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <Skeleton className="h-4 w-48" />
    <div className="mt-4 space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  </div>
);
