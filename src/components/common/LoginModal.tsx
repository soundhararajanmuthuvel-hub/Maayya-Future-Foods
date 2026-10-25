import React, { useState } from 'react';
import { MsrLogo } from './MsrLogo';
import { Lock, User, KeyRound, Shield, CheckCircle, ArrowRight, X, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APP_CONFIG } from '../../config/appConfig';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { addToast, companyInfo } = useApp();

  const validPin = APP_CONFIG.terminalSecurity?.defaultPin || '1911';
  const terminalDesk = APP_CONFIG.terminalSecurity?.terminalDesk || 'TERMINAL-01 (Main POS)';
  const ownerName = APP_CONFIG.owner?.name || 'Kalai';
  const ownerRole = APP_CONFIG.owner?.role || 'Owner';

  const [pin, setPin] = useState(validPin);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.trim() !== validPin) {
      setPinError('Invalid Security PIN. Access denied.');
      addToast({
        type: 'error',
        title: 'Authentication Failed',
        message: 'Invalid Security PIN. Please enter the authorized PIN.',
      });
      return;
    }

    setPinError('');
    addToast({
      type: 'success',
      title: 'Authenticated Successfully',
      message: `Signed in as ${ownerName} (${ownerRole}). Workspace verified.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header with MSR Solutions Developer Branding */}
        <div className="bg-slate-950 text-white p-6 relative overflow-hidden border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* MSR Solutions Logo Placeholder and Identity */}
          <div className="flex flex-col items-center text-center">
            <MsrLogo variant="hero" theme="dark" />
            <div className="mt-3 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-sky-400">
              Terminal Access & Security Lock
            </div>
          </div>
        </div>

        {/* Client Business Title & Product Identification */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/maayya-future-foods-logo.png"
              alt="Maayya Future Foods logo"
              className="h-9 w-auto max-w-[46px] object-contain shrink-0"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Client Business
              </span>
              <span className="font-bold text-slate-900 font-serif text-sm">
                {companyInfo.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Application
            </span>
            <span className="font-semibold text-slate-700">
              Smart Business Manager
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSignIn} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Authorized Owner Profile
            </label>
            <div className="p-3 rounded-lg border border-sky-600 bg-sky-50/60 ring-1 ring-sky-500 shadow-xs flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm ring-1 ring-slate-800">
                  K
                </div>
                <div>
                  <div className="font-bold text-slate-900">{ownerName}</div>
                  <div className="text-[11px] text-slate-600 font-medium">Single-User Business Owner</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Full Owner Access
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Security PIN</label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 focus:outline-none"
                  title={showPin ? 'Hide PIN' : 'Reveal PIN'}
                >
                  {showPin ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError('');
                  }}
                  className={`w-full px-3 py-1.5 text-xs border rounded font-mono tracking-widest pl-8 ${
                    pinError
                      ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-rose-500'
                      : 'border-slate-300 text-slate-900 focus:ring-slate-900'
                  }`}
                  placeholder="••••"
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
              </div>
              {pinError && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{pinError}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Terminal Desk</label>
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-600 truncate">
                {terminalDesk}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Authenticate & Enter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Software Footer: "Developed by MSR Solutions" */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Developed by MSR Solutions</span>
          <span className="font-mono text-[10px]">Client: {companyInfo.name}</span>
        </div>
      </div>
    </div>
  );
};
