import React from 'react';
import { useApp, ScreenId } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  FileText,
  Package,
  Truck,
  Warehouse,
  Store,
  CreditCard,
  DollarSign,
  BarChart3,
  Settings,
  Flame,
  HelpCircle,
  Building2,
  Tag,
} from 'lucide-react';
import { MsrLogo } from '../common/MsrLogo';

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'danger' | 'warning' | 'info';
  category?: string;
}

export const Sidebar: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    products,
    shops,
    purchases,
    setIsShortcutsOpen,
    setIsAboutModalOpen,
    companyInfo,
  } = useApp();

  // Calculate live badge alerts
  const lowStockCount = products.filter((p) => p.currentStock <= p.reorderLevel).length;
  const overdueShopsCount = shops.filter((s) => s.overdueAmount > 0).length;
  const draftPurchasesCount = purchases.filter((p) => p.status === 'Draft').length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      category: 'Overview',
    },
    {
      id: 'billing-direct',
      label: 'Direct POS Billing',
      icon: <ShoppingCart className="w-4 h-4" />,
      category: 'Sales & Billing',
    },
    {
      id: 'billing-retail',
      label: 'Retail Shop Billing',
      icon: <Receipt className="w-4 h-4" />,
      category: 'Sales & Billing',
    },
    {
      id: 'invoices',
      label: 'Sales Invoices',
      icon: <FileText className="w-4 h-4" />,
      category: 'Sales & Billing',
    },
    {
      id: 'products',
      label: 'Products Catalog',
      icon: <Package className="w-4 h-4" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeVariant: 'warning',
      category: 'Inventory',
    },
    {
      id: 'brands',
      label: 'Brands Directory',
      icon: <Tag className="w-4 h-4" />,
      category: 'Inventory',
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: <Warehouse className="w-4 h-4" />,
      category: 'Inventory',
    },
    {
      id: 'purchases',
      label: 'Purchases & Inward',
      icon: <Truck className="w-4 h-4" />,
      badge: draftPurchasesCount > 0 ? draftPurchasesCount : undefined,
      badgeVariant: 'info',
      category: 'Purchases',
    },
    {
      id: 'suppliers',
      label: 'Suppliers Directory',
      icon: <Building2 className="w-4 h-4" />,
      category: 'Purchases',
    },
    {
      id: 'shops',
      label: 'Retail Shops',
      icon: <Store className="w-4 h-4" />,
      badge: overdueShopsCount > 0 ? overdueShopsCount : undefined,
      badgeVariant: 'danger',
      category: 'Receivables & Accounts',
    },
    {
      id: 'accounts',
      label: 'Accounts & Ageing',
      icon: <CreditCard className="w-4 h-4" />,
      category: 'Receivables & Accounts',
    },
    {
      id: 'expenses',
      label: 'Expenses & Cashbook',
      icon: <DollarSign className="w-4 h-4" />,
      category: 'Finance',
    },
    {
      id: 'reports',
      label: 'Financial Reports',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'Finance',
    },
    {
      id: 'settings',
      label: 'Settings & Backup',
      icon: <Settings className="w-4 h-4" />,
      category: 'System',
    },
  ];

  return (
    <aside className="app-sidebar w-60 bg-slate-950 text-slate-300 hidden lg:flex flex-col shrink-0 border-r border-slate-800 select-none z-30">
      {/* Brand Header: Product Name + Client + Developer */}
      <div className="h-16 px-3 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950">
        <div className="flex items-center gap-2.5 min-w-0 w-full">
          <img
            src="/assets/maayya-future-foods-logo.png"
            alt="Maayya Future Foods logo"
            className="h-11 w-auto max-w-[52px] object-contain shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-white text-xs tracking-tight truncate font-sans">
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
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 text-xs">
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
                onClick={() => setCurrentScreen(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded transition-colors text-left ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-sky-400' : 'text-slate-500'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
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

      {/* Software Footer: “Developed by MSR Solutions” */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 shrink-0 text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <button
            onClick={() => setIsAboutModalOpen(true)}
            className="text-left group flex items-center gap-1.5 hover:text-white transition-colors"
            title="Click to view software developer details"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="text-[10px] text-slate-300 font-semibold group-hover:text-sky-300">
              Developed by MSR Solutions
            </span>
          </button>
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
            title="Keyboard Shortcuts"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-900">
          <span>CLIENT: {companyInfo.name.toUpperCase()}</span>
          <span>© 2026 MSR</span>
        </div>
      </div>
    </aside>
  );
};
