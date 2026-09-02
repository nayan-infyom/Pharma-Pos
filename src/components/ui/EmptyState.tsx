import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
        {icon || <PackageOpen className="w-5 h-5" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-3">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

