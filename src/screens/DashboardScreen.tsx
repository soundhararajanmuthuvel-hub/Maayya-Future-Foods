import React from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate, getExpiryStatus } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  TrendingUp,
  TrendingDown,
  Warehouse,
  AlertCircle,
  Truck,
  Store,
  DollarSign,
  ShoppingCart,
  Receipt,
  ShieldCheck,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const {
    products,
    shops,
    suppliers,
    invoices,
    purchases,
    expenses,
    dailyCash,
    setCurrentScreen,
    setSelectedInvoiceId,
    setPrintableInvoice,
    companyInfo,
  } = useApp();

  // Current Date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  // Metrics Calculations
  // Total Inventory Valuation (cost basis)
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.currentStock || 0) * (p.purchaseRate || 0), 0);

  // Today's Sales
  const todayInvoices = invoices.filter((i) => i.date === todayStr && i.paymentStatus !== 'Cancelled');
  const todaySalesTotal = todayInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  // Today's Purchases
  const todayPurchases = purchases.filter((p) => p.billDate === todayStr && p.status === 'Posted');
  const todayPurchasesTotal = todayPurchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0);

  // Total Shop Receivables & Overdue
  const totalShopOutstanding = shops.reduce((sum, s) => sum + (s.outstandingAmount || 0), 0);
  const totalShopOverdue = shops.reduce((sum, s) => sum + (s.overdueAmount || 0), 0);

  // Total Supplier Payables
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + (s.outstandingPayable || 0), 0);

  // Today's Expenses
  const todayExpensesTotal = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Estimated Gross Margin (Sales - Cost) on today's sales
  const todayCOGS = todayInvoices.reduce((sum, inv) => {
    return (
      sum +
      inv.items.reduce((itemSum, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cost = prod ? prod.purchaseRate : item.unitPrice * 0.7;
        return itemSum + cost * item.qty;
      }, 0)
    );
  }, 0);

  const todayGrossProfit = Math.max(0, todaySalesTotal - todayCOGS);
  const todayNetProfit = todayGrossProfit - todayExpensesTotal;

  // Alerts
  const nearExpiryBatches = products.flatMap((p) =>
    p.batches
      .filter((b) => b.isNearExpiry || b.isExpired)
      .map((b) => ({
        productId: p.id,
        name: p.name,
        brand: p.brand,
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate,
        quantity: b.quantity,
        isExpired: b.isExpired,
        daysToExpiry: b.daysToExpiry,
      }))
  );

  const lowStockProducts = products.filter((p) => p.currentStock <= p.reorderLevel);

  // Greeting logic for Owner Kalai based on current local time
  const currentHour = new Date().getHours();
  const greetingText =
    currentHour < 12
      ? 'Good morning, Kalai'
      : currentHour < 17
      ? 'Good afternoon, Kalai'
      : 'Good evening, Kalai';

  const formattedCurrentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Personalized Owner Greeting Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-xl p-4 sm:p-5 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white">
              {greetingText}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-500/30">
              Owner · Maayya Future Foods
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
            <span>{formattedCurrentDate}</span>
            <span>•</span>
            <span className="text-slate-200 font-medium">
              Today's Overview: {formatINR(todaySalesTotal)} sales billed ({todayInvoices.length} orders) · {shops.length} active retail shops
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setCurrentScreen('billing-direct')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition-colors shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Fast Direct POS</span>
          </button>
          <button
            onClick={() => setCurrentScreen('billing-retail')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg font-medium text-xs transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-sky-400" />
            <span>Retail Dispatch</span>
          </button>
        </div>
      </div>

      {/* Dashboard Brand Header */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src="/assets/maayya-future-foods-logo.png"
            alt="Maayya Future Foods logo"
            className="h-10 w-auto max-w-[64px] object-contain shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-950 font-serif tracking-tight">
                {companyInfo.name}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold">
                {companyInfo.city} Central Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Smart Business Manager · Desktop Sales, Inventory & Receivables Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="text-right hidden md:block">
            <span className="text-[10px] text-slate-400 font-mono block">DEVELOPED BY</span>
            <span className="text-xs font-semibold text-sky-700">MSR Solutions</span>
          </div>
        </div>
      </div>

      {/* Top Banner KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard
          label="Today's Sales"
          value={formatINR(todaySalesTotal)}
          subValue={`${todayInvoices.length} orders billed`}
          trend={{ text: '+14% vs avg', type: 'positive' }}
          icon={<ShoppingCart className="w-4 h-4 text-emerald-600" />}
          onClick={() => setCurrentScreen('invoices')}
        />
        <StatCard
          label="Est. Gross Profit"
          value={formatINR(todayGrossProfit)}
          subValue={`Net: ${formatINR(todayNetProfit)}`}
          trend={{ text: '26.8% margin', type: 'positive' }}
          icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
          onClick={() => setCurrentScreen('reports')}
        />
        <StatCard
          label="Shop Outstanding"
          value={formatINR(totalShopOutstanding)}
          subValue={`Overdue: ${formatINR(totalShopOverdue)}`}
          trend={{ text: `${shops.length} Retailers`, type: totalShopOverdue > 50000 ? 'warning' : 'neutral' }}
          icon={<Store className="w-4 h-4 text-amber-600" />}
          onClick={() => setCurrentScreen('shops')}
        />
        <StatCard
          label="Supplier Payable"
          value={formatINR(totalSupplierPayables)}
          subValue="Across 6 Vendors"
          icon={<Truck className="w-4 h-4 text-slate-600" />}
          onClick={() => setCurrentScreen('suppliers')}
        />
        <StatCard
          label="Inventory Value"
          value={formatINR(totalInventoryValue)}
          subValue="25 SKUs in Cold Store"
          icon={<Warehouse className="w-4 h-4 text-sky-600" />}
          onClick={() => setCurrentScreen('inventory')}
        />
        <StatCard
          label="Cash in Drawer"
          value={formatINR(dailyCash.physicalCountCash)}
          subValue={dailyCash.isClosed ? 'Day Closed' : 'Active Shift'}
          trend={{ text: dailyCash.variance === 0 ? 'Reconciled' : `Diff: ₹${dailyCash.variance}`, type: dailyCash.variance === 0 ? 'positive' : 'warning' }}
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
          onClick={() => setCurrentScreen('expenses')}
        />
      </div>

      {/* Quick Launch & Action Watchlist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Launch Action Center */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quick Operations
              </span>
              <span className="text-[10px] font-mono text-slate-400">Desktop Dispatch</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => setCurrentScreen('billing-direct')}
                className="flex items-center gap-2 p-2.5 rounded border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition-colors"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-xs">Direct POS Sale</div>
                  <div className="text-[10px] text-slate-500">Walk-in Counter</div>
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen('billing-retail')}
                className="flex items-center gap-2 p-2.5 rounded border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-left transition-colors"
              >
                <Receipt className="w-4 h-4 text-indigo-700 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-xs">Wholesale Bill</div>
                  <div className="text-[10px] text-slate-500">Retail Shop Invoice</div>
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen('purchases')}
                className="flex items-center gap-2 p-2.5 rounded border border-sky-200 bg-sky-50/60 hover:bg-sky-100/70 text-left transition-colors"
              >
                <Truck className="w-4 h-4 text-sky-700 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-xs">Inward Purchase</div>
                  <div className="text-[10px] text-slate-500">Stock & Batch GRN</div>
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen('shops')}
                className="flex items-center gap-2 p-2.5 rounded border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-colors"
              >
                <DollarSign className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-xs">Receive Payment</div>
                  <div className="text-[10px] text-slate-500">Shop Collections</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Daily Cash Closing:</span>
            <button
              onClick={() => setCurrentScreen('expenses')}
              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
            >
              Reconcile Register <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Low Stock & Expiry Critical Watchlist */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Action Watchlist (Expiry & Low Stock)
              </span>
              <button
                onClick={() => setCurrentScreen('inventory')}
                className="text-[10px] font-bold text-slate-900 hover:underline"
              >
                View Batches →
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {nearExpiryBatches.length === 0 && lowStockProducts.length === 0 && (
                <div className="p-4 text-center rounded bg-slate-50 border border-slate-200 text-slate-500">
                  <p className="font-semibold text-slate-700">All Stock Healthy</p>
                  <p className="text-[11px] mt-0.5">No near-expiry batches or low stock alerts.</p>
                </div>
              )}
              {nearExpiryBatches.slice(0, 3).map((item, idx) => (
                <div
                  key={`exp-${idx}`}
                  className="flex items-center justify-between p-2 rounded bg-amber-50/60 border border-amber-200/70"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-amber-950 truncate">{item.name}</p>
                    <p className="text-[11px] text-amber-800 font-mono">
                      Batch {item.batchNumber} · Exp: {item.expiryDate}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge
                      label={item.isExpired ? 'EXPIRED' : `${item.daysToExpiry}d left`}
                      variant={item.isExpired ? 'danger' : 'warning'}
                    />
                    <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                      {item.quantity} units
                    </div>
                  </div>
                </div>
              ))}

              {lowStockProducts.slice(0, 2).map((item, idx) => (
                <div
                  key={`low-${idx}`}
                  className="flex items-center justify-between p-2 rounded bg-rose-50/60 border border-rose-200/70"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-rose-950 truncate">{item.name}</p>
                    <p className="text-[11px] text-rose-800 font-mono">
                      Reorder: {item.reorderLevel} {item.unit}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge label="LOW STOCK" variant="danger" />
                    <div className="text-[10px] font-mono font-bold text-rose-700 mt-0.5">
                      Only {item.currentStock} left
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-center">
            <button
              onClick={() => setCurrentScreen('purchases')}
              className="text-xs font-semibold text-slate-900 hover:underline"
            >
              Order Low Stock SKUs from Vendors →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices & Transactions Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recent Sales & Billing Activity
            </h2>
            <p className="text-[11px] text-slate-500">
              Latest invoices generated across retail distribution routes and walk-in counter
            </p>
          </div>
          <button
            onClick={() => setCurrentScreen('invoices')}
            className="text-xs font-semibold text-slate-900 hover:underline"
          >
            View All Invoices ({invoices.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3 py-2.5">Invoice #</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Customer / Shop</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5 text-right">Grand Total</th>
                <th className="px-3 py-2.5 text-right">Balance Due</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No invoices recorded yet</p>
                    <p className="text-xs mt-0.5">Generate a wholesale invoice or direct POS bill to start tracking sales.</p>
                  </td>
                </tr>
              ) : (
                invoices.slice(0, 6).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{formatDate(inv.date)}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">
                      {inv.shopName}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{inv.type}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatINR(inv.grandTotal, true)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                      {formatINR(inv.balanceAmount, true)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusBadge
                        label={inv.paymentStatus}
                        variant={
                          inv.paymentStatus === 'Paid'
                            ? 'success'
                            : inv.paymentStatus === 'Partial'
                            ? 'warning'
                            : inv.paymentStatus === 'Cancelled'
                            ? 'neutral'
                            : 'danger'
                        }
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => setPrintableInvoice(inv)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
