import React from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { APP_CONFIG } from '../../config/appConfig';
import { Layers, Server, Database, Globe, Building2, Code2, Info } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { companyInfo } = useApp();

  // Prefer verified configurable company details from appConfig, falling back to companyInfo name if present
  const clientName = companyInfo.name || APP_CONFIG.client.companyName;
  const developerName = APP_CONFIG.developer.developerName;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="About the Software"
      subtitle="Maayya Future Foods — Smart Business Manager"
      maxWidth="xl"
    >
      <div className="space-y-4 text-slate-800">
        {/* Software Overview Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-slate-200/70 text-slate-700 shrink-0">
              <Info className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {APP_CONFIG.productName}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {APP_CONFIG.shortDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Core Project & Architecture Information */}
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
          <div className="p-3.5 bg-slate-50/50 flex items-center justify-between font-semibold text-slate-900">
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-600" />
              Software Developer
            </span>
            <span className="font-bold text-slate-900">{developerName}</span>
          </div>

          {/* Developer details: only render if configured */}
          {(APP_CONFIG.developer.officialLogo || APP_CONFIG.developer.supportEmail || APP_CONFIG.developer.website) && (
            <div className="p-3.5 space-y-1.5 bg-white text-slate-600">
              {APP_CONFIG.developer.supportEmail && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Support Email:</span>
                  <span className="font-medium text-slate-800">{APP_CONFIG.developer.supportEmail}</span>
                </div>
              )}
              {APP_CONFIG.developer.website && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Website:</span>
                  <span className="font-medium text-slate-800">{APP_CONFIG.developer.website}</span>
                </div>
              )}
            </div>
          )}

          <div className="p-3.5 bg-white space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Deployment Architecture</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded bg-slate-50 border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-sky-600" /> Frontend
                </span>
                <span className="font-semibold text-slate-800">{APP_CONFIG.stack.frontend}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                  <Server className="w-3 h-3 text-emerald-600" /> Backend API
                </span>
                <span className="font-semibold text-slate-800">{APP_CONFIG.stack.backend}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                  <Database className="w-3 h-3 text-indigo-600" /> Database
                </span>
                <span className="font-semibold text-slate-800">{APP_CONFIG.stack.database}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Information: verified or configurable details */}
        <div className="border border-slate-200 rounded-lg p-3.5 bg-white text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-900 pb-1.5 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span>Company Information</span>
          </div>

          <div className="space-y-1.5 text-slate-600">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Client Company:</span>
              <span className="font-semibold text-slate-900">{clientName}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Official Logo:</span>
              <span className="text-slate-400 italic font-mono text-[11px]">
                {APP_CONFIG.client.officialLogo || 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Address:</span>
              <span className="text-slate-700 text-right">
                {APP_CONFIG.client.address || companyInfo.address || 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Contact Details:</span>
              <span className="text-slate-700 text-right">
                {APP_CONFIG.client.contactDetails || (companyInfo.phone ? `${companyInfo.phone}${companyInfo.email ? ` · ${companyInfo.email}` : ''}` : 'Not configured')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="pt-2 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Developed by {developerName}
          </span>
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
