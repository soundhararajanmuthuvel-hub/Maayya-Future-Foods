/**
 * Maayya Future Foods — Smart Business Manager
 * Developed and maintained by MSR Solutions
 * © 2026 MSR Solutions. All rights reserved.
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { PinLockScreen } from './components/common/PinLockScreen';
import { InvoicePrintModal } from './components/common/InvoicePrintModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { AboutModal } from './components/common/AboutModal';
import { LoginModal } from './components/common/LoginModal';
import { ToastContainer } from './components/common/ToastContainer';
import { MobileNav } from './components/layout/MobileNav';
import { PWAInstallModal } from './components/common/PWAInstallModal';
import { NotificationCenterModal } from './components/common/NotificationCenterModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';

// Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { ProductsScreen } from './screens/ProductsScreen';
import { BrandsScreen } from './screens/BrandsScreen';
import { SuppliersScreen } from './screens/SuppliersScreen';
import { ShopsScreen } from './screens/ShopsScreen';
import { PurchasesScreen } from './screens/PurchasesScreen';
import { BillingRetailScreen } from './screens/BillingRetailScreen';
import { BillingDirectScreen } from './screens/BillingDirectScreen';
import { InvoicesScreen } from './screens/InvoicesScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { AccountsScreen } from './screens/AccountsScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const MainLayout: React.FC = () => {
  // In-memory state: always resets to false on every browser refresh or new tab load
  // Never stored in localStorage, sessionStorage, cookies, or IndexedDB
  const [isUnlocked, setIsUnlocked] = useState(false);

  const {
    currentScreen,
    printableInvoice,
    setPrintableInvoice,
    isAboutModalOpen,
    setIsAboutModalOpen,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isNotificationsModalOpen,
    setIsNotificationsModalOpen,
    isPWAInstallModalOpen,
    setIsPWAInstallModalOpen,
    companyInfo,
  } = useApp();

  // If not unlocked, render ONLY the full-screen PIN lock screen
  // Zero business data, invoices, dashboard, or customer records are rendered
  if (!isUnlocked) {
    return (
      <>
        <PinLockScreen onUnlock={() => setIsUnlocked(true)} />
        <ToastContainer />
      </>
    );
  }

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'billing-direct':
        return <BillingDirectScreen />;
      case 'billing-retail':
        return <BillingRetailScreen />;
      case 'invoices':
        return <InvoicesScreen />;
      case 'products':
        return <ProductsScreen />;
      case 'brands':
        return <BrandsScreen />;
      case 'purchases':
        return <PurchasesScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'shops':
        return <ShopsScreen />;
      case 'suppliers':
        return <SuppliersScreen />;
      case 'accounts':
        return <AccountsScreen />;
      case 'expenses':
        return <ExpensesScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 font-sans flex flex-col antialiased selection:bg-slate-800 selection:text-white">
      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Navy Sidebar */}
        <Sidebar />

        {/* Content Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />

          {/* Main Scrollable Viewport with bottom padding for mobile navigation */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 lg:pb-6 bg-slate-100/70">
            <div className="max-w-[1600px] mx-auto">
              {renderActiveScreen()}
            </div>
          </main>

          {/* Software Footer: “Developed by MSR Solutions” */}
          <footer className="h-7 bg-white border-t border-slate-200 px-4 hidden lg:flex items-center justify-between text-[11px] text-slate-500 shrink-0 select-none print:hidden">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Developed by MSR Solutions
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-medium">© 2026 MSR Solutions</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 truncate">
                Product: <strong className="text-slate-800 font-medium">{companyInfo.name} — Smart Business Manager</strong>
              </span>
              <span className="text-slate-300 hidden md:inline">|</span>
              <span className="text-slate-500 hidden md:inline">
                Client: <span className="font-medium text-slate-700">{companyInfo.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="hidden sm:inline text-emerald-700 font-medium">● System: Operational</span>
              <button
                onClick={() => setIsAboutModalOpen(true)}
                className="text-sky-600 hover:text-sky-800 font-sans font-medium transition-colors cursor-pointer"
              >
                About Software
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Navigation & Slide-out Drawer */}
      <MobileNav />

      {/* Connectivity Indicator */}
      <OfflineIndicator />

      {/* Global Interactive Modals */}
      <InvoicePrintModal
        invoice={printableInvoice}
        onClose={() => setPrintableInvoice(null)}
      />
      <GlobalSearchModal />
      <KeyboardShortcutsModal />
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <NotificationCenterModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />
      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
      />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
