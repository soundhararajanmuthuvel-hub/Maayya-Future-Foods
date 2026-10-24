import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-slate-900/95 text-white border border-slate-700 px-3 py-2 text-xs font-medium shadow-2xl backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
      </span>
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <div>
        <span className="font-semibold block text-[11px] leading-tight">Offline Mode</span>
        <span className="text-[10px] text-slate-300 block leading-tight">Cached shell active · Local billing ready</span>
      </div>
    </div>
  );
};
