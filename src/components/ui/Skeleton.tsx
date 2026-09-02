import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="w-full space-y-2">
      <div className="h-9 bg-slate-100 rounded-md animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2.5 border-b border-slate-100">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className={`h-3.5 ${j === 0 ? 'w-1/3' : 'w-1/6'}`} />
          ))}
        </div>
      ))}
    </div>
  );
};

