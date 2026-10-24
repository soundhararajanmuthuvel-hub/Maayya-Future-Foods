import React from 'react';
import { Modal } from './Modal';
import { MsrLogo } from './MsrLogo';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Award,
  ExternalLink,
  Code2,
  Building,
  CheckCircle2,
  Calendar,
  Lock,
  Mail,
  Globe,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { companyInfo } = useApp();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="About Software & Systems Architecture"
      subtitle="Enterprise software certification and client licensing verification"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-slate-800">
        {/* Hero Branding: MSR Solutions */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <MsrLogo variant="hero" theme="dark" className="shrink-0" />
            <div className="border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-4 sm:pt-0 sm:pl-5 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold mb-2">
                <CheckCircle2 className="w-3 h-3" />
                Licensed & Verified Enterprise Build
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {companyInfo.name} — Smart Business Manager
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Comprehensive cold-chain retail management, batch traceability, multi-brand wholesale billing, and financial accounting system.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    Software Developer
                  </span>
                  <span className="font-bold text-sky-400 flex items-center gap-1">
                    MSR Solutions
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/maayya-future-foods-logo.png"
                    alt="Maayya Future Foods logo"
                    className="h-10 w-auto max-w-[46px] object-contain shrink-0"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                      Client Organization
                    </span>
                    <span className="font-bold text-slate-100 flex items-center gap-1">
                      {companyInfo.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {companyInfo.city}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Software Architecture & Technical Specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 pb-1 border-b border-slate-200">
              <Cpu className="w-4 h-4 text-sky-600" />
              <span>Platform Specifications</span>
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Product Name:</span>
                <span className="font-medium text-slate-800 text-right">{companyInfo.name} — Smart Business Manager</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Version:</span>
                <span className="font-mono font-semibold text-slate-800">v1.2.4 Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Framework:</span>
                <span className="text-slate-800">Desktop / React 19 + TypeScript</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Architecture:</span>
                <span className="text-slate-800">Tauri / Electron Turnkey Ready</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 pb-1 border-b border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Deployment & Licensing</span>
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Licensed To:</span>
                <span className="font-semibold text-slate-900">{companyInfo.name} Pvt Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Developed By:</span>
                <span className="font-semibold text-sky-700">MSR Solutions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                  ACTIVE ENTERPRISE
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Model:</span>
                <span className="text-slate-800">Role-Based Access Control (RBAC)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Contact & Service Level Information */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>MSR Solutions Engineering & Enterprise Support</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">SLA: Tier-1 Enterprise</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            For custom module expansion, POS hardware integrations (barcode scanners, thermal slip printers, weigh scales), and enterprise database hosting, please contact the MSR Solutions technical desk.
          </p>
          <div className="flex flex-wrap gap-4 pt-1 text-[11px] font-mono text-slate-600">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              support@msrsolutions.com
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              www.msrsolutions.com
            </span>
          </div>
        </div>

        {/* Modal Footer / Software Footer Requirement */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
            <span className="font-semibold text-slate-700">Developed by MSR Solutions</span>
            <span>•</span>
            <span>All rights reserved</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
