import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/formatters';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  Search,
  Bell,
  Plus,
  ShoppingCart,
  Receipt,
  Truck,
  CreditCard,
  AlertTriangle,
  Clock,
  User,
  ChevronDown,
  Info,
  Lock,
  Menu,
  WifiOff,
  RotateCw,
  Database,
} from 'lucide-react';
import { MsrLogo } from '../common/MsrLogo';

export const TopBar: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    setIsSearchOpen,
    setIsAboutModalOpen,
    setIsLoginModalOpen,
    setIsMobileDrawerOpen,
    setIsNotificationsModalOpen,
    unreadNotificationsCount,
    products,
    dailyCash,
    companyInfo,
    isDataLoadedFromBackend,
    reloadWorkspaceFromBackend,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = useOnlineStatus();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Critical alerts: Near-expiry products and low stock items
  const nearExpiryBatches = products.flatMap((p) =>
    p.batches
      .filter((b) => b.isNearExpiry || b.isExpired)
      .map((b) => ({
        productName: p.name,
        batchNumber: b.batchNumber,
        daysToExpiry: b.daysToExpiry,
        isExpired: b.isExpired,
        quantity: b.quantity,
      }))
  );

  const lowStockItems = products.filter((p) => p.currentStock <= p.reorderLevel);
  const totalAlertsCount = nearExpiryBatches.length + lowStockItems.length;

  const screenTitles: Record<string, string> = {
    dashboard: 'Business Overview & Executive Dashboard',
    'billing-direct': 'Fast Direct Walk-In POS Billing',
    'billing-retail': 'Retail Shop Wholesale Billing',
    invoices: 'Sales Invoices & Reversals Registry',
    products: 'Products & Multi-Brand Master Catalog',
    inventory: 'Inventory & Batch Stock Management',
    purchases: 'Inward Purchases & Goods Receipt Notes (GRN)',
    suppliers: 'Suppliers Directory & Ledger Payables',
    shops: 'Retail Shops Directory & Receivables',
    accounts: 'Outstanding Accounts & Credit Ageing Analysis',
    expenses: 'Operational Expenses & Cashbook',
    reports: 'P&L, Margins & GST Tax Reporting',
    settings: 'Company Profile, Backup & Desktop Migration',
  };

  return (
    <header className="app-topbar h-14 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-20">
      {/* Left Branding: Hamburger on mobile + Logo + Product & Developer */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <img
          src="/assets/maayya-future-foods-logo.png"
          alt="Maayya Future Foods logo"
          className="h-8 sm:h-9 w-auto max-w-[40px] sm:max-w-[48px] object-contain shrink-0"
        />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-bold text-slate-900 truncate">
              {companyInfo.name}
            </span>
            <span className="hidden sm:inline text-xs font-semibold text-slate-500 truncate">
              — Smart Business Manager
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-slate-500 font-medium truncate">
              {screenTitles[currentScreen] || 'Business Manager'}
            </span>
            {!isOnline && (
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-mono font-bold flex items-center gap-1">
                <WifiOff className="w-2.5 h-2.5" />
                Offline
              </span>
            )}
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 hidden md:block" />

        <button
          onClick={() => setIsAboutModalOpen(true)}
          className="hidden md:flex items-center text-left hover:opacity-85 transition-opacity p-0.5 rounded focus:outline-hidden shrink-0"
          title="Software Architecture by MSR Solutions — Click to view About details"
        >
          <MsrLogo variant="compact" />
        </button>
      </div>

      {/* Center / Search, PWA & Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* PWA Install Button */}
        <PWAInstallButton variant="subtle" className="hidden sm:flex" />

        {/* Global Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs text-slate-500 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 rounded transition-colors"
          title="Search anything (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search records...</span>
          <kbd className="hidden lg:inline text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Global Cloud Database Sync Button */}
        <button
          onClick={async () => {
            setIsSyncing(true);
            try {
              await reloadWorkspaceFromBackend();
            } finally {
              setIsSyncing(false);
            }
          }}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded transition-colors shadow-xs"
          title="Sync with Render PostgreSQL database (Mobile & Laptop live sync)"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
          <span className="hidden md:inline font-mono text-[11px]">
            {isSyncing ? 'Syncing...' : 'Render Live'}
          </span>
        </button>

        {/* Quick Action Buttons */}
        <div className="hidden xl:flex items-center gap-1.5 border-l border-slate-200 pl-2">
          <button
            onClick={() => setCurrentScreen('billing-direct')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Direct POS</span>
          </button>
          <button
            onClick={() => setCurrentScreen('billing-retail')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Retail Bill</span>
          </button>
          <button
            onClick={() => setCurrentScreen('purchases')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-sky-800 bg-sky-50 border border-sky-200 rounded hover:bg-sky-100 transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Inward GRN</span>
          </button>
        </div>
      </div>

      {/* Right Controls: Cash in Drawer, Alerts, User */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Cash in Drawer Quick Stat */}
        <div
          onClick={() => setCurrentScreen('expenses')}
          className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded hover:border-slate-300 transition-colors"
          title="Click to view Cashbook & Daily Closing"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Drawer:</span>
          <span className="font-mono font-bold text-xs text-slate-900 tabular-nums">
            {formatINR(dailyCash.physicalCountCash)}
          </span>
        </div>

        {/* Alerts Notification Bell */}
        <button
          onClick={() => setIsNotificationsModalOpen(true)}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="View notifications and alerts"
          title="Mobile Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* About Software Button */}
        <button
          onClick={() => setIsAboutModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors"
          title="About MSR Solutions Software & System Details"
        >
          <Info className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden md:inline">About</span>
        </button>

        {/* Owner Profile & Terminal Security Lock Trigger */}
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-90 transition-opacity text-left"
          title="Owner Security Lock & Workspace Status"
        >
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-800">
            K
          </div>
          <div className="hidden lg:block text-left text-xs leading-none">
            <div className="font-semibold text-slate-900 flex items-center gap-1">
              <span>Kalai</span>
              <Lock className="w-2.5 h-2.5 text-slate-400" />
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Owner · {companyInfo.name}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
