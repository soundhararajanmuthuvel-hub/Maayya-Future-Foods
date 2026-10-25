import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { verifySecurityPinWithBackend, extractSafeErrorMessage } from '../../services/authService';

interface PinLockScreenProps {
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasConnectionIssue, setHasConnectionIssue] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPin = pin.trim();
    if (!cleanPin) {
      setErrorMsg('Please enter your Security PIN.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    setHasConnectionIssue(false);

    try {
      const result = await verifySecurityPinWithBackend(cleanPin);

      if (result.success) {
        onUnlock();
      } else {
        // Guaranteed string extraction — never pass raw objects into React state
        const safeError = extractSafeErrorMessage(result.error, 'Incorrect Security PIN. Access denied.');
        setErrorMsg(safeError);
        setPin('');
      }
    } catch (err: unknown) {
      const safeError = extractSafeErrorMessage(err, 'Verification service unreachable.');
      setErrorMsg(safeError);
      setHasConnectionIssue(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetry = () => {
    setErrorMsg('');
    setHasConnectionIssue(false);
    if (pin.trim()) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 select-none overflow-hidden font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Terminal Header */}
        <div className="bg-slate-950 text-white p-6 relative overflow-hidden border-b border-slate-800 text-center">
          <div className="flex flex-col items-center">
            <img
              src="/assets/maayya-future-foods-logo.png"
              alt="Maayya Future Foods logo"
              className="h-16 w-auto max-w-[80px] object-contain shrink-0 mb-3 drop-shadow-md"
            />
            <h1 className="text-lg font-bold font-serif tracking-tight text-white">
              Maayya Future Foods
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Smart Business Manager
            </p>
            <div className="mt-3 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-sky-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-sky-400" />
              <span>Owner Access · Terminal Protected</span>
            </div>
          </div>
        </div>

        {/* Owner Profile Banner */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-800">
              K
            </div>
            <div>
              <div className="font-bold text-slate-900">Kalai</div>
              <div className="text-[11px] text-slate-500 font-medium">Business Owner</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
            TERMINAL-01 (Main POS)
          </span>
        </div>

        {/* PIN Entry Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="owner-security-pin-input" className="block text-xs font-bold text-slate-700">
                Security PIN
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 focus:outline-none cursor-pointer"
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
                id="owner-security-pin-input"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                autoFocus
                disabled={isVerifying}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                  setHasConnectionIssue(false);
                }}
                className={`w-full px-4 py-2.5 text-center text-lg tracking-[0.3em] font-mono border rounded-lg pl-10 pr-10 focus:outline-none transition-colors ${
                  errorMsg
                    ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900'
                }`}
                placeholder="••••"
                required
              />
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>

            {errorMsg ? (
              <div className="flex flex-col gap-1.5 mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="break-words">{String(errorMsg)}</span>
                </div>
                {hasConnectionIssue && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="self-start mt-1 text-[11px] text-rose-700 underline hover:text-rose-900 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Verification</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 mt-2 text-center">
                Enter your 4-digit Security PIN to access the workspace.
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isVerifying || !pin}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Unlock Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Developed by MSR Solutions</span>
          <span className="font-mono text-[10px]">Session Resets On Refresh</span>
        </div>
      </div>
    </div>
  );
};
