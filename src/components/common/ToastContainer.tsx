import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { extractSafeErrorMessage } from '../../services/authService';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icon = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
          info: <Info className="w-4 h-4 text-sky-600 shrink-0" />,
        }[toast.type] || <Info className="w-4 h-4 text-sky-600 shrink-0" />;

        const borderColor = {
          success: 'border-emerald-200 bg-white',
          warning: 'border-amber-200 bg-white',
          error: 'border-rose-200 bg-white',
          info: 'border-sky-200 bg-white',
        }[toast.type] || 'border-slate-200 bg-white';

        // Ensure title and message are strictly rendered as strings (prevent React error #31)
        const safeTitle = typeof toast.title === 'string' ? toast.title : extractSafeErrorMessage(toast.title, 'Notice');
        const safeMessage = typeof toast.message === 'string' ? toast.message : extractSafeErrorMessage(toast.message, '');

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-lg shadow-lg p-3 text-xs flex items-start gap-2.5 transition-all ${borderColor}`}
          >
            {icon}
            <div className="flex-1 pr-1">
              <p className="font-semibold text-slate-900 leading-tight">{safeTitle}</p>
              {safeMessage ? (
                <p className="text-slate-600 mt-0.5 leading-snug break-words">{safeMessage}</p>
              ) : null}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded shrink-0 cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
