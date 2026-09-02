import React from 'react';

export const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <kbd className={`inline-flex items-center justify-center font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-600 select-none ${className}`}>
      {children}
    </kbd>
  );
};

