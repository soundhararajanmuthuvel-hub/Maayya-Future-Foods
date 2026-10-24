import React from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';
import { Download, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'subtle';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { setIsPWAInstallModalOpen } = useApp();

  // If already running inside an installed PWA, do not display install button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setIsPWAInstallModalOpen(true);
      }
    } else {
      setIsPWAInstallModalOpen(true);
    }
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleInstallClick}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm active:scale-98 ${className}`}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{isIOS ? 'Install on iPhone / iPad' : 'Install PWA App'}</span>
      </button>
    );
  }

  if (variant === 'subtle') {
    return (
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors ${className}`}
        title="Install app to your home screen or desktop"
      >
        <Smartphone className="w-3.5 h-3.5 text-sky-600" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors whitespace-nowrap active:scale-98 ${className}`}
      title="Install Maayya Future Foods PWA"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
};
