import React, { useState } from 'react';
import { Modal } from './Modal';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  Monitor,
  Apple,
  Chrome,
  Zap,
  WifiOff,
  ShieldCheck,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>(
    isIOS ? 'ios' : 'android'
  );
  const [installing, setInstalling] = useState(false);

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Install Maayya Future Foods App"
      subtitle="Run as an offline-ready Progressive Web App (PWA) on Mobile & Desktop"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs text-slate-700">
        {/* App Card Banner */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-lg flex items-center gap-3.5 shadow-sm">
          <img
            src="/assets/maayya-app-icon.png"
            alt="Maayya Future Foods app icon"
            className="w-12 h-12 rounded-xl border border-slate-700 shadow-md object-contain bg-white p-1 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-sm truncate font-sans">
                Maayya Future Foods
              </h4>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate">
              Smart Business Manager · Developed by MSR Solutions
            </p>
          </div>
          {isInstallable && (
            <button
              onClick={handleNativeInstall}
              disabled={installing}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{installing ? 'Installing...' : '1-Click Install'}</span>
            </button>
          )}
        </div>

        {/* Benefits strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <span className="font-semibold text-slate-800 block text-[11px]">Instant Launch</span>
            <span className="text-[10px] text-slate-500">Zero loading delay</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <WifiOff className="w-4 h-4 text-sky-500 mx-auto mb-1" />
            <span className="font-semibold text-slate-800 block text-[11px]">Offline Shell</span>
            <span className="text-[10px] text-slate-500">Works without net</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <span className="font-semibold text-slate-800 block text-[11px]">Push Alerts</span>
            <span className="text-[10px] text-slate-500">Real-time alerts</span>
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div>
          <div className="flex border-b border-slate-200 mb-3 text-xs">
            <button
              onClick={() => setActivePlatform('android')}
              className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition-colors ${
                activePlatform === 'android'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Chrome className="w-3.5 h-3.5" />
              <span>Android (Chrome / Edge)</span>
            </button>
            <button
              onClick={() => setActivePlatform('ios')}
              className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition-colors ${
                activePlatform === 'ios'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iPhone / iPad (Safari)</span>
            </button>
            <button
              onClick={() => setActivePlatform('desktop')}
              className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition-colors ${
                activePlatform === 'desktop'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Windows / Mac</span>
            </button>
          </div>

          {/* Android Guide */}
          {activePlatform === 'android' && (
            <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Open in Google Chrome</span>
                  <span className="text-slate-500 text-[11px]">
                    Ensure you are browsing on Android Chrome or Microsoft Edge.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Tap &quot;Install App&quot; or Browser Menu</span>
                  <span className="text-slate-500 text-[11px]">
                    Click the <strong>Install App</strong> button above, or tap the three dots (<strong className="font-mono">⋮</strong>) in the top-right corner.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Select &quot;Install app&quot; or &quot;Add to Home screen&quot;</span>
                  <span className="text-slate-500 text-[11px]">
                    Confirm installation. The app icon will appear directly on your Android home screen and app drawer.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* iOS Safari Guide */}
          {activePlatform === 'ios' && (
            <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Open in Safari</span>
                  <span className="text-slate-500 text-[11px]">
                    Apple requires Progressive Web Apps to be installed through Apple Safari.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    Tap the Share button
                    <Share2 className="w-3.5 h-3.5 text-sky-600" />
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    In Safari toolbar at the bottom of your screen, tap the rectangular Share button.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    Tap &quot;Add to Home Screen&quot;
                    <PlusSquare className="w-3.5 h-3.5 text-sky-600" />
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top-right corner.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Guide */}
          {activePlatform === 'desktop' && (
            <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Address Bar Icon</span>
                  <span className="text-slate-500 text-[11px]">
                    Look for the <strong>Install</strong> icon (<Download className="w-3 h-3 inline text-sky-600" />) in your Chrome or Edge address bar.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Confirm &quot;Install Maayya Future Foods&quot;</span>
                  <span className="text-slate-500 text-[11px]">
                    The app launches in a standalone window without browser tabs or address bar, just like a native Windows or Mac software.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Smart Business Manager PWA
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
