import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../ui/Modal';
import { Kbd } from '../ui/Kbd';
import { Keyboard } from 'lucide-react';

export const KeyboardShortcutsModal: React.FC = () => {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useAppStore();

  const shortcuts = [
    { key: 'F2', desc: 'Focus medicine / barcode search in POS terminal', category: 'POS Terminal' },
    { key: 'F4', desc: 'Select or attach customer to current sale', category: 'POS Terminal' },
    { key: 'F6', desc: 'Open checkout / payment dialog', category: 'POS Terminal' },
    { key: 'F8', desc: 'Hold current active cart to serve next patient', category: 'POS Terminal' },
    { key: 'F9', desc: 'Open held sales drawer to resume transaction', category: 'POS Terminal' },
    { key: 'Ctrl + Enter', desc: 'Instant cash settlement & invoice print', category: 'POS Terminal' },
    { key: 'Ctrl + K', desc: 'Open universal global search', category: 'Navigation' },
    { key: 'Esc', desc: 'Close open dialogs or clear active search', category: 'Navigation' },
    { key: 'Alt + P', desc: 'Jump to POS Terminal', category: 'Navigation' },
    { key: 'Alt + I', desc: 'Jump to Inventory Radar', category: 'Navigation' },
    { key: 'Alt + M', desc: 'Jump to Medicine Formulary', category: 'Navigation' }
  ];

  return (
    <Modal
      isOpen={shortcutsModalOpen}
      onClose={() => setShortcutsModalOpen(false)}
      title={
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-emerald-600" />
          <span>Keyboard Shortcuts</span>
        </div>
      }
      description="Optimized for rapid, mouse-free pharmacy counter operations."
      maxWidth="md"
    >
      <div className="space-y-1.5">
        {shortcuts.map((sc, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 rounded-md border border-slate-100 bg-slate-50/70"
          >
            <span className="text-xs text-slate-700 font-medium">{sc.desc}</span>
            <div className="flex items-center shrink-0 ml-3">
              <Kbd className="text-[10px] py-0.5 px-1.5">{sc.key}</Kbd>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

