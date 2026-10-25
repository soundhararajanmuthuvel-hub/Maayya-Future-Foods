import React from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen, setCurrentScreen } = useApp();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: '⌘ + K / Ctrl + K', desc: 'Open Global Fast Search' },
    { key: '?', desc: 'Show this Keyboard Shortcuts cheat-sheet' },
    { key: 'ESC', desc: 'Close any active modal or drawer' },
  ];

  const quickNav = [
    { label: 'Direct POS Billing', screen: 'billing-direct' as const, key: 'POS Counter' },
    { label: 'Retail Shop Billing', screen: 'billing-retail' as const, key: 'Wholesale Invoice' },
    { label: 'New Purchase Entry', screen: 'purchases' as const, key: 'GRN Inward' },
    { label: 'Inventory & Stock Management', screen: 'inventory' as const, key: 'Stock Inventory' },
    { label: 'Retail Receivables', screen: 'shops' as const, key: 'Receive Payment' },
    { label: 'Daily Cash Closing', screen: 'expenses' as const, key: 'Reconciliation' },
  ];

  return (
    <Modal
      isOpen={isShortcutsOpen}
      onClose={() => setIsShortcutsOpen(false)}
      title="Desktop Operations & Keyboard Shortcuts"
      subtitle="Fast workflow access for high-speed counter operations"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-slate-900 mb-2 text-xs uppercase tracking-wider text-slate-500">
            System Keys
          </h4>
          <div className="space-y-1.5">
            {shortcuts.map((sc, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">{sc.desc}</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px] text-slate-800 font-semibold">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 mb-2 text-xs uppercase tracking-wider text-slate-500">
            Quick Navigators
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {quickNav.map((qn, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentScreen(qn.screen);
                  setIsShortcutsOpen(false);
                }}
                className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <div className="font-medium text-slate-900">{qn.label}</div>
                <div className="text-[10px] text-slate-400 font-mono">{qn.key}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
