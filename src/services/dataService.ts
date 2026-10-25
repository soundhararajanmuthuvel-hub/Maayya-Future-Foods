import { buildApiUrl } from './apiClient';
import {
  Product,
  Supplier,
  RetailShop,
  Invoice,
  PurchaseBill,
  StockAdjustment,
  ExpenseItem,
  ShopPayment,
  SupplierPayment,
  DailyCashRecord,
  AuditLogEntry,
  Brand,
  CompanyInfo,
  AppNotification,
} from '../types';

export interface WorkspaceBootstrapData {
  products: Product[];
  suppliers: Supplier[];
  shops: RetailShop[];
  invoices: Invoice[];
  purchases: PurchaseBill[];
  stockAdjustments: StockAdjustment[];
  expenses: ExpenseItem[];
  shopPayments: ShopPayment[];
  supplierPayments: SupplierPayment[];
  dailyCash: DailyCashRecord | null;
  auditLogs: AuditLogEntry[];
  notifications: AppNotification[];
  brands: Brand[];
  companyInfo: CompanyInfo | null;
}

/**
 * Loads the complete workspace dataset from Render PostgreSQL via /api/workspace/bootstrap
 */
export async function fetchWorkspaceData(): Promise<{ success: boolean; data?: WorkspaceBootstrapData; error?: string }> {
  const url = buildApiUrl('/api/workspace/bootstrap');
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      let errMsg = `Server returned HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errMsg = errJson.error;
      } catch (_) {}
      return { success: false, error: errMsg };
    }

    const json = await res.json();
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to connect to backend server.' };
  }
}

/**
 * Saves or updates a Product in PostgreSQL
 */
export async function saveProductToBackend(product: Product): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl('/api/products');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error saving product.' };
  }
}

/**
 * Saves or updates a Retail Shop in PostgreSQL
 */
export async function saveShopToBackend(shop: RetailShop): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl('/api/shops');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shop),
    });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error saving customer shop.' };
  }
}

/**
 * Saves or updates a Supplier in PostgreSQL
 */
export async function saveSupplierToBackend(supplier: Supplier): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl('/api/suppliers');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier),
    });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error saving supplier.' };
  }
}

/**
 * Persists an Invoice with atomic stock deduction and ledger allocation in PostgreSQL
 */
export async function saveInvoiceToBackend(invoice: Invoice): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl('/api/invoices');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error saving invoice.' };
  }
}

/**
 * Persists a Purchase Bill with inward stock batch allocations in PostgreSQL
 */
export async function savePurchaseToBackend(purchase: PurchaseBill, autoPost = true): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl(`/api/purchases?autoPost=${autoPost ? 'true' : 'false'}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchase),
    });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error saving purchase bill.' };
  }
}

/**
 * Persists an Expense in PostgreSQL
 */
export async function saveExpenseToBackend(expense: ExpenseItem): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl('/api/expenses');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error saving expense.' };
  }
}

/**
 * Persists a Customer Payment in PostgreSQL
 */
export async function saveShopPaymentToBackend(payment: ShopPayment): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl('/api/payments/shop');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error saving customer payment.' };
  }
}

/**
 * Persists a Brand in PostgreSQL
 */
export async function saveBrandToBackend(brand: Brand): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl('/api/brands');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brand),
    });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error saving brand.' };
  }
}

/**
 * Deletes a Brand from PostgreSQL
 */
export async function deleteBrandFromBackend(id: string): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl(`/api/brands/${id}`);
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error deleting brand.' };
  }
}

/**
 * Persists Company Profile Info in PostgreSQL
 */
export async function saveCompanyInfoToBackend(info: CompanyInfo): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl('/api/company');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error saving company info.' };
  }
}

/**
 * Deletes or archives a product in PostgreSQL
 */
export async function deleteProductFromBackend(id: string): Promise<{ success: boolean; error?: string; archived?: boolean; message?: string }> {
  const url = buildApiUrl(`/api/products/${id}`);
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error, archived: json.archived, message: json.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error deleting product.' };
  }
}

/**
 * Deletes or deactivates a retail shop in PostgreSQL
 */
export async function deleteShopFromBackend(id: string): Promise<{ success: boolean; error?: string; archived?: boolean; message?: string }> {
  const url = buildApiUrl(`/api/shops/${id}`);
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error, archived: json.archived, message: json.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error deleting shop.' };
  }
}

/**
 * Deletes or deactivates a supplier in PostgreSQL
 */
export async function deleteSupplierFromBackend(id: string): Promise<{ success: boolean; error?: string; archived?: boolean; message?: string }> {
  const url = buildApiUrl(`/api/suppliers/${id}`);
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error, archived: json.archived, message: json.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error deleting supplier.' };
  }
}

/**
 * Deletes an expense voucher from PostgreSQL
 */
export async function deleteExpenseFromBackend(id: string): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl(`/api/expenses/${id}`);
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error deleting expense.' };
  }
}

/**
 * Deletes a notification from PostgreSQL
 */
export async function deleteNotificationFromBackend(id: string): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl(`/api/notifications/${id}`);
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error deleting notification.' };
  }
}

/**
 * Cancels / Voids an invoice on PostgreSQL with stock and ledger reversals
 */
export async function cancelInvoiceOnBackend(id: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const url = buildApiUrl(`/api/invoices/${id}/cancel`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    return { success: res.ok && json.success, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error cancelling invoice.' };
  }
}

/**
 * Bulk deletes products safely from backend
 */
export async function bulkDeleteProductsFromBackend(ids: string[]): Promise<{ success: boolean; deletedCount?: number; skippedCount?: number; skipped?: string[]; error?: string }> {
  const url = buildApiUrl('/api/products/batch-delete');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const json = await res.json();
    return { success: res.ok && json.success, deletedCount: json.deletedCount, skippedCount: json.skippedCount, skipped: json.skipped, error: json.error };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error bulk deleting products.' };
  }
}
