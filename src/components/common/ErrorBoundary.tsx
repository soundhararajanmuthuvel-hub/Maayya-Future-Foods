import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('CRITICAL: React Error Boundary caught an unhandled rendering error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const errorMessage =
        this.state.error?.message ||
        (typeof this.state.error === 'string' ? this.state.error : 'An unexpected rendering error occurred.');

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 font-sans select-none">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-rose-950 text-white p-6 relative overflow-hidden border-b border-rose-900/60 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-rose-900/80 border border-rose-700/80 flex items-center justify-center text-rose-300 mb-3 shadow-inner">
                  <ShieldAlert className="w-6 h-6 text-rose-300" />
                </div>
                <h1 className="text-lg font-bold font-serif tracking-tight text-white">
                  Maayya Future Foods — Security & Recovery
                </h1>
                <p className="text-xs text-rose-300 mt-1">
                  Smart Business Manager · System Safeguard Active
                </p>
              </div>
            </div>

            {/* Error Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-rose-900">Application Interruption Recovered</h2>
                  <p className="mt-1 text-slate-700 font-mono break-all leading-relaxed">
                    {String(errorMessage)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                The application detected an unexpected component state and prevented a blank screen. Your data and business state remain safe. Please reload the application or return to the secure terminal.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-sky-400" />
                  <span>Reload Terminal</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4 text-slate-600" />
                  <span>Try Recovering View</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Developed by MSR Solutions</span>
              <span className="font-mono text-[10px] text-slate-600">Client: Maayya Future Foods</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
