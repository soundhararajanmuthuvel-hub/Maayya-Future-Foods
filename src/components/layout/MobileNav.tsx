import React from 'react';
import { useApp, ScreenId } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { MsrLogo } from '../common/MsrLogo';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Warehouse,
  Menu,
  X,
  FileText,
  Package,
  Truck,
  Building2,
  Store,
  CreditCard,
  DollarSign,
  BarChart3,
  Settings,
  HelpCircle,
  Bell,
  Smartphone,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    setIsNotificationsModalOpen,
    setIsPWAInstallModalOpen,
    setIsAboutModalOpen,
    unreadNotificationsCount,
    products,
    shops,
    purchases,
    companyInfo,
  } = useApp();

  const lowStockCount = products.filter((p) => p.currentStock <= p.reorderLevel).length;
  const overdueShopsCount = shops.filter((s) => s.overdueAmount > 0).length;
  const draftPurchasesCount = purchases.filter((p) => p.status === 'Draft').length;

  const handleSelectScreen = (screen: ScreenId) => {
    setCurrentScreen(screen);
    setIsMobileDrawerOpen(false);
  };

  const navItems: { id: ScreenId; label: string; icon: React.ReactNode; category: string; badge?: number; badgeVariant?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, category: 'Overview' },
    { id: 'billing-direct', label: 'Direct POS Billing', icon: <ShoppingCart className="w-4 h-4" />, category: 'Sales & Billing' },
    { id: 'billing-retail', label: 'Retail Shop Billing', icon: <Receipt className="w-4 h-4" />, category: 'Sales & Billing' },
    { id: 'invoices', label: 'Sales Invoices', icon: <FileText className="w-4 h-4" />, category: 'Sales & Billing' },
    { id: 'products', label: 'Products & Brands', icon: <Package className="w-4 h-4" />, category: 'Inventory', badge: lowStockCount, badgeVariant: 'warning' },
    { id: 'inventory', label: 'Stock & Freezers', icon: <Warehouse className="w-4 h-4" />, category: 'Inventory' },
    { id: 'purchases', label: 'Purchases & Inward', icon: <Truck className="w-4 h-4" />, category: 'Purchases', badge: draftPurchasesCount, badgeVariant: 'info' },
    { id: 'suppliers', label: 'Suppliers Directory', icon: <Building2 className="w-4 h-4" />, category: 'Purchases' },
    { id: 'shops', label: 'Retail Shops', icon: <Store className="w-4 h-4" />, category: 'Receivables & Accounts', badge: overdueShopsCount, badgeVariant: 'danger' },
    { id: 'accounts', label: 'Accounts & Ageing', icon: <CreditCard className="w-4 h-4" />, category: 'Receivables & Accounts' },
    { id: 'expenses', label: 'Expenses & Cashbook', icon: <DollarSign className="w-4 h-4" />, category: 'Finance' },
    { id: 'reports', label: 'Financial Reports', icon: <BarChart3 className="w-4 h-4" />, category: 'Finance' },
    { id: 'settings', label: 'Settings & Mobile PWA', icon: <Settings className="w-4 h-4" />, category: 'System' },
  ];

  return (
    <>
      {/* 1. Mobile Bottom Navigation Bar (Fixed at bottom on phones/tablets, hidden on desktop lg:) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-slate-400 pb-[env(safe-area-inset-bottom)] select-none">
        <div className="grid grid-cols-5 h-14">
          {/* Dashboard */}
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              currentScreen === 'dashboard' ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] truncate">Dashboard</span>
          </button>

          {/* Direct POS */}
          <button
            onClick={() => setCurrentScreen('billing-direct')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              currentScreen === 'billing-direct' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-[10px] truncate">POS Bill</span>
          </button>

          {/* Wholesale Billing */}
          <button
            onClick={() => setCurrentScreen('billing-retail')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              currentScreen === 'billing-retail' ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span className="text-[10px] truncate">Wholesale</span>
          </button>

          {/* Inventory */}
          <button
            onClick={() => setCurrentScreen('inventory')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
              currentScreen === 'inventory' ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            <span className="text-[10px] truncate">Freezers</span>
            {lowStockCount > 0 && (
              <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          {/* More / All Modules Drawer */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors relative"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px] truncate">More</span>
            {(unreadNotificationsCount > 0 || overdueShopsCount > 0) && (
              <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      </nav>

      {/* 2. Mobile Drawer Navigation (Slide-in off-canvas menu) */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
          />

          {/* Drawer content */}
          <div className="relative w-80 max-w-[85vw] bg-slate-950 text-slate-300 flex flex-col h-full shadow-2xl border-r border-slate-800 z-10 animate-in slide-in-from-left duration-250">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="/assets/maayya-future-foods-logo.png"
                  alt="Maayya Future Foods logo"
                  className="h-10 w-auto max-w-[48px] object-contain shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white text-xs truncate">
                    {companyInfo.name}
                  </div>
                  <div className="text-[10px] text-sky-400 font-semibold truncate">
                    Smart Business Manager
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono truncate">
                    Developed by MSR Solutions
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar in Drawer: PWA Install & Notifications */}
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setIsNotificationsModalOpen(true);
                  setIsMobileDrawerOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Alerts ({unreadNotificationsCount})</span>
              </button>

              <button
                onClick={() => {
                  setIsPWAInstallModalOpen(true);
                  setIsMobileDrawerOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-xs font-semibold border border-sky-500/30"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Install PWA</span>
              </button>
            </div>

            {/* Nav Items List */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 text-xs">
              {navItems.map((item, idx) => {
                const isActive = currentScreen === item.id;
                const showCategoryHeader = idx === 0 || item.category !== navItems[idx - 1].category;

                return (
                  <React.Fragment key={item.id}>
                    {showCategoryHeader && item.category && (
                      <div className="pt-3 pb-1 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {item.category}
                      </div>
                    )}
                    <button
                      onClick={() => handleSelectScreen(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-slate-800 text-white font-medium shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={isActive ? 'text-sky-400' : 'text-slate-500'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded ${
                            item.badgeVariant === 'danger'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 shrink-0 text-slate-400 text-xs space-y-2">
              <button
                onClick={() => {
                  setIsAboutModalOpen(true);
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-medium text-slate-200 text-xs">Developed by MSR Solutions</span>
                </div>
                <span className="text-[10px] text-sky-400 font-mono">v1.2.4</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
