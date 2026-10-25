import React, { useState } from 'react';
import { MsrLogo } from './MsrLogo';
import { Lock, User, KeyRound, Shield, CheckCircle, ArrowRight, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { addToast, companyInfo } = useApp();

  const [selectedRole, setSelectedRole] = useState<'admin' | 'billing' | 'inventory'>('admin');
  const [pin, setPin] = useState('1240');
  const [userName, setUserName] = useState('Rajesh Kumar (Store Manager)');

  if (!isOpen) return null;

  const users = [
    {
      role: 'admin' as const,
      name: 'Rajesh Kumar',
      title: 'Store Operations Manager',
      email: 'rajesh@mayafuturefoods.com',
      pin: '1240',
      badge: 'Full Access',
    },
    {
      role: 'billing' as const,
      name: 'Suresh V',
      title: 'Senior POS Cashier',
      email: 'suresh@mayafuturefoods.com',
      pin: '5521',
      badge: 'Billing & Cash',
    },
    {
      role: 'inventory' as const,
      name: 'Priya Sundaram',
      title: 'Cold Storage Auditor',
      email: 'priya@mayafuturefoods.com',
      pin: '8832',
      badge: 'Stock & Batches',
    },
  ];

  const handleSelectUser = (user: typeof users[0]) => {
    setSelectedRole(user.role);
    setUserName(`${user.name} (${user.title})`);
    setPin(user.pin);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Authenticated Successfully',
      message: `Signed in as ${userName}. Workspace loaded.`,
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
              Select Operating Profile
            </label>
            <div className="grid grid-cols-1 gap-2">
              {users.map((u) => {
                const isSelected = selectedRole === u.role;
                return (
                  <div
                    key={u.role}
                    onClick={() => handleSelectUser(u)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/60 ring-1 ring-sky-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.title}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                      {u.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Security PIN</label>
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono tracking-widest pl-8"
                  placeholder="••••"
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Terminal Desk</label>
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-600 truncate">
                TERMINAL-01 (Main POS)
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
