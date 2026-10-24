import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DemoBanner: React.FC = () => {
  const { resetAllDemoData, companyInfo } = useApp();

  return (
    <div className="demo-banner bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-semibold text-amber-950">Demonstration Prototype</span>
        <span className="text-amber-800 hidden sm:inline">
          — Sample data loaded for {companyInfo.name}. All transactions, bills, and payments simulate in-memory without backend persistence.
        </span>
      </div>
      <button
        onClick={resetAllDemoData}
        className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium text-amber-950 hover:bg-amber-200/50 rounded transition-colors shrink-0"
        title="Reset all demo records back to baseline"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Reset Demo Data</span>
      </button>
    </div>
  );
};
