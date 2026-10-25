import {
  Product,
  Supplier,
  RetailShop,
  Invoice,
  PurchaseBill,
  StockAdjustment,
  ExpenseItem,
  DailyCashRecord,
  AuditLogEntry,
  ShopPayment,
  SupplierPayment,
  Brand,
  CompanyInfo,
  AppNotification,
} from '../types';

/**
 * Initial Brands Configured for Maayya Future Foods
 * Partner brand logos for invoice generation
 */
export const INITIAL_BRANDS: Brand[] = [
  {
    id: 'brand-heritage',
    name: 'Heritage Milk',
    logoUrl: '/assets/brands/heritage-milk-logo.png',
    category: 'Dairy & Fresh Milk',
    status: 'Active',
    description: 'Heritage Foods - Pasteurized Toned Milk, Fresh Curd, Malai Paneer & Cow Ghee',
    isInitial: true,
  },
  {
    id: 'brand-hangyo',
    name: 'Hangyo Ice Cream',
    logoUrl: '/assets/brands/hangyo-ice-cream-logo.png',
    category: 'Ice Cream & Desserts',
    status: 'Active',
    description: 'Hangyo Ice Cream - Cones, Luxury Tubs, Kulfi & Sticks',
    isInitial: true,
  },
];

/**
 * Default Company / Issuer Profile
 */
export const INITIAL_COMPANY_INFO: CompanyInfo = {
  name: 'Maayya Future Foods',
  tradeName: 'Maayya Future Foods',
  distributorTitle: 'Cold-Chain Wholesale & Retail Distributor',
  gstin: '',
  fssai: '',
  phone: '',
  email: '',
  city: 'Kumbakonam',
  address: '',
  stateCode: '33 (Tamil Nadu)',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
};

/**
 * Empty production-ready datasets (clean slate without fake/demo records)
 */
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_RETAIL_SHOPS: RetailShop[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_PURCHASES: PurchaseBill[] = [];
export const INITIAL_STOCK_ADJUSTMENTS: StockAdjustment[] = [];
export const INITIAL_EXPENSES: ExpenseItem[] = [];
export const INITIAL_SHOP_PAYMENTS: ShopPayment[] = [];
export const INITIAL_SUPPLIER_PAYMENTS: SupplierPayment[] = [];

export const INITIAL_DAILY_CASH: DailyCashRecord = {
  date: new Date().toISOString().split('T')[0],
  openingCash: 0,
  cashSales: 0,
  cashCollectionsFromShops: 0,
  cashExpenses: 0,
  ownerWithdrawals: 0,
  expectedCashInDrawer: 0,
  physicalCountCash: 0,
  variance: 0,
  isClosed: false,
};

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'audit-init-01',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    action: 'Workspace Initialized',
    module: 'System',
    user: 'System',
    details: 'Maayya Future Foods Smart Business Manager initialized.',
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
