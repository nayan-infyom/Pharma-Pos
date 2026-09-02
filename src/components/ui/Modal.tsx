import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
  showCloseButton = true
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

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-[95vw] h-[90vh]'
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Dialog box */}
      <div
        className={`relative w-full ${maxWidthClasses} bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden transition-all transform duration-150 my-6 z-10 flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
      >
        {(title || showCloseButton) && (
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
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
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ml-auto"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

