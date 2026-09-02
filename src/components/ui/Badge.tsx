import React from 'react';

export interface BadgeProps {
  variant?: 
    | 'default' 
    | 'success' 
    | 'warning' 
    | 'danger' 
    | 'info' 
    | 'purple' 
    | 'teal' 
    | 'outline' 
    | 'rx';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  dot = false
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium rounded',
    md: 'text-xs px-2 py-0.5 font-semibold rounded'
  }[size];

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/80',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/80',
    teal: 'bg-teal-50 text-teal-700 border border-teal-200/80',
    outline: 'border border-slate-300 text-slate-700 bg-white',
    rx: 'bg-rose-50 text-rose-800 border border-rose-200 font-bold tracking-wider'
  }[variant];

  const dotClasses = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
    outline: 'bg-slate-400',
    rx: 'bg-rose-500'
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${sizeClasses} ${variantClasses} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses}`} />}
      {children}
    </span>
  );
};

