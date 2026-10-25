import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Supplier,
  RetailShop,
  Invoice,
  PurchaseBill,
  StockAdjustment,
  StockTransfer,
  ExpenseItem,
  ShopPayment,
  SupplierPayment,
  DailyCashRecord,
  AuditLogEntry,
  Brand,
  CompanyInfo,
  AppNotification,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_RETAIL_SHOPS,
  INITIAL_INVOICES,
  INITIAL_PURCHASES,
  INITIAL_STOCK_ADJUSTMENTS,
  INITIAL_EXPENSES,
  INITIAL_SHOP_PAYMENTS,
  INITIAL_SUPPLIER_PAYMENTS,
  INITIAL_DAILY_CASH,
  INITIAL_AUDIT_LOG,
  INITIAL_BRANDS,
  INITIAL_COMPANY_INFO,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../services/notificationService';
import {
  fetchWorkspaceData,
  saveProductToBackend,
  saveShopToBackend,
  saveSupplierToBackend,
  saveInvoiceToBackend,
  savePurchaseToBackend,
  saveExpenseToBackend,
  saveShopPaymentToBackend,
  saveBrandToBackend,
  deleteBrandFromBackend,
  saveCompanyInfoToBackend,
} from '../services/dataService';

export type ScreenId =
  | 'dashboard'
  | 'products'
  | 'brands'
  | 'suppliers'
  | 'shops'
  | 'purchases'
  | 'billing-retail'
  | 'billing-direct'
  | 'invoices'
  | 'inventory'
  | 'accounts'
  | 'expenses'
  | 'reports'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  // Navigation & View
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedShopId: string | null;
  setSelectedShopId: (id: string | null) => void;
  selectedSupplierId: string | null;
  setSelectedSupplierId: (id: string | null) => void;
  selectedInvoiceId: string | null;
  setSelectedInvoiceId: (id: string | null) => void;
  selectedPurchaseId: string | null;
  setSelectedPurchaseId: (id: string | null) => void;

  // Print Modal
  printableInvoice: Invoice | null;
  setPrintableInvoice: (inv: Invoice | null) => void;

  // Global Search Modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Shortcuts / Help Modal
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;

  // About Software Modal (MSR Solutions)
  isAboutModalOpen: boolean;
  setIsAboutModalOpen: (open: boolean) => void;

  // Login / Authentication Screen Modal
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;

  // Mobile Drawer Navigation Modal
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;

  // Notifications Center Modal
  isNotificationsModalOpen: boolean;
  setIsNotificationsModalOpen: (open: boolean) => void;

  // PWA Install / Guide Modal
  isPWAInstallModalOpen: boolean;
  setIsPWAInstallModalOpen: (open: boolean) => void;

  // Notifications State & Preferences
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  notificationPreferences: NotificationPreferences;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;

  // State Collections
  products: Product[];
  suppliers: Supplier[];
  shops: RetailShop[];
  invoices: Invoice[];
  purchases: PurchaseBill[];
  stockAdjustments: StockAdjustment[];
  stockTransfers: StockTransfer[];
  expenses: ExpenseItem[];
  shopPayments: ShopPayment[];
  supplierPayments: SupplierPayment[];
  dailyCash: DailyCashRecord;
  auditLog: AuditLogEntry[];
  brands: Brand[];
  companyInfo: CompanyInfo;

  // Toast
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Actions
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Invoice;
  cancelInvoice: (invoiceId: string, reason: string) => void;
  createPurchase: (purchase: Omit<PurchaseBill, 'id' | 'billNumber'>, autoPost?: boolean) => PurchaseBill;
  postPurchaseBill: (purchaseId: string) => void;
  recordShopPayment: (payment: Omit<ShopPayment, 'id' | 'receiptNo'>) => void;
  recordSupplierPayment: (payment: Omit<SupplierPayment, 'id' | 'voucherNo'>) => void;
  recordStockAdjustment: (adj: Omit<StockAdjustment, 'id'>) => void;
  recordStockTransfer: (transfer: Omit<StockTransfer, 'id'>) => void;
  recordExpense: (expense: Omit<ExpenseItem, 'id' | 'voucherNo'>) => void;
  closeDailyCash: (physicalCount: number, notes: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  addShop: (shop: Omit<RetailShop, 'id' | 'code'>) => void;
  updateShop: (shop: RetailShop) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'code'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  toggleSupplierStatus: (supplierId: string) => void;
  addBrand: (brand: Omit<Brand, 'id'>) => Brand;
  updateBrand: (brand: Brand) => void;
  deleteBrand: (brandId: string) => void;
  toggleBrandStatus: (brandId: string) => void;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => void;
  resetAllDemoData: () => void;
  exportDatabaseBackup: () => void;
  restoreDatabaseBackup: (jsonString: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [printableInvoice, setPrintableInvoice] = useState<Invoice | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState(false);

  // Notifications State with localStorage persistence
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('maayya_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  // Notification Preferences State
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('maayya_notif_prefs');
      if (saved) {
        return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_NOTIFICATION_PREFERENCES;
  });

  // Data Collections
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [shops, setShops] = useState<RetailShop[]>(INITIAL_RETAIL_SHOPS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [purchases, setPurchases] = useState<PurchaseBill[]>(INITIAL_PURCHASES);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(INITIAL_STOCK_ADJUSTMENTS);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [shopPayments, setShopPayments] = useState<ShopPayment[]>(INITIAL_SHOP_PAYMENTS);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(INITIAL_SUPPLIER_PAYMENTS);
  const [dailyCash, setDailyCash] = useState<DailyCashRecord>(INITIAL_DAILY_CASH);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Brands Management State (Heritage Milk & Hangyo Ice Cream initial)
  const [brands, setBrands] = useState<Brand[]>(() => {
    try {
      const saved = localStorage.getItem('maayya_brands');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_BRANDS;
  });

  // Client Company Profile State (Configurable in Settings)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    try {
      const saved = localStorage.getItem('maayya_company_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) return parsed;
      }
    } catch {}
    return INITIAL_COMPANY_INFO;
  });

  const [isDataLoadedFromBackend, setIsDataLoadedFromBackend] = useState(false);

  // Load authoritative workspace dataset from Render PostgreSQL
  const reloadWorkspaceFromBackend = async () => {
    try {
      const res = await fetchWorkspaceData();
      if (res.success && res.data) {
        if (Array.isArray(res.data.products)) setProducts(res.data.products);
        if (Array.isArray(res.data.suppliers)) setSuppliers(res.data.suppliers);
        if (Array.isArray(res.data.shops)) setShops(res.data.shops);
        if (Array.isArray(res.data.invoices)) setInvoices(res.data.invoices);
        if (Array.isArray(res.data.purchases)) setPurchases(res.data.purchases);
        if (Array.isArray(res.data.stockAdjustments)) setStockAdjustments(res.data.stockAdjustments);
        if (Array.isArray(res.data.expenses)) setExpenses(res.data.expenses);
        if (Array.isArray(res.data.shopPayments)) setShopPayments(res.data.shopPayments);
        if (Array.isArray(res.data.supplierPayments)) setSupplierPayments(res.data.supplierPayments);
        if (res.data.dailyCash) setDailyCash(res.data.dailyCash);
        if (Array.isArray(res.data.auditLogs) && res.data.auditLogs.length > 0) setAuditLog(res.data.auditLogs);
        if (Array.isArray(res.data.brands) && res.data.brands.length > 0) setBrands(res.data.brands);
        if (res.data.companyInfo) setCompanyInfo(res.data.companyInfo);
        setIsDataLoadedFromBackend(true);
      }
    } catch (err) {
      console.warn('Backend PostgreSQL initial sync unavailable:', err);
    }
  };

  useEffect(() => {
    reloadWorkspaceFromBackend();
  }, []);

  // Sync brands to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('maayya_brands', JSON.stringify(brands));
    } catch {}
  }, [brands]);

  // Sync companyInfo to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('maayya_company_info', JSON.stringify(companyInfo));
    } catch {}
  }, [companyInfo]);

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('maayya_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Sync notification preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('maayya_notif_prefs', JSON.stringify(notificationPreferences));
    } catch {}
  }, [notificationPreferences]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>) => {
    setNotificationPreferences((prev) => ({ ...prev, ...prefs }));
    addToast({
      type: 'success',
      title: 'Preferences Updated',
      message: 'Mobile notification preferences successfully updated.',
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast({
      type: 'info',
      title: 'Notifications Cleared',
      message: 'All notifications marked as read.',
    });
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Keyboard shortcut listener for ? or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAudit = (action: string, module: string, details: string) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      action,
      module,
      user: 'Operations Lead (Demo)',
      details,
    };
    setAuditLog((prev) => [entry, ...prev]);
  };

  // 1. Create Invoice (Retail Wholesale or Direct POS)
  const createInvoice = (invData: Omit<Invoice, 'id' | 'invoiceNumber'>): Invoice => {
    const prefix = invData.type === 'Direct POS' ? 'POS-2026-' : 'INV-2026-';
    const num = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `${prefix}${num}`;
    // Derive unique brand logos snapshot for historical preservation
    const distinctBrandNames = Array.from(
      new Set(invData.items.map((i) => i.brand).filter((b): b is string => Boolean(b && b.trim())))
    );
    const invoiceBrandLogos = distinctBrandNames.map((brandName) => {
      const match = brands.find((b) => b.name.trim().toLowerCase() === brandName.trim().toLowerCase());
      return {
        brand: brandName,
        logoUrl: match?.logoUrl || '',
      };
    });

    const newInvoice: Invoice = {
      ...invData,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      brandLogos: invoiceBrandLogos,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Deduct stock for each line item (FEFO principle)
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const item = invData.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const newStock = Math.max(0, p.currentStock - item.qty);
        // reduce batch quantity
        const updatedBatches = p.batches.map((b) => {
          if (b.batchNumber === item.batchNumber) {
            return { ...b, quantity: Math.max(0, b.quantity - item.qty) };
          }
          return b;
        });
        return {
          ...p,
          currentStock: newStock,
          batches: updatedBatches,
        };
      })
    );

    // If retail shop on credit or partial, increase outstanding
    if (invData.shopId && invData.balanceAmount > 0) {
      setShops((prevShops) =>
        prevShops.map((s) => {
          if (s.id === invData.shopId) {
            const newOutstanding = s.outstandingAmount + invData.balanceAmount;
            return {
              ...s,
              outstandingAmount: newOutstanding,
              status: newOutstanding > s.creditLimit ? 'Blocked' : newOutstanding > s.creditLimit * 0.85 ? 'Warning' : 'Active',
              lastBilledDate: invData.date,
            };
          }
          return s;
        })
      );
    }

    // If cash paid on direct sale, increase today's cash in drawer
    if (invData.paymentMode === 'Cash' && invData.paidAmount > 0) {
      setDailyCash((prev) => ({
        ...prev,
        cashSales: prev.cashSales + invData.paidAmount,
        expectedCashInDrawer: prev.expectedCashInDrawer + invData.paidAmount,
        physicalCountCash: prev.physicalCountCash + invData.paidAmount,
      }));
    }

    logAudit(
      'Invoice Created',
      invData.type === 'Direct POS' ? 'POS' : 'Billing',
      `Created ${newInvoice.invoiceNumber} for ${newInvoice.shopName} (₹${newInvoice.grandTotal.toFixed(2)})`
    );

    // Persist to PostgreSQL backend
    saveInvoiceToBackend(newInvoice).then((res) => {
      if (res.success) {
        addToast({
          type: 'success',
          title: `${newInvoice.invoiceNumber} Generated`,
          message: `Saved to Render PostgreSQL. Stock and customer balance updated.`,
        });
      } else {
        console.warn('Backend PostgreSQL invoice sync pending:', res.error);
        addToast({
          type: 'info',
          title: `${newInvoice.invoiceNumber} Generated`,
          message: `Invoice created in workspace. Stock and ledger updated.`,
        });
      }
    });

    return newInvoice;
  };

  // 2. Cancel Invoice (Audit Reversal)
  const cancelInvoice = (invoiceId: string, reason: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    // Restore stock
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const item = inv.items.find((i) => i.productId === p.id);
        if (!item) return p;
        return {
          ...p,
          currentStock: p.currentStock + item.qty,
          batches: p.batches.map((b) =>
            b.batchNumber === item.batchNumber ? { ...b, quantity: b.quantity + item.qty } : b
          ),
        };
      })
    );

    // Reverse shop outstanding if balance was unpaid
    if (inv.shopId && inv.balanceAmount > 0) {
      setShops((prevShops) =>
        prevShops.map((s) => {
          if (s.id === inv.shopId) {
            const newOutstanding = Math.max(0, s.outstandingAmount - inv.balanceAmount);
            return {
              ...s,
              outstandingAmount: newOutstanding,
              status: newOutstanding > s.creditLimit ? 'Blocked' : newOutstanding > s.creditLimit * 0.85 ? 'Warning' : 'Active',
            };
          }
          return s;
        })
      );
    }

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              paymentStatus: 'Cancelled',
              cancellationReason: reason,
              cancelledAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              cancelledBy: 'Operations Lead (Demo)',
            }
          : i
      )
    );

    logAudit(
      'Invoice Cancelled',
      'Billing',
      `Reversed ${inv.invoiceNumber} (${inv.shopName}). Reason: ${reason}. Stock returned.`
    );

    addToast({
      type: 'warning',
      title: `${inv.invoiceNumber} Cancelled & Reversed`,
      message: `Audit reversal recorded. Inventory returned to cold storage. (Demo simulation)`,
    });
  };

  // 3. Create & Post Purchase Bill
  const createPurchase = (
    purchaseData: Omit<PurchaseBill, 'id' | 'billNumber'>,
    autoPost: boolean = false
  ): PurchaseBill => {
    const billNumber = `PB-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBill: PurchaseBill = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
      billNumber,
      status: autoPost ? 'Posted' : purchaseData.status || 'Draft',
    };

    setPurchases((prev) => [newBill, ...prev]);

    if (newBill.status === 'Posted') {
      // Apply stock increase
      applyPurchaseStockIncrease(newBill);
    }

    // Increase supplier payable if unpaid
    if (newBill.balanceAmount > 0) {
      setSuppliers((prevSuppliers) =>
        prevSuppliers.map((sup) =>
          sup.id === newBill.supplierId
            ? {
                ...sup,
                outstandingPayable: sup.outstandingPayable + newBill.balanceAmount,
                totalPurchases: sup.totalPurchases + newBill.grandTotal,
              }
            : sup
        )
      );
    }

    logAudit(
      newBill.status === 'Posted' ? 'Purchase Posted' : 'Purchase Draft Saved',
      'Purchases',
      `Bill ${newBill.billNumber} from ${newBill.supplierName} (₹${newBill.grandTotal.toFixed(2)})`
    );

    // Persist to PostgreSQL backend
    savePurchaseToBackend(newBill, autoPost || newBill.status === 'Posted').then((res) => {
      if (res.success) {
        addToast({
          type: 'success',
          title: `${newBill.billNumber} Saved`,
          message: 'Committed to Render PostgreSQL with inward inventory allocation.',
        });
      } else {
        addToast({
          type: 'info',
          title: `${newBill.billNumber} Recorded`,
          message: 'Saved to workspace. Stock updated.',
        });
      }
    });

    return newBill;
  };

  const applyPurchaseStockIncrease = (bill: PurchaseBill) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const item = bill.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const newStock = p.currentStock + item.qty;
        // check if batch already exists or append
        const existingBatchIndex = p.batches.findIndex((b) => b.batchNumber === item.batchNumber);
        let newBatches = [...p.batches];
        if (existingBatchIndex >= 0) {
          newBatches[existingBatchIndex].quantity += item.qty;
        } else {
          newBatches.push({
            batchNumber: item.batchNumber,
            mfgDate: item.mfgDate,
            expiryDate: item.expiryDate,
            quantity: item.qty,
            costRate: item.costRate,
            daysToExpiry: 180,
          });
        }
        return {
          ...p,
          currentStock: newStock,
          batches: newBatches,
        };
      })
    );
  };

  const postPurchaseBill = (purchaseId: string) => {
    const bill = purchases.find((p) => p.id === purchaseId);
    if (!bill || bill.status === 'Posted') return;

    applyPurchaseStockIncrease(bill);

    setPurchases((prev) =>
      prev.map((p) => (p.id === purchaseId ? { ...p, status: 'Posted' } : p))
    );

    logAudit('Purchase Posted', 'Purchases', `Posted draft ${bill.billNumber}. Stock updated.`);
    addToast({
      type: 'success',
      title: `${bill.billNumber} Posted to Stock`,
      message: 'Items moved into cold storage inventory batches.',
    });
  };

  // 4. Record Shop Payment
  const recordShopPayment = (payData: Omit<ShopPayment, 'id' | 'receiptNo'>) => {
    const receiptNo = `RCPT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newPayment: ShopPayment = {
      ...payData,
      id: `pay-${Date.now()}`,
      receiptNo,
    };

    setShopPayments((prev) => [newPayment, ...prev]);

    // Reduce shop outstanding
    setShops((prevShops) =>
      prevShops.map((s) => {
        if (s.id === payData.shopId) {
          const newOutstanding = Math.max(0, s.outstandingAmount - payData.amount);
          return {
            ...s,
            outstandingAmount: newOutstanding,
            status: newOutstanding > s.creditLimit ? 'Blocked' : newOutstanding > s.creditLimit * 0.85 ? 'Warning' : 'Active',
          };
        }
        return s;
      })
    );

    // Update allocated invoice balances
    setInvoices((prevInvoices) =>
      prevInvoices.map((inv) => {
        const match = payData.allocatedInvoices.find((a) => a.invoiceNumber === inv.invoiceNumber);
        if (match) {
          const newPaid = inv.paidAmount + match.allocatedAmount;
          const newBalance = Math.max(0, inv.grandTotal - newPaid);
          return {
            ...inv,
            paidAmount: newPaid,
            balanceAmount: newBalance,
            paymentStatus: newBalance <= 1 ? 'Paid' : 'Partial',
          };
        }
        return inv;
      })
    );

    // If cash payment, update cashbook
    if (payData.mode === 'Cash') {
      setDailyCash((prev) => ({
        ...prev,
        cashCollectionsFromShops: prev.cashCollectionsFromShops + payData.amount,
        expectedCashInDrawer: prev.expectedCashInDrawer + payData.amount,
        physicalCountCash: prev.physicalCountCash + payData.amount,
      }));
    }

    logAudit(
      'Payment Received',
      'Accounts',
      `Received ₹${payData.amount.toFixed(2)} from ${payData.shopName} via ${payData.mode} (${receiptNo})`
    );

    saveShopPaymentToBackend(newPayment).then((res) => {
      if (res.success) {
        addToast({
          type: 'success',
          title: `Payment Receipt ${receiptNo}`,
          message: `₹${payData.amount.toLocaleString('en-IN')} credited to ${payData.shopName}. Saved to PostgreSQL.`,
        });
      } else {
        addToast({
          type: 'info',
          title: `Payment Receipt ${receiptNo}`,
          message: `₹${payData.amount.toLocaleString('en-IN')} credited to ${payData.shopName}.`,
        });
      }
    });
  };

  // 5. Record Supplier Payment
  const recordSupplierPayment = (payData: Omit<SupplierPayment, 'id' | 'voucherNo'>) => {
    const voucherNo = `SPAY-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newPayment: SupplierPayment = {
      ...payData,
      id: `spay-${Date.now()}`,
      voucherNo,
    };

    setSupplierPayments((prev) => [newPayment, ...prev]);

    setSuppliers((prevSuppliers) =>
      prevSuppliers.map((sup) => {
        if (sup.id === payData.supplierId) {
          return {
            ...sup,
            outstandingPayable: Math.max(0, sup.outstandingPayable - payData.amount),
          };
        }
        return sup;
      })
    );

    logAudit(
      'Supplier Paid',
      'Suppliers',
      `Paid ₹${payData.amount.toFixed(2)} to ${payData.supplierName} via ${payData.mode} (${voucherNo})`
    );

    addToast({
      type: 'success',
      title: `Payment Voucher ${voucherNo}`,
      message: `₹${payData.amount.toLocaleString('en-IN')} paid to ${payData.supplierName}. (Demo)`,
    });
  };

  // 6. Record Stock Adjustment
  const recordStockAdjustment = (adjData: Omit<StockAdjustment, 'id'>) => {
    const newAdj: StockAdjustment = {
      ...adjData,
      id: `adj-${Date.now()}`,
    };

    setStockAdjustments((prev) => [newAdj, ...prev]);

    // Apply stock change
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id !== adjData.productId) return p;
        const delta = adjData.action === 'Deduct' ? -adjData.qty : adjData.qty;
        const newStock = Math.max(0, p.currentStock + delta);
        const updatedBatches = p.batches.map((b) => {
          if (b.batchNumber === adjData.batchNumber) {
            return {
              ...b,
              quantity: Math.max(0, b.quantity + delta),
            };
          }
          return b;
        });
        return {
          ...p,
          currentStock: newStock,
          batches: updatedBatches,
        };
      })
    );

    logAudit(
      'Stock Adjusted',
      'Inventory',
      `${adjData.action} ${adjData.qty} ${adjData.unit} of ${adjData.productName} (${adjData.type}). Loss: ₹${adjData.totalLoss}`
    );

    addToast({
      type: 'info',
      title: 'Stock Adjustment Logged',
      message: `${adjData.action === 'Deduct' ? '-' : '+'}${adjData.qty} recorded for ${adjData.type}. (Demo)`,
    });
  };

  // 7. Record Stock Transfer
  const recordStockTransfer = (transferData: Omit<StockTransfer, 'id'>) => {
    const newTransfer: StockTransfer = {
      ...transferData,
      id: `trf-${Date.now()}`,
    };
    setStockTransfers((prev) => [newTransfer, ...prev]);

    logAudit(
      'Stock Transferred',
      'Inventory',
      `Moved ${transferData.qty} units of ${transferData.productName}`
    );

    addToast({
      type: 'success',
      title: 'Transfer Completed',
      message: `Relocated ${transferData.qty} units to ${transferData.toZone}.`,
    });
  };

  // 8. Record Expense
  const recordExpense = (expData: Omit<ExpenseItem, 'id' | 'voucherNo'>) => {
    const voucherNo = `EXP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newExp: ExpenseItem = {
      ...expData,
      id: `exp-${Date.now()}`,
      voucherNo,
    };

    setExpenses((prev) => [newExp, ...prev]);

    if (expData.paymentMode === 'Cash') {
      setDailyCash((prev) => ({
        ...prev,
        cashExpenses: prev.cashExpenses + expData.amount,
        expectedCashInDrawer: prev.expectedCashInDrawer - expData.amount,
        physicalCountCash: prev.physicalCountCash - expData.amount,
      }));
    }

    logAudit('Expense Recorded', 'Expenses', `${voucherNo}: ₹${expData.amount} for ${expData.category}`);

    saveExpenseToBackend(newExp).then((res) => {
      if (res.success) {
        addToast({
          type: 'success',
          title: `Voucher ${voucherNo} Recorded`,
          message: `₹${expData.amount.toLocaleString('en-IN')} added under ${expData.category}. Saved to PostgreSQL.`,
        });
      } else {
        addToast({
          type: 'info',
          title: `Voucher ${voucherNo} Recorded`,
          message: `₹${expData.amount.toLocaleString('en-IN')} recorded in workspace.`,
        });
      }
    });
  };

  // 9. Daily Cash Closing
  const closeDailyCash = (physicalCount: number, notes: string) => {
    const variance = physicalCount - dailyCash.expectedCashInDrawer;
    setDailyCash((prev) => ({
      ...prev,
      physicalCountCash: physicalCount,
      variance,
      isClosed: true,
      closedBy: 'Operations Lead (Demo)',
      closingNotes: notes,
    }));

    logAudit(
      'Daily Closing',
      'Expenses',
      `Day closed. Physical: ₹${physicalCount}, Expected: ₹${dailyCash.expectedCashInDrawer}, Diff: ₹${variance}`
    );

    addToast({
      type: variance === 0 ? 'success' : 'warning',
      title: 'Day Cash Closing Completed',
      message:
        variance === 0
          ? 'Physical count matched drawer register balance perfectly.'
          : `Closing locked with cash discrepancy of ₹${variance}.`,
    });
  };

  // 10. Add/Edit Product
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProd, ...prev]);
    logAudit('Product Added', 'Catalog', `Added ${newProd.code} - ${newProd.name}`);

    saveProductToBackend(newProd).then((res) => {
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Product Created',
          message: `${newProd.name} saved to Render PostgreSQL database.`,
        });
      } else {
        addToast({
          type: 'info',
          title: 'Product Created',
          message: `${newProd.name} added to catalog with base stock.`,
        });
      }
    });
  };

  const updateProduct = (prod: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));
    logAudit('Product Updated', 'Catalog', `Updated details for ${prod.code}`);

    saveProductToBackend(prod).then((res) => {
      if (res.success) {
        addToast({
          type: 'info',
          title: 'Product Updated',
          message: `${prod.name} changes committed to PostgreSQL.`,
        });
      } else {
        addToast({
          type: 'info',
          title: 'Product Updated',
          message: `${prod.name} changes saved.`,
        });
      }
    });
  };

  // 11. Add/Edit Shop
  const addShop = (shopData: Omit<RetailShop, 'id' | 'code'>) => {
    const code = `SH-${Math.floor(100 + Math.random() * 900)}`;
    const newShop: RetailShop = {
      ...shopData,
      id: `shop-${Date.now()}`,
      code,
    };
    setShops((prev) => [...prev, newShop]);
    logAudit('Shop Added', 'Shops', `Registered ${newShop.shopName}`);

    saveShopToBackend(newShop).then((res) => {
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Retail Shop Added',
          message: `${newShop.shopName} saved to PostgreSQL with credit limit ₹${newShop.creditLimit.toLocaleString('en-IN')}`,
        });
      } else {
        addToast({
          type: 'info',
          title: 'Retail Shop Added',
          message: `${newShop.shopName} added with credit limit ₹${newShop.creditLimit.toLocaleString('en-IN')}`,
        });
      }
    });
  };

  const updateShop = (shop: RetailShop) => {
    setShops((prev) => prev.map((s) => (s.id === shop.id ? shop : s)));
    saveShopToBackend(shop).then(() => {
      addToast({
        type: 'info',
        title: 'Shop Updated',
        message: `${shop.shopName} profile updated in PostgreSQL.`,
      });
    });
  };

  // 12. Add/Edit Supplier
  const addSupplier = (supData: Omit<Supplier, 'id' | 'code'>) => {
    const existing = suppliers.find(
      (s) => s.name.trim().toLowerCase() === supData.name.trim().toLowerCase()
    );
    if (existing) {
      addToast({
        type: 'warning',
        title: 'Supplier Already Exists',
        message: `A supplier named "${supData.name.trim()}" is already registered in the directory.`,
      });
      return;
    }

    const code = `SUP-${Math.floor(100 + Math.random() * 900)}`;
    const newSup: Supplier = {
      ...supData,
      name: supData.name.trim(),
      id: `sup-${Date.now()}`,
      code,
      status: supData.status || 'Active',
      outstandingPayable: supData.openingBalance ? Number(supData.openingBalance) : 0,
      totalPurchases: 0,
      amountPaid: 0,
    };
    setSuppliers((prev) => [...prev, newSup]);
    logAudit('Supplier Added', 'Suppliers', `Added ${newSup.name} (Code: ${code})`);

    saveSupplierToBackend(newSup).then((res) => {
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Supplier Added',
          message: `${newSup.name} saved to Render PostgreSQL database.`,
        });
      } else {
        addToast({
          type: 'info',
          title: 'Supplier Added',
          message: `${newSup.name} added to supply directory.`,
        });
      }
    });
  };

  const updateSupplier = (sup: Supplier) => {
    // Check duplicate name
    const duplicate = suppliers.find(
      (s) => s.id !== sup.id && s.name.trim().toLowerCase() === sup.name.trim().toLowerCase()
    );
    if (duplicate) {
      addToast({
        type: 'warning',
        title: 'Duplicate Supplier Name',
        message: `Another supplier named "${sup.name.trim()}" already exists.`,
      });
      return;
    }

    const trimmedSup = { ...sup, name: sup.name.trim() };
    setSuppliers((prev) => prev.map((s) => (s.id === sup.id ? trimmedSup : s)));
    logAudit('Supplier Updated', 'Suppliers', `Updated ${sup.name}`);

    saveSupplierToBackend(trimmedSup).then(() => {
      addToast({
        type: 'info',
        title: 'Supplier Updated',
        message: `${sup.name} profile updated in PostgreSQL.`,
      });
    });
  };

  const toggleSupplierStatus = (supplierId: string) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          const nextStatus = s.status === 'Inactive' ? 'Active' : 'Inactive';
          if (nextStatus === 'Inactive' && s.outstandingPayable > 0) {
            addToast({
              type: 'warning',
              title: 'Deactivating Supplier with Outstanding Balance',
              message: `Warning: ${s.name} has an outstanding payable of ₹${s.outstandingPayable.toLocaleString('en-IN')}.`,
            });
          }
          addToast({
            type: 'info',
            title: `Supplier ${nextStatus}`,
            message: `${s.name} marked as ${nextStatus}.`,
          });
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const deleteSupplier = (supplierId: string) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    // Check if supplier has linked purchases
    const linkedPurchases = purchases.filter((p) => p.supplierId === supplierId);
    if (linkedPurchases.length > 0) {
      addToast({
        type: 'warning',
        title: 'Cannot Delete Supplier',
        message: `Cannot delete "${sup.name}" because it has ${linkedPurchases.length} linked purchase bill(s). Deactivate instead.`,
      });
      return;
    }

    if (sup.outstandingPayable > 0) {
      addToast({
        type: 'warning',
        title: 'Cannot Delete Supplier',
        message: `Cannot delete "${sup.name}" while an outstanding balance of ₹${sup.outstandingPayable.toLocaleString('en-IN')} remains.`,
      });
      return;
    }

    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    logAudit('Supplier Deleted', 'Suppliers', `Removed supplier ${sup.name}`);
    addToast({
      type: 'info',
      title: 'Supplier Removed',
      message: `${sup.name} removed from directory.`,
    });
  };

  // Brand Management Actions
  const addBrand = (brandData: Omit<Brand, 'id'>): Brand => {
    // Prevent duplicate brand name
    const existing = brands.find(
      (b) => b.name.trim().toLowerCase() === brandData.name.trim().toLowerCase()
    );
    if (existing) {
      addToast({
        type: 'warning',
        title: 'Brand Already Exists',
        message: `A brand named "${brandData.name.trim()}" is already registered.`,
      });
      return existing;
    }

    const id = `brand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newBrand: Brand = {
      ...brandData,
      name: brandData.name.trim(),
      id,
      createdAt: brandData.createdAt || new Date().toISOString().split('T')[0],
    };
    setBrands((prev) => [...prev, newBrand]);
    logAudit('Create Brand', 'Brands', `Added new product brand "${newBrand.name}" (${newBrand.category})`);

    saveBrandToBackend(newBrand).then((res) => {
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Brand Registered',
          message: `${newBrand.name} registered in PostgreSQL and enabled for dynamic invoice branding.`,
        });
      } else {
        addToast({
          type: 'info',
          title: 'Brand Registered',
          message: `${newBrand.name} registered.`,
        });
      }
    });
    return newBrand;
  };

  const updateBrand = (updatedBrand: Brand) => {
    // Prevent duplicate name if changed
    const duplicate = brands.find(
      (b) => b.id !== updatedBrand.id && b.name.trim().toLowerCase() === updatedBrand.name.trim().toLowerCase()
    );
    if (duplicate) {
      addToast({
        type: 'warning',
        title: 'Duplicate Brand Name',
        message: `Another brand named "${updatedBrand.name.trim()}" already exists.`,
      });
      return;
    }

    const trimmed = { ...updatedBrand, name: updatedBrand.name.trim() };
    setBrands((prev) => prev.map((b) => (b.id === updatedBrand.id ? trimmed : b)));
    logAudit('Update Brand', 'Brands', `Updated profile and logo settings for "${updatedBrand.name}"`);

    saveBrandToBackend(trimmed).then(() => {
      addToast({
        type: 'info',
        title: 'Brand Updated',
        message: `Settings and logo configuration for ${updatedBrand.name} updated in PostgreSQL.`,
      });
    });
  };

  const deleteBrand = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return;

    // Check if brand is linked to existing products
    const linkedProducts = products.filter(
      (p) => p.brand.trim().toLowerCase() === brand.name.trim().toLowerCase()
    );
    if (linkedProducts.length > 0) {
      addToast({
        type: 'warning',
        title: 'Cannot Delete Brand',
        message: `Cannot delete "${brand.name}" because it is linked to ${linkedProducts.length} product(s). Deactivate it instead.`,
      });
      return;
    }

    // Check if brand is referenced in existing invoices
    const usedInInvoices = invoices.some((inv) =>
      inv.items.some((i) => i.brand.trim().toLowerCase() === brand.name.trim().toLowerCase())
    );
    if (usedInInvoices) {
      addToast({
        type: 'warning',
        title: 'Historical Audit Protection',
        message: `Cannot delete "${brand.name}" because it is referenced in past invoices. Deactivate it instead.`,
      });
      return;
    }

    if (brand.isInitial) {
      addToast({
        type: 'warning',
        title: 'Core Brand Protected',
        message: `${brand.name} is an initial core brand. Set its status to Inactive instead of deleting.`,
      });
      return;
    }
    setBrands((prev) => prev.filter((b) => b.id !== brandId));
    logAudit('Delete Brand', 'Brands', `Removed brand "${brand.name}"`);

    deleteBrandFromBackend(brandId).then(() => {
      addToast({
        type: 'info',
        title: 'Brand Removed',
        message: `${brand.name} removed from PostgreSQL brand directory.`,
      });
    });
  };

  const toggleBrandStatus = (brandId: string) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b.id === brandId) {
          const nextStatus: 'Active' | 'Inactive' = b.status === 'Active' ? 'Inactive' : 'Active';
          const updated: Brand = { ...b, status: nextStatus };
          saveBrandToBackend(updated);
          addToast({
            type: 'info',
            title: `Brand ${nextStatus}`,
            message: `${b.name} is now ${nextStatus.toLowerCase()} for invoice branding.`,
          });
          return updated;
        }
        return b;
      })
    );
  };

  const updateCompanyInfo = (info: Partial<CompanyInfo>) => {
    const updated = { ...companyInfo, ...info };
    setCompanyInfo(updated);
    logAudit('Update Company Profile', 'Settings', `Updated legal company info: ${updated.name}`);

    saveCompanyInfoToBackend(updated).then(() => {
      addToast({
        type: 'success',
        title: 'Company Profile Updated',
        message: 'Business credentials updated in PostgreSQL across application and invoices.',
      });
    });
  };

  // 13. Backup & Reset
  const resetAllDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setShops(INITIAL_RETAIL_SHOPS);
    setInvoices(INITIAL_INVOICES);
    setPurchases(INITIAL_PURCHASES);
    setStockAdjustments(INITIAL_STOCK_ADJUSTMENTS);
    setExpenses(INITIAL_EXPENSES);
    setShopPayments(INITIAL_SHOP_PAYMENTS);
    setSupplierPayments(INITIAL_SUPPLIER_PAYMENTS);
    setDailyCash(INITIAL_DAILY_CASH);
    setAuditLog(INITIAL_AUDIT_LOG);
    setBrands(INITIAL_BRANDS);
    setCompanyInfo(INITIAL_COMPANY_INFO);
    try {
      localStorage.removeItem('maayya_brands');
      localStorage.removeItem('maayya_company_info');
    } catch {}
    addToast({
      type: 'info',
      title: 'Reset Completed',
      message: 'All records and transaction data have been reset to a clean baseline.',
    });
  };

  const exportDatabaseBackup = () => {
    const backupData = {
      app: 'Maayya Future Foods - Smart Business Manager',
      timestamp: new Date().toISOString(),
      companyInfo,
      brands,
      products,
      suppliers,
      shops,
      invoices,
      purchases,
      stockAdjustments,
      expenses,
      shopPayments,
      supplierPayments,
      dailyCash,
      auditLog,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maayya_future_foods_backup_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Backup Archive Generated',
      message: 'Local JSON snapshot downloaded to browser files.',
    });
  };

  const restoreDatabaseBackup = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.companyInfo) setCompanyInfo(parsed.companyInfo);
      if (parsed.brands) setBrands(parsed.brands);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.shops) setShops(parsed.shops);
      if (parsed.invoices) setInvoices(parsed.invoices);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.stockAdjustments) setStockAdjustments(parsed.stockAdjustments);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.shopPayments) setShopPayments(parsed.shopPayments);
      if (parsed.supplierPayments) setSupplierPayments(parsed.supplierPayments);
      if (parsed.dailyCash) setDailyCash(parsed.dailyCash);
      if (parsed.auditLog) setAuditLog(parsed.auditLog);

      addToast({
        type: 'success',
        title: 'Database Restored',
        message: 'Data successfully restored from uploaded JSON snapshot.',
      });
      return true;
    } catch {
      addToast({
        type: 'error',
        title: 'Restore Failed',
        message: 'Invalid JSON file format. Please check file integrity.',
      });
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        selectedProductId,
        setSelectedProductId,
        selectedShopId,
        setSelectedShopId,
        selectedSupplierId,
        setSelectedSupplierId,
        selectedInvoiceId,
        setSelectedInvoiceId,
        selectedPurchaseId,
        setSelectedPurchaseId,
        printableInvoice,
        setPrintableInvoice,
        isSearchOpen,
        setIsSearchOpen,
        isShortcutsOpen,
        setIsShortcutsOpen,
        isAboutModalOpen,
        setIsAboutModalOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        isNotificationsModalOpen,
        setIsNotificationsModalOpen,
        isPWAInstallModalOpen,
        setIsPWAInstallModalOpen,
        notifications,
        unreadNotificationsCount,
        notificationPreferences,
        updateNotificationPreferences,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotification,
        addNotification,
        products,
        suppliers,
        shops,
        invoices,
        purchases,
        stockAdjustments,
        stockTransfers,
        expenses,
        shopPayments,
        supplierPayments,
        dailyCash,
        auditLog,
        brands,
        companyInfo,
        toasts,
        addToast,
        dismissToast,
        createInvoice,
        cancelInvoice,
        createPurchase,
        postPurchaseBill,
        recordShopPayment,
        recordSupplierPayment,
        recordStockAdjustment,
        recordStockTransfer,
        recordExpense,
        closeDailyCash,
        addProduct,
        updateProduct,
        addShop,
        updateShop,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        toggleSupplierStatus,
        addBrand,
        updateBrand,
        deleteBrand,
        toggleBrandStatus,
        updateCompanyInfo,
        resetAllDemoData,
        exportDatabaseBackup,
        restoreDatabaseBackup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
