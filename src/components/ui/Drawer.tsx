import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  position?: 'right' | 'left';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'lg',
  position = 'right'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }[width];

  const positionClasses = position === 'right' ? 'right-0' : 'left-0';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 ${positionClasses} max-w-full flex pl-10`}>
        <div
          className={`w-screen ${widthClasses} bg-white border-l border-slate-200 shadow-xl flex flex-col z-10`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div>
              {title && typeof title === 'string' ? (
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              ) : (
                title
              )}
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ml-auto"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto flex-1">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

