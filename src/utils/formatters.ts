/**
 * Utility functions for Maya Future Foods accounting & inventory formatting
 */

export function formatINR(val: number, includeDecimals: boolean = false): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const isNegative = val < 0;
  const absVal = Math.abs(val);

  const parts = absVal.toFixed(includeDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : '';

  // Indian Rupee numbering format (last 3, then groups of 2)
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹${formattedInteger}${decimalPart}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function calculateDaysRemaining(expiryDateStr: string): number {
  if (!expiryDateStr) return 999;
  const today = new Date('2026-10-23'); // Fixed current simulation baseline
  const expiry = new Date(expiryDateStr);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(expiryDateStr: string): {
  status: 'Fresh' | 'Near Expiry' | 'Expired';
  days: number;
  badgeClass: string;
} {
  const days = calculateDaysRemaining(expiryDateStr);
  if (days < 0) {
    return {
      status: 'Expired',
      days,
      badgeClass: 'text-rose-700 bg-rose-50 border border-rose-200',
    };
  }
  if (days <= 15) {
    return {
      status: 'Near Expiry',
      days,
      badgeClass: 'text-amber-800 bg-amber-50 border border-amber-200',
    };
  }
  return {
    status: 'Fresh',
    days,
    badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  };
}

export function getStockStatus(current: number, reorder: number): {
  label: 'In Stock' | 'Low Stock' | 'Out of Stock';
  badgeClass: string;
} {
  if (current <= 0) {
    return {
      label: 'Out of Stock',
      badgeClass: 'text-rose-700 bg-rose-50 border border-rose-200',
    };
  }
  if (current <= reorder) {
    return {
      label: 'Low Stock',
      badgeClass: 'text-amber-800 bg-amber-50 border border-amber-200',
    };
  }
  return {
    label: 'In Stock',
    badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  };
}
