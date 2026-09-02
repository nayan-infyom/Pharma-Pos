import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`w-full h-9 rounded-md border bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 disabled:opacity-60 disabled:bg-slate-50 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-8.5' : ''
            } ${rightIcon || rightElement ? 'pr-9' : ''} ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300'
            } ${className}`}
            {...props}
          />

          {rightIcon && !rightElement && (
            <div className="absolute right-2.5 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}

          {rightElement && (
            <div className="absolute right-2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

