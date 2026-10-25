export type BrandName = string;

export interface Brand {
  id: string;
  name: string;
  logoUrl: string; // Asset path, uploaded data URL, or external URL
  category: string; // e.g. 'Ice Cream', 'Milk Products', 'Other'
  status: 'Active' | 'Inactive';
  description?: string;
  contactDetails?: string;
  createdAt?: string;
  isInitial?: boolean;
}

export interface InvoiceBrandLogo {
  brand: string;
  logoUrl: string;
}

export interface CompanyInfo {
  name: string;
  tradeName?: string;
  distributorTitle?: string;
  logoUrl?: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  phone: string;
  email: string;
  gstin?: string;
  fssai?: string;
  stateCode?: string;
  financialYear?: string;
  invoicePrefix?: string;
  posPrefix?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  whatsappReminderTemplate?: string;
}

export type ProductCategory = 
  | 'Ice Cream Cones & Cups' 
  | 'Tubs & Family Packs' 
  | 'Bulk Commercial Tubs' 
  | 'Fresh Milk & Pouches' 
  | 'Paneer, Butter & Curd';

export interface Batch {
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  costRate: number;
  location?: string;
  daysToExpiry: number;
  isExpired?: boolean;
  isNearExpiry?: boolean; // <= 15 days
}

export interface Product {
  id: string;
  code: string;
  name: string;
  brand: BrandName;
  category: ProductCategory;
  unit: 'Piece' | 'Pack' | 'Litre' | 'Kg' | 'Tub (5L)';
  hsnCode: string;
  mrp: number;
  purchaseRate: number; // cost excl. tax
  wholesaleRate: number; // shop rate
  retailRate: number; // direct POS rate
  gstRate: 5 | 12 | 18;
  currentStock: number;
  minStockAlert: number;
  reorderLevel: number;
  batches: Batch[];
  isActive: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin?: string;
  city: string;
  state?: string;
  pincode?: string;
  address: string;
  paymentTermsDays: number;
  openingBalance?: number;
  notes?: string;
  status?: 'Active' | 'Inactive';
  outstandingPayable: number;
  totalPurchases: number;
  amountPaid?: number;
  leadTimeDays: number;
}

export interface RetailShop {
  id: string;
  code: string;
  shopName: string;
  ownerName: string;
  phone: string;
  gstin?: string;
  address: string;
  routeArea: string;
  creditLimit: number;
  outstandingAmount: number;
  creditDays: number;
  overdueAmount: number;
  status: 'Active' | 'Warning' | 'Blocked';
  lastBilledDate?: string;
}

export interface InvoiceItem {
  productId: string;
  productCode: string;
  productName: string;
  brand: BrandName;
  batchNumber: string;
  expiryDate: string;
  qty: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  shopId?: string;
  shopName: string;
  shopAddress?: string;
  shopGstin?: string;
  type: 'Retail Wholesale' | 'Direct POS';
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue' | 'Cancelled';
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit';
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  notes?: string;
  brandLogos?: InvoiceBrandLogo[];
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  brand: BrandName;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  qty: number;
  unit: string;
  costRate: number;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
  zone?: string;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  billDate: string;
  receivedDate: string;
  status: 'Posted' | 'Draft' | 'Returned';
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Pending';
  remarks?: string;
}

export interface StockAdjustment {
  id: string;
  date: string;
  productId: string;
  productName: string;
  brand: BrandName;
  batchNumber: string;
  type: 'Damage / Spoilage' | 'Damaged / Soft Pack' | 'Punctured Pack' | 'Physical Audit Discrepancy' | 'Sampling / Promo';
  action: 'Deduct' | 'Add';
  qty: number;
  unit: string;
  unitCost: number;
  totalLoss: number;
  remarks: string;
  recordedBy: string;
}

export interface StockTransfer {
  id: string;
  date: string;
  productId: string;
  productName: string;
  batchNumber: string;
  qty: number;
  fromZone?: string;
  toZone?: string;
  transferredBy: string;
  notes: string;
}

export interface ExpenseItem {
  id: string;
  voucherNo: string;
  date: string;
  category: 
    | 'Cold Storage Electricity' 
    | 'Diesel Generator Fuel' 
    | 'Warehouse & Equipment Maintenance' 
    | 'Dry Ice & Gel Packs' 
    | 'Delivery Vehicle Diesel' 
    | 'Staff Salaries & Overtime' 
    | 'Packaging & Insulated Thermocol' 
    | 'Shop Rent & Warehouse Taxes' 
    | 'Miscellaneous';
  amount: number;
  paymentMode: 'Cash' | 'Bank Transfer' | 'UPI';
  paidTo: string;
  description: string;
  referenceNo?: string;
  approvedBy: string;
}

export interface ShopPayment {
  id: string;
  receiptNo: string;
  date: string;
  shopId: string;
  shopName: string;
  amount: number;
  mode: 'Cash' | 'UPI' | 'Cheque' | 'Bank Transfer';
  referenceNo?: string;
  allocatedInvoices: {
    invoiceNumber: string;
    allocatedAmount: number;
  }[];
  notes?: string;
}

export interface SupplierPayment {
  id: string;
  voucherNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  mode: 'NEFT / RTGS' | 'Cheque' | 'UPI';
  referenceNo: string;
  billNumber?: string;
  notes?: string;
}

export interface DailyCashRecord {
  date: string;
  openingCash: number;
  cashSales: number;
  cashCollectionsFromShops: number;
  cashExpenses: number;
  ownerWithdrawals: number;
  expectedCashInDrawer: number;
  physicalCountCash: number;
  variance: number;
  isClosed: boolean;
  closedBy?: string;
  closingNotes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  user: string;
  details: string;
}

export type NotificationType =
  | 'overdue'
  | 'credit_limit'
  | 'low_stock'
  | 'near_expiry'
  | 'expired_stock'
  | 'closing_reminder'
  | 'backup_status';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetScreen?: string;
  targetId?: string;
  severity: 'critical' | 'warning' | 'info';
}

