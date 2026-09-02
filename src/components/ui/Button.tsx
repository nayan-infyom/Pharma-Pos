import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'teal';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    className = '', 
    disabled, 
    id,
    ...props 
  }, ref) => {
    
    const sizeClasses = {
      xs: 'h-7 px-2 text-xs gap-1.5 rounded-md font-medium',
      sm: 'h-8 px-3 text-xs gap-1.5 rounded-md font-medium',
      md: 'h-9 px-3.5 text-sm gap-2 rounded-md font-semibold',
      lg: 'h-11 px-5 text-base gap-2 rounded-lg font-semibold'
    }[size];

    const variantClasses = {
      primary: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-500/30',
      teal: 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-teal-500/30',
      secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200/80',
      outline: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs focus-visible:ring-2 focus-visible:ring-slate-300',
      ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200',
      danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-rose-500/30',
      success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-500/30'
    }[variant];

    return (
      <button
        ref={ref}
        id={id}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center transition-colors duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-current shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

