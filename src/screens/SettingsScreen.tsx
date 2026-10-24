import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../utils/formatters';
import { Brand } from '../types';
import {
  Settings,
  Building2,
  FileText,
  Sliders,
  Database,
  History,
  CheckCircle2,
  Download,
  Upload,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  ShieldAlert,
  Info,
  ShieldCheck,
  Cpu,
  Mail,
  Globe,
  ExternalLink,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Check,
  X,
  Smartphone,
  Bell,
  Send,
  Wifi,
  WifiOff,
  Share2,
} from 'lucide-react';
import { MsrLogo } from '../components/common/MsrLogo';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  subscribeToPushNotifications,
  sendTestPushNotification,
  getNotificationPermission,
} from '../services/notificationService';

export const SettingsScreen: React.FC = () => {
  const {
    auditLog,
    resetAllDemoData,
    exportDatabaseBackup,
    restoreDatabaseBackup,
    addToast,
    brands,
    addBrand,
    updateBrand,
    deleteBrand,
    toggleBrandStatus,
    companyInfo,
    updateCompanyInfo,
    products,
    notificationPreferences,
    updateNotificationPreferences,
    setIsPWAInstallModalOpen,
    setIsNotificationsModalOpen,
    unreadNotificationsCount,
  } = useApp();

  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [subscribing, setSubscribing] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'pwa' | 'brands' | 'company' | 'gst' | 'coldchain' | 'backup' | 'audit' | 'checklist' | 'about'
  >('pwa');

  // Company Profile Form State initialized from AppContext
  const [companyForm, setCompanyForm] = useState(companyInfo);

  useEffect(() => {
    setCompanyForm(companyInfo);
  }, [companyInfo]);

  // Brand Management State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandForm, setBrandForm] = useState({
    name: '',
    category: 'Dairy & Fresh Milk',
    logoUrl: '',
    status: 'Active' as 'Active' | 'Inactive',
    description: '',
  });

  // Invoice / Tax settings
  const [invoicePrefix, setInvoicePrefix] = useState('INV-2026-');
  const [posPrefix, setPosPrefix] = useState('POS-2026-');
  const [taxInclusiveWholesale, setTaxInclusiveWholesale] = useState(false);
  const [taxInclusivePOS, setTaxInclusivePOS] = useState(true);
  const [showHsnOnInvoice, setShowHsnOnInvoice] = useState(true);

  // Inventory & Expiry threshold settings
  const [nearExpiryDays, setNearExpiryDays] = useState(15);
  const [minStockBufferPercent, setMinStockBufferPercent] = useState(10);

  // Backup state
  const [backupStatus, setBackupStatus] = useState<'Success' | 'Pending' | 'Connected' | 'Offline'>('Connected');
  const [lastBackupTime, setLastBackupTime] = useState('2026-10-23 16:45');
  const [restoreJson, setRestoreJson] = useState('');
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyInfo(companyForm);
  };

  const handleOpenAddBrand = () => {
    setEditingBrand(null);
    setBrandForm({
      name: '',
      category: 'Dairy & Fresh Milk',
      logoUrl: '',
      status: 'Active',
      description: '',
    });
    setIsBrandModalOpen(true);
  };

  const handleOpenEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      category: brand.category,
      logoUrl: brand.logoUrl,
      status: brand.status,
      description: brand.description || '',
    });
    setIsBrandModalOpen(true);
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name.trim()) {
      addToast({
        type: 'error',
        title: 'Brand Name Required',
        message: 'Please provide a valid brand name.',
      });
      return;
    }

    if (editingBrand) {
      updateBrand({
        ...editingBrand,
        name: brandForm.name.trim(),
        category: brandForm.category.trim(),
        logoUrl: brandForm.logoUrl.trim(),
        status: brandForm.status,
        description: brandForm.description.trim(),
      });
    } else {
      addBrand({
        name: brandForm.name.trim(),
        category: brandForm.category.trim(),
        logoUrl: brandForm.logoUrl.trim(),
        status: brandForm.status,
        description: brandForm.description.trim(),
      });
    }

    setIsBrandModalOpen(false);
  };

  // Image Upload Handler with validation
  const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation 1: Image file type
    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please select a valid image file (PNG, JPG, SVG, WebP).',
      });
      return;
    }

    // Validation 2: Max file size (2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Logo image must be smaller than 2MB. Please select a compressed image.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBrandForm((prev) => ({ ...prev, logoUrl: dataUrl }));
      addToast({
        type: 'success',
        title: 'Logo Loaded',
        message: `${file.name} ready for saving.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreJson(content);
      setIsRestoreConfirmOpen(true);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (restoreDatabaseBackup(restoreJson)) {
      setIsRestoreConfirmOpen(false);
      setRestoreJson('');
    }
  };

  const handleEnablePush = async () => {
    setSubscribing(true);
    try {
      const res = await subscribeToPushNotifications();
      setPushPermission(getNotificationPermission());
      if (res.success) {
        updateNotificationPreferences({ pushNotificationsEnabled: true });
        addToast({
          type: 'success',
          title: 'Push Notifications Enabled',
          message: res.message,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Push Subscription Notice',
          message: res.message,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Subscription Error',
        message: err?.message || 'Failed to register push subscription.',
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await sendTestPushNotification(
        'Maayya Future Foods Alert',
        'Real-time push test dispatched from MSR Solutions backend.'
      );
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Test Push Sent',
          message: res.message,
        });
      } else {
        addToast({
          type: 'info',
          title: 'Push Notice',
          message: res.message,
        });
      }
    } finally {
      setTestingPush(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Settings Navigation Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'pwa', label: 'Mobile PWA & Push Notifications' },
            { id: 'brands', label: 'Brand Management' },
            { id: 'company', label: 'Company Profile & Bank' },
            { id: 'gst', label: 'GST & Invoice Series' },
            { id: 'coldchain', label: 'Inventory & Expiry Alerts' },
            { id: 'backup', label: 'Backup & Restore Engine' },
            { id: 'audit', label: 'System Audit Log' },
            { id: 'checklist', label: 'Desktop Phase Checklist' },
            { id: 'about', label: 'Software Identity & About MSR' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: Mobile PWA & Push Notifications */}
      {activeTab === 'pwa' && (
        <div className="space-y-4 max-w-4xl">
          {/* Hero Banner: PWA & Mobile Installation */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-xl p-5 text-white border border-slate-800 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/assets/maayya-app-icon.png"
                  alt="Maayya Future Foods app icon"
                  className="w-14 h-14 rounded-2xl border border-slate-700 bg-white p-1 object-contain shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-sans">
                      Progressive Web App (PWA) & Mobile Suite
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-500/30">
                      {isInstalled ? '● Installed Standalone' : 'Browser Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Install on Android phones, iPhones, iPads, and Windows desktops with offline shell caching & push alerts.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsPWAInstallModalOpen(true)}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Installation Guide</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid: App Shell Manifest & Real-Time Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* PWA Manifest Specifications */}
            <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <span>Web App Manifest Configuration</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Compliant
                </span>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">App Name:</span>
                  <span className="font-medium text-slate-900">Maayya Future Foods — Smart Business Manager</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Short Name:</span>
                  <span className="font-mono font-bold text-slate-900">Maayya Foods (12 char max)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Display Mode:</span>
                  <span className="font-mono text-slate-900">standalone (Zero browser chrome)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Theme & Background:</span>
                  <span className="font-mono text-slate-900">#090d16 (Deep Slate)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">App Icons:</span>
                  <span className="text-slate-900">192x192, 512x512, Maskable 512x512, Apple 180x180</span>
                </div>
              </div>
            </div>

            {/* Offline Engine & Network Status */}
            <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-amber-600" />
                  )}
                  <span>Network Connectivity & Offline Storage</span>
                </h4>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isOnline ? 'Online (Connected)' : 'Offline Mode'}
                </span>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Service Worker:</span>
                  <span className="font-mono font-semibold text-emerald-700">Active (sw.ts precached)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">App Shell Caching:</span>
                  <span className="text-slate-900">HTML, CSS, JS bundles & brand logos</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Local Data Storage:</span>
                  <span className="text-slate-900">LocalStorage In-Memory Sync Engine</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Offline Resilience:</span>
                  <span className="text-slate-900">Full POS & catalog browsing when offline</span>
                </div>
              </div>
            </div>
          </div>

          {/* Web Push Notifications & Permissions */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  <span>Real Web Push Notification Architecture</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Secure push delivery using VAPID keys and ServiceWorker PushManager. Secrets remain exclusively on the backend.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleEnablePush}
                  disabled={subscribing}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Bell className="w-3.5 h-3.5 text-sky-400" />
                  <span>{subscribing ? 'Subscribing...' : 'Enable Browser Push'}</span>
                </button>

                <button
                  onClick={handleSendTestPush}
                  disabled={testingPush}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded font-medium text-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingPush ? 'Sending...' : 'Send Test Push'}</span>
                </button>
              </div>
            </div>

            {/* Status indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Browser Permission
                </span>
                <span className="font-mono font-bold text-xs text-slate-900 block mt-1">
                  {pushPermission.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {pushPermission === 'granted' ? 'Allowed to receive system push' : 'Permission prompt required'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Backend VAPID Engine
                </span>
                <span className="font-mono font-bold text-xs text-emerald-700 block mt-1">
                  SECURE & CONFIGURED
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Private keys held on server; never exposed to UI
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Notification Center
                </span>
                <span className="font-mono font-bold text-xs text-slate-900 block mt-1">
                  {unreadNotificationsCount} UNREAD ALERTS
                </span>
                <button
                  onClick={() => setIsNotificationsModalOpen(true)}
                  className="text-[10px] text-sky-600 hover:text-sky-800 font-medium mt-0.5 block underline"
                >
                  Open Notification Center
                </button>
              </div>
            </div>

            {/* Operational Alert Category Preferences */}
            <div className="pt-2">
              <h5 className="font-bold text-slate-800 text-xs mb-3">
                Notification Category Subscriptions
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.overdueAlerts}
                    onChange={(e) => updateNotificationPreferences({ overdueAlerts: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Retail Shop Overdue Alerts</span>
                    <span className="text-[11px] text-slate-500">Notify when credit balance crosses 15+ days overdue threshold.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.creditLimitAlerts}
                    onChange={(e) => updateNotificationPreferences({ creditLimitAlerts: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Credit Limit Exhaustion</span>
                    <span className="text-[11px] text-slate-500">Notify when a shop balance reaches &gt;90% of sanctioned limit.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.stockExpiryAlerts}
                    onChange={(e) => updateNotificationPreferences({ stockExpiryAlerts: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Low Stock & Expiry Alerts</span>
                    <span className="text-[11px] text-slate-500">Notify when SKU stock is below reorder point or expires within 15 days.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.dailyClosingAlert}
                    onChange={(e) => updateNotificationPreferences({ dailyClosingAlert: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Daily Cash Drawer Closing Reminder</span>
                    <span className="text-[11px] text-slate-500">Evening reminder to reconcile cash register and close daily ledger.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Brand Management & Logos */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  Brand Management & Dynamic Invoice Logos
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  {brands.filter((b) => b.status === 'Active').length} Active Brands
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure partner brands (Heritage Milk, Hangyo Ice Cream, and new brands). When products of a brand are billed, their logo automatically renders on the invoice.
              </p>
            </div>
            <button
              onClick={handleOpenAddBrand}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Brand</span>
            </button>
          </div>

          {/* Dynamic Invoice Logo Logic Guide Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-lg p-4 border border-slate-800 shadow-sm text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-sky-400 font-mono uppercase tracking-wider text-[11px]">
                Dynamic Invoice Logo Logic Specifications
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Seller: {companyInfo.name}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  Case A · Heritage Only
                </span>
                <p className="text-[11px] text-slate-300">
                  When only Heritage Milk products are billed, only the <strong>Heritage logo</strong> renders at the top of the invoice.
                </p>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono text-[10px] font-bold">
                  Case B · Hangyo Only
                </span>
                <p className="text-[11px] text-slate-300">
                  When only Hangyo Ice Cream products are billed, only the <strong>Hangyo logo</strong> renders at the top.
                </p>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                  Case C · Mixed Brands
                </span>
                <p className="text-[11px] text-slate-300">
                  When items from both brands are billed, both <strong>Heritage & Hangyo logos</strong> appear side by side.
                </p>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  Case D · Future Brands
                </span>
                <p className="text-[11px] text-slate-300">
                  Add a brand & upload its logo here. Assign products to it—it automatically renders on invoices without code changes.
                </p>
              </div>
            </div>
          </div>

          {/* Brands Directory Cards & Table */}
          <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Configured Brand Directory ({brands.length})
              </span>
              <span className="text-[11px] text-slate-500">
                {companyInfo.name} Authorized Multi-Brand Portfolio
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {brands.map((brand) => {
                const linkedProductsCount = products.filter(
                  (p) => p.brand.trim().toLowerCase() === brand.name.trim().toLowerCase()
                ).length;

                return (
                  <div
                    key={brand.id}
                    className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Brand Logo & Info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Logo Preview Container */}
                      <div className="w-28 h-14 rounded border border-slate-200 bg-slate-50/80 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                        {brand.logoUrl ? (
                          <img
                            src={brand.logoUrl}
                            alt={`${brand.name} logo`}
                            className="max-h-full max-w-full object-contain"
                            style={{ objectFit: 'contain' }}
                          />
                        ) : (
                          <div className="text-center text-[10px] text-slate-400 font-mono font-medium">
                            No Logo (Text Badge)
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {brand.name}
                          </h4>
                          {brand.isInitial && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-mono font-semibold">
                              CORE BRAND
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              brand.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {brand.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Category: <span className="font-medium text-slate-700">{brand.category}</span>
                          {brand.description && ` · ${brand.description}`}
                        </p>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>Linked Products: <strong>{linkedProductsCount}</strong> items in catalog</span>
                          <span>·</span>
                          <span>Asset: {brand.logoUrl ? (brand.logoUrl.startsWith('data:') ? 'Custom Uploaded Data' : brand.logoUrl) : 'Fallback Text Badge'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => toggleBrandStatus(brand.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                          brand.status === 'Active'
                            ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title="Toggle active status for invoice header inclusion"
                      >
                        {brand.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleOpenEditBrand(brand)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded"
                        title="Edit Brand and Logo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!brand.isInitial && (
                        <button
                          onClick={() => deleteBrand(brand.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white border border-slate-200/90 rounded-lg p-5 space-y-4 max-w-3xl">
          <div className="pb-3 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registered Business & Legal Profile</h3>
              <p className="text-xs text-slate-500">Details printed on tax invoices, delivery challans, and account statements</p>
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
            >
              Save Profile
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/maayya-future-foods-logo.png"
                alt="Maayya Future Foods logo"
                className="h-10 w-auto max-w-[50px] object-contain shrink-0"
              />
              <div>
                <span className="font-bold text-slate-900 block">Client Entity: {companyInfo.name}</span>
                <span className="text-[11px] text-slate-500">
                  {companyInfo.city} (Phone: {companyInfo.phone}) · Official business name issuing GST invoices. Software engineered & maintained by MSR Solutions.
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold shrink-0">
              INVOICING ISSUER
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Legal Entity / Invoicing Issuer Name *</label>
              <input
                type="text"
                required
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Configurable company name printed on all tax invoices & bills</span>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trade / Distributor Title</label>
              <input
                type="text"
                value={companyForm.distributorTitle || companyForm.tradeName}
                onChange={(e) => setCompanyForm({ ...companyForm, distributorTitle: e.target.value, tradeName: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone / Support Contact *</label>
              <input
                type="text"
                required
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
              <input
                type="text"
                value={companyForm.city}
                onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={companyForm.gstin}
                onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">FSSAI License #</label>
              <input
                type="text"
                value={companyForm.fssai}
                onChange={(e) => setCompanyForm({ ...companyForm, fssai: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Place of Supply (State)</label>
              <input
                type="text"
                value={companyForm.stateCode}
                onChange={(e) => setCompanyForm({ ...companyForm, stateCode: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Cold Storage Facility & Warehouse Address</label>
            <textarea
              rows={2}
              value={companyForm.address}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
            />
          </div>

          <div className="pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Bank Settlement Details (Printed on Invoices)
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name & Branch</label>
                <input
                  type="text"
                  value={companyForm.bankName}
                  onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Account Number</label>
                <input
                  type="text"
                  value={companyForm.accountNumber}
                  onChange={(e) => setCompanyForm({ ...companyForm, accountNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={companyForm.ifscCode}
                  onChange={(e) => setCompanyForm({ ...companyForm, ifscCode: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate UPI VPA</label>
                <input
                  type="text"
                  value={companyForm.upiId}
                  onChange={(e) => setCompanyForm({ ...companyForm, upiId: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: GST & Invoice Series */}
      {activeTab === 'gst' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 space-y-4 max-w-2xl text-xs">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">GST Invoice Numbering & Pricing Configurations</h3>
            <p className="text-slate-500">Configure sequential voucher series and display preferences</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Retail Wholesale Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Output: INV-2026-043</span>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Direct Walk-In POS Prefix</label>
              <input
                type="text"
                value={posPrefix}
                onChange={(e) => setPosPrefix(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Output: POS-2026-090</span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxInclusiveWholesale}
                onChange={(e) => setTaxInclusiveWholesale(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="font-medium text-slate-800">
                Wholesale Price includes GST (default is Tax Exclusive + CGST/SGST add-on)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxInclusivePOS}
                onChange={(e) => setTaxInclusivePOS(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="font-medium text-slate-800">
                Direct Counter POS displays Tax-Inclusive MRP
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHsnOnInvoice}
                onChange={(e) => setShowHsnOnInvoice(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="font-medium text-slate-800">
                Print 8-Digit HSN Codes and individual CGST/SGST tax slabs on all invoice slips
              </span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 3: Inventory & Expiry Alerts */}
      {activeTab === 'coldchain' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 space-y-4 max-w-2xl text-xs">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Inventory & Batch Expiry Alert Parameters</h3>
            <p className="text-slate-500">Configure visual thresholds for shelf-life freshness and reorder reminders</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Near-Expiry Alert Lead Time (Days)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={nearExpiryDays}
                  onChange={(e) => setNearExpiryDays(Number(e.target.value))}
                  className="w-24 px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
                <span className="text-slate-600">days prior to batch expiration</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Batches with fewer than {nearExpiryDays} days remaining will display amber warning tags across billing, POS, and inventory tables.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Safety Stock Buffer Percentage (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={minStockBufferPercent}
                  onChange={(e) => setMinStockBufferPercent(Number(e.target.value))}
                  className="w-24 px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white"
                />
                <span className="text-slate-600">% above min stock level</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Calculates trigger points for automatic purchase reorder suggestions when stock falls close to minimum threshold.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 space-y-4 max-w-2xl text-xs">
          <div className="pb-3 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Database Snapshot & Local Backup Engine</h3>
              <p className="text-slate-500">Manual snapshot export, file restore, and local disaster recovery simulation</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono">
              ● Engine: In-Memory / Ready
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded bg-slate-50 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Create Local JSON Backup</span>
                <p className="text-slate-600 mb-3">
                  Export complete database state (catalog, batches, bills, ledger balances, expenses, audit log) to your local file drive.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">Last exported: {lastBackupTime}</div>
              </div>
              <button
                onClick={exportDatabaseBackup}
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Database Snapshot (.JSON)</span>
              </button>
            </div>

            <div className="p-4 border border-slate-200 rounded bg-slate-50 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Restore from Local Backup</span>
                <p className="text-slate-600 mb-3">
                  Restore previously saved Maya Future Foods snapshot file to replace current in-memory workspace.
                </p>
                <div className="text-[10px] text-slate-400">Confirmation prompted prior to replacement</div>
              </div>
              <label className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded transition-colors cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Snapshot File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Want to revert all changes back to initial prototype defaults?
              </span>
            </div>
            <button
              onClick={resetAllDemoData}
              className="px-3 py-1 font-semibold text-amber-950 bg-amber-200/80 hover:bg-amber-300 rounded"
            >
              Reset Demo Records
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: System Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                System Operations & Compliance Audit Trail
              </h3>
              <p className="text-[11px] text-slate-500">
                Immutable ledger recording invoice generations, payment receipts, stock adjustments, and reversals
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500">{auditLog.length} recorded events</span>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px] font-sans">
                  <th className="p-2 w-36">Timestamp</th>
                  <th className="p-2 w-28">Module</th>
                  <th className="p-2 w-36">Action</th>
                  <th className="p-2">Details / Voucher Particulars</th>
                  <th className="p-2 w-32">User / Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLog.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-2 text-slate-600">{log.timestamp}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-sans font-medium">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-2 font-bold font-sans text-slate-900">{log.action}</td>
                    <td className="p-2 font-sans text-slate-700">{log.details}</td>
                    <td className="p-2 text-slate-500">{log.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Desktop Phase Checklist & Screen Inventory */}
      {activeTab === 'checklist' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 space-y-5 max-w-3xl text-xs">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Maya Future Foods — Desktop Phase Migration Blueprint</span>
            </h3>
            <p className="text-slate-500">
              Module-wise validation audit confirming completion of web prototype and technical specs for desktop packaging.
            </p>
          </div>

          {/* Module checklist grid */}
          <div className="space-y-3">
            {[
              {
                module: '1. Dashboard & Executive Monitor',
                status: 'Complete & Wired',
                details: "Today's sales & purchases, gross & net profit, shop outstanding, supplier payables, cold room -18°C/-22°C status, and quick launch operations.",
              },
              {
                module: '2. Multi-Brand Product Master',
                status: 'Complete & Wired',
                details: '25 SKUs across Heritage Milk, Hangyo Ice Cream, Amul, Kwality Walls with FEFO batch assignment, HSN codes, and margins.',
              },
              {
                module: '3. Retail Shops & Credit Ageing',
                status: 'Complete & Wired',
                details: '8 retail outlets with sanctioned credit limits, overdue tracking, payment receipt modal with invoice allocations, and printable statements.',
              },
              {
                module: '4. Suppliers & Inward GRN',
                status: 'Complete & Wired',
                details: '6 dairy suppliers, draft vs post stock logic (stock increments only on post), reefer probe verification, and payable vouchers.',
              },
              {
                module: '5. Fast Direct POS & Wholesale Billing',
                status: 'Complete & Wired',
                details: 'Direct POS with tender calculator and instant receipt; Wholesale retail billing with credit check and printable GST Tax Invoice.',
              },
              {
                module: '6. Invoices Registry & Non-Destructive Reversals',
                status: 'Complete & Wired',
                details: 'Full sales history; invoice cancellation requires mandatory reason, generates reversal voucher and returns items to cold storage.',
              },
              {
                module: '7. Cold Storage Inventory & Physical Count',
                status: 'Complete & Wired',
                details: 'Freezer A (-18°C), Freezer B (-22°C), Chiller C (+4°C), inter-freezer stock transfer, wastage adjustment (melt/damage), physical count sheet.',
              },
              {
                module: '8. Operational Expenses & Daily Cash Closing',
                status: 'Complete & Wired',
                details: 'Cold storage electricity, DG set diesel, reefer van fuel, staff wages, cashbook ledger, and evening drawer reconciliation.',
              },
              {
                module: '9. Financial Reports & Tax Review',
                status: 'Complete & Wired',
                details: 'P&L Statement (Revenue -> COGS -> Gross Profit -> OpEx -> Net Profit), product margins, stock valuation, GSTR-1/3B summary, and CSV export.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded bg-slate-50/60 flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">{item.module}</div>
                  <div className="text-slate-600 mt-0.5">{item.details}</div>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-indigo-950 text-xs">
            <span className="font-bold block mb-1">Desktop Packager Note (Tauri / Electron)</span>
            <p>
              This UI prototype is architected with strict decoupling of state, pure functional components, and zero server-side coupling, ensuring 100% turnkey portability into Tauri or Electron for desktop offline compilation.
            </p>
          </div>
        </div>
      )}

      {/* TAB 7: Software Identity & About MSR Solutions */}
      {activeTab === 'about' && (
        <div className="space-y-4 max-w-4xl text-xs">
          {/* Developer Branding Banner */}
          <div className="bg-slate-900 rounded-xl p-5 text-white border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 text-center md:text-left">
              <div className="shrink-0 p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="font-bold text-sky-400 text-sm font-sans tracking-wide">MSR Solutions</span>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-5 flex-1">
                <h2 className="text-base font-bold text-white tracking-tight font-sans">
                  {companyInfo.name} — Smart Business Manager
                </h2>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  A business management application designed for billing, inventory, purchases, retail shop outstanding balances, expenses, and financial reports.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      Software Developer
                    </span>
                    <span className="font-bold text-sky-400 text-xs">
                      MSR Solutions
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      Client Company
                    </span>
                    <span className="font-bold text-slate-100 text-xs">
                      {companyInfo.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Software Identity & Deployment Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-slate-900">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Client & Software Roles</span>
              </div>
              <div className="space-y-2 text-slate-600 leading-relaxed">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="font-semibold text-slate-900 block text-xs">Client Business: {companyInfo.name}</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Issues commercial invoices, delivery challans, and holds legal registrations.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="font-semibold text-sky-800 block text-xs">Software Developer: MSR Solutions</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Engineered and maintains the smart business manager software.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-slate-900">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>Verified Deployment Architecture</span>
              </div>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Product Name:</span>
                  <span className="font-medium text-slate-900">Maayya Future Foods — Smart Business Manager</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Developer:</span>
                  <span className="font-semibold text-sky-700">MSR Solutions</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Frontend Hosting:</span>
                  <span className="font-medium text-slate-900">Vercel</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Backend Hosting:</span>
                  <span className="font-medium text-slate-900">Render</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Database:</span>
                  <span className="font-medium text-slate-900">Render PostgreSQL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>{editingBrand ? 'Edit Brand & Invoice Logo' : 'Register New Brand & Logo'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Products assigned to this brand will automatically display this logo on tax invoices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heritage Milk, Hangyo Ice Cream, Amul..."
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dairy & Fresh Milk"
                    value={brandForm.category}
                    onChange={(e) => setBrandForm({ ...brandForm, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Invoice Status
                  </label>
                  <select
                    value={brandForm.status}
                    onChange={(e) => setBrandForm({ ...brandForm, status: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:outline-hidden"
                  >
                    <option value="Active">Active (Display on Invoices)</option>
                    <option value="Inactive">Inactive (Suppressed)</option>
                  </select>
                </div>
              </div>

              {/* Brand Logo Upload & Preview Section */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Brand Logo Asset</span>
                  </span>
                  {brandForm.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setBrandForm({ ...brandForm, logoUrl: '' })}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-medium"
                    >
                      Clear Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Visual Preview */}
                  <div className="w-32 h-16 rounded border border-slate-300 bg-white p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {brandForm.logoUrl ? (
                      <img
                        src={brandForm.logoUrl}
                        alt={`${brandForm.name || 'Brand'} logo preview`}
                        className="max-h-full max-w-full object-contain"
                        style={{ objectFit: 'contain' }}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center font-mono">
                        No Logo
                        <br />
                        (Text Fallback)
                      </span>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded cursor-pointer font-medium text-slate-700 text-xs shadow-xs transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo File (PNG/WebP/SVG)</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleBrandLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Supports transparent PNG or SVG for pristine white invoice background rendering. Max 2MB.
                    </p>
                  </div>
                </div>

                {/* Optional direct asset path */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[10px] text-slate-500 mb-0.5 font-mono">
                    Or Logo Asset Path / URL:
                  </label>
                  <input
                    type="text"
                    placeholder="/assets/brands/brand-logo.png"
                    value={brandForm.logoUrl}
                    onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] border border-slate-300 rounded font-mono bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Brand Description / Dealership Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Authorized regional wholesale distribution partner..."
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-xs"
                >
                  {editingBrand ? 'Save Brand Changes' : 'Register Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      {isRestoreConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">Confirm Database Snapshot Restoration</h3>
            </div>
            <p className="text-xs text-slate-600">
              Restoring from this snapshot will replace current in-memory products, retail shop ledgers, invoices, and expenses with the uploaded data.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRestoreConfirmOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded transition-colors"
              >
                Yes, Restore Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
