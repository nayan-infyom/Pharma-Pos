import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'underline'
}) => {
  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-1 p-1 bg-slate-100/90 rounded-lg border border-slate-200/80 overflow-x-auto ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`border-b border-slate-200 flex gap-6 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer -mb-px ${
              isActive
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

