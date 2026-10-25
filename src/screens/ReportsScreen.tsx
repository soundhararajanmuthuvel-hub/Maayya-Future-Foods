import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Receipt,
  Truck,
  Warehouse,
  Flame,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const {
    products,
    shops,
    suppliers,
    invoices,
    purchases,
    expenses,
    stockAdjustments,
    addToast,
    companyInfo,
  } = useApp();

  const [activeReport, setActiveReport] = useState<
    'sales' | 'purchases' | 'margins' | 'pl' | 'stock' | 'wastage' | 'ageing' | 'gst' | 'closing'
  >('pl');
  const [dateRange, setDateRange] = useState('October 2026 (MTD)');

  // Overall Financial Calculations
  const validInvoices = invoices.filter((i) => i.paymentStatus !== 'Cancelled');
  const totalRevenue = validInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalTaxCollected = validInvoices.reduce((sum, i) => sum + i.taxAmount, 0);
  const totalNetSales = validInvoices.reduce((sum, i) => sum + i.subtotal, 0);

  // COGS Calculation
  const totalCOGS = validInvoices.reduce((sum, inv) => {
    return (
      sum +
      inv.items.reduce((itemSum, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cost = prod ? prod.purchaseRate : item.unitPrice * 0.7;
        return itemSum + cost * item.qty;
      }, 0)
    );
  }, 0);

  const grossProfit = totalNetSales - totalCOGS;
  const grossMarginPercent = totalNetSales > 0 ? (grossProfit / totalNetSales) * 100 : 0;

  // Operating Expenses
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalWastageLoss = stockAdjustments.reduce((sum, a) => sum + a.totalLoss, 0);
  const totalOpEx = totalOperatingExpenses + totalWastageLoss;

  // Net Profit
  const netProfit = grossProfit - totalOpEx;
  const netMarginPercent = totalNetSales > 0 ? (netProfit / totalNetSales) * 100 : 0;

  // CSV Export simulation
  const handleExportCsv = (reportName: string) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      `"${companyInfo.name} - ${reportName} Report"\n"Generated: ${new Date().toISOString()}"\n"Period: ${dateRange}"\n\n` +
      `"Gross Revenue",${totalRevenue.toFixed(2)}\n"COGS",${totalCOGS.toFixed(2)}\n"Gross Profit",${grossProfit.toFixed(2)}\n"Operating Expenses",${totalOpEx.toFixed(2)}\n"Net Profit",${netProfit.toFixed(2)}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${companyInfo.name.toLowerCase().replace(/\s+/g, '_')}_${reportName.toLowerCase()}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'CSV Report Downloaded',
      message: `${reportName} dataset exported to CSV file.`,
    });
  };

  const handlePrint = () => {
    window.print();
    addToast({
      type: 'info',
      title: 'Report Print Triggered',
      message: 'System print dialog opened for report view.',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Export Bar */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { id: 'pl', label: 'P&L Statement' },
            { id: 'sales', label: 'Sales & Invoices' },
            { id: 'margins', label: 'Product Margins' },
            { id: 'purchases', label: 'Purchases & Inward' },
            { id: 'stock', label: 'Stock Valuation' },
            { id: 'wastage', label: 'Wastage & Cold Chain' },
            { id: 'ageing', label: 'Shop Ageing' },
            { id: 'gst', label: 'GST GSTR-1 / 3B' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id as any)}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                activeReport === r.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
          >
            <option value="Today (23-Oct-2026)">Today (23-Oct-2026)</option>
            <option value="This Week">This Week (17-23 Oct)</option>
            <option value="October 2026 (MTD)">October 2026 (MTD)</option>
            <option value="Q3 FY 2026-27">Q3 FY 2026-27</option>
          </select>
          <button
            onClick={() => handleExportCsv(activeReport.toUpperCase())}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* REPORT 1: P&L Statement */}
      {activeReport === 'pl' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Net Sales Revenue"
              value={formatINR(totalNetSales)}
              subValue="Excl. GST Tax"
              trend={{ text: `${validInvoices.length} orders`, type: 'positive' }}
              icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              label="Cost of Goods (COGS)"
              value={formatINR(totalCOGS)}
              subValue="Inward cold supply cost"
              icon={<Warehouse className="w-4 h-4 text-slate-600" />}
            />
            <StatCard
              label="Gross Profit"
              value={formatINR(grossProfit)}
              subValue={`${grossMarginPercent.toFixed(1)}% Gross Margin`}
              trend={{ text: 'Healthy distribution spread', type: 'positive' }}
              icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
            />
            <StatCard
              label="Net Operating Profit"
              value={formatINR(netProfit)}
              subValue={`${netMarginPercent.toFixed(1)}% Net Margin`}
              trend={{ text: 'After power & cold-chain costs', type: 'positive' }}
              icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
            />
          </div>

          {/* Formal P&L Statement Table */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-5">
            <div className="text-center pb-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-950 font-serif">MAYA FUTURE FOODS PVT LTD</h2>
              <p className="text-xs text-slate-600 font-medium">
                PROFIT & LOSS STATEMENT (TRADING & OPERATIONAL ACCOUNT)
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Period: {dateRange} · Currency: INR (₹)</p>
            </div>

            <div className="mt-4 border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-300 text-[11px] text-slate-800 font-sans">
                    <th className="p-2.5">Line Item Particulars</th>
                    <th className="p-2.5">Category / Code</th>
                    <th className="p-2.5 text-right">Debit (₹)</th>
                    <th className="p-2.5 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Revenue */}
                  <tr className="bg-emerald-50/30">
                    <td className="p-2 font-bold font-sans text-slate-900">1. Gross Revenue from Operations</td>
                    <td className="p-2 text-slate-500 font-sans">Wholesale & POS</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                    <td className="p-2 text-right font-bold text-emerald-800">{formatINR(totalRevenue, true)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 pl-6 font-sans text-slate-600">Less: GST Output Tax Collected (CGST + SGST)</td>
                    <td className="p-2 text-slate-400 font-sans">Tax Liability</td>
                    <td className="p-2 text-right text-slate-700">{formatINR(totalTaxCollected, true)}</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                  </tr>
                  <tr className="font-semibold bg-slate-50">
                    <td className="p-2 font-sans text-slate-900">Net Sales Revenue</td>
                    <td className="p-2 text-slate-500 font-sans">Net Turnover</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatINR(totalNetSales, true)}</td>
                  </tr>

                  {/* COGS */}
                  <tr>
                    <td className="p-2 font-bold font-sans text-slate-900 pt-3">2. Cost of Goods Sold (COGS)</td>
                    <td className="p-2 text-slate-500 font-sans pt-3">Procurement</td>
                    <td className="p-2 text-right text-slate-400 pt-3">—</td>
                    <td className="p-2 text-right text-slate-400 pt-3">—</td>
                  </tr>
                  <tr>
                    <td className="p-2 pl-6 font-sans text-slate-600">Product Inward Cost (Amul, Kwality, Vadilal, Havmor, Maya)</td>
                    <td className="p-2 text-slate-400 font-sans">Purchases</td>
                    <td className="p-2 text-right text-slate-700">{formatINR(totalCOGS, true)}</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                  </tr>
                  <tr className="font-bold bg-indigo-50/50">
                    <td className="p-2 font-sans text-indigo-950">GROSS PROFIT</td>
                    <td className="p-2 text-indigo-800 font-sans">{grossMarginPercent.toFixed(1)}% of Net Sales</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                    <td className="p-2 text-right text-indigo-900 font-bold">{formatINR(grossProfit, true)}</td>
                  </tr>

                  {/* Operating Expenses */}
                  <tr>
                    <td className="p-2 font-bold font-sans text-slate-900 pt-3">3. Cold-Chain Operating Expenses (OpEx)</td>
                    <td className="p-2 text-slate-500 font-sans pt-3">Utilities & Cold</td>
                    <td className="p-2 text-right text-slate-400 pt-3">—</td>
                    <td className="p-2 text-right text-slate-400 pt-3">—</td>
                  </tr>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="p-2 pl-6 font-sans text-slate-600">{exp.category} ({exp.paidTo})</td>
                      <td className="p-2 text-slate-400 font-sans">{exp.voucherNo}</td>
                      <td className="p-2 text-right text-slate-700">{formatINR(exp.amount, true)}</td>
                      <td className="p-2 text-right text-slate-400">—</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="p-2 pl-6 font-sans text-rose-700">Cold-Chain Spoilage / Melt Down Loss</td>
                    <td className="p-2 text-rose-600 font-sans">Stock Loss</td>
                    <td className="p-2 text-right text-rose-700">{formatINR(totalWastageLoss, true)}</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                  </tr>
                  <tr className="font-semibold bg-slate-50">
                    <td className="p-2 font-sans text-slate-900">Total Operating Overhead</td>
                    <td className="p-2 text-slate-500 font-sans">OpEx Total</td>
                    <td className="p-2 text-right text-rose-700 font-bold">{formatINR(totalOpEx, true)}</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                  </tr>

                  {/* NET PROFIT */}
                  <tr className="bg-emerald-100 font-bold text-sm border-t-2 border-emerald-600">
                    <td className="p-3 font-sans text-emerald-950">NET PROFIT BEFORE TAX</td>
                    <td className="p-3 text-emerald-800 font-sans">{netMarginPercent.toFixed(1)}% Net Margin</td>
                    <td className="p-3 text-right text-slate-400">—</td>
                    <td className="p-3 text-right text-emerald-950 font-bold">{formatINR(netProfit, true)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: Sales & Invoices Summary */}
      {activeReport === 'sales' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Sales Breakdown by Channel & Customer
          </h3>
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-2">Invoice #</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Customer / Outlet</th>
                  <th className="p-2">Channel</th>
                  <th className="p-2 text-right">Taxable Subtotal</th>
                  <th className="p-2 text-right">GST Tax</th>
                  <th className="p-2 text-right">Grand Total</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {validInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="p-2 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-2 text-slate-600 font-sans">{formatDate(inv.date)}</td>
                    <td className="p-2 font-medium font-sans text-slate-900">{inv.shopName}</td>
                    <td className="p-2 text-slate-500 font-sans">{inv.type}</td>
                    <td className="p-2 text-right text-slate-700">{formatINR(inv.subtotal, true)}</td>
                    <td className="p-2 text-right text-slate-700">{formatINR(inv.taxAmount, true)}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatINR(inv.grandTotal, true)}</td>
                    <td className="p-2 text-center font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: Margins & Profitability by Product */}
      {activeReport === 'margins' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Product SKU Profit Margin Matrix
          </h3>
          <div className="border border-slate-200 rounded overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-2">Product Description</th>
                  <th className="p-2">Brand</th>
                  <th className="p-2 text-right">Inward Cost</th>
                  <th className="p-2 text-right">Wholesale Rate</th>
                  <th className="p-2 text-right">Wholesale Margin %</th>
                  <th className="p-2 text-right">Retail POS Rate</th>
                  <th className="p-2 text-right">Retail Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {products.map((p) => {
                  const wsMargin = (((p.wholesaleRate - p.purchaseRate) / p.purchaseRate) * 100).toFixed(1);
                  const rtMargin = (((p.retailRate - p.purchaseRate) / p.purchaseRate) * 100).toFixed(1);
                  return (
                    <tr key={p.id}>
                      <td className="p-2 font-medium font-sans text-slate-900">{p.name}</td>
                      <td className="p-2 text-slate-500 font-sans">{p.brand}</td>
                      <td className="p-2 text-right text-slate-600">{formatINR(p.purchaseRate)}</td>
                      <td className="p-2 text-right text-slate-800">{formatINR(p.wholesaleRate)}</td>
                      <td className="p-2 text-right font-bold text-indigo-700">+{wsMargin}%</td>
                      <td className="p-2 text-right text-slate-800">{formatINR(p.retailRate)}</td>
                      <td className="p-2 text-right font-bold text-emerald-700">+{rtMargin}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: Purchases Report */}
      {activeReport === 'purchases' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Supplier Procurement & Inward GRN Summary
          </h3>
          <div className="border border-slate-200 rounded overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-2">Bill #</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Supplier Depot</th>
                  <th className="p-2 text-right">Total Inward Qty</th>
                  <th className="p-2 text-right">Taxable Subtotal</th>
                  <th className="p-2 text-right">GST Input Tax</th>
                  <th className="p-2 text-right">Grand Total</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {purchases.map((pb) => (
                  <tr key={pb.id}>
                    <td className="p-2 font-bold text-slate-900">{pb.billNumber}</td>
                    <td className="p-2 text-slate-600 font-sans">{formatDate(pb.billDate)}</td>
                    <td className="p-2 font-medium font-sans text-slate-900">{pb.supplierName}</td>
                    <td className="p-2 text-right">{pb.items.reduce((s, i) => s + i.qty, 0)} units</td>
                    <td className="p-2 text-right text-slate-700">{formatINR(pb.subtotal, true)}</td>
                    <td className="p-2 text-right text-slate-700">{formatINR(pb.taxAmount, true)}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatINR(pb.grandTotal, true)}</td>
                    <td className="p-2 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pb.status === 'Posted' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {pb.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 5: Stock Valuation */}
      {activeReport === 'stock' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Central Warehouse Inventory Valuation by Category & Brand
            </h3>
            <span className="font-mono font-bold text-sm text-slate-900">
              Total Assets: {formatINR(products.reduce((s, p) => s + p.currentStock * p.purchaseRate, 0))}
            </span>
          </div>
          <div className="border border-slate-200 rounded overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-2">Item Description</th>
                  <th className="p-2">Brand</th>
                  <th className="p-2">Category</th>
                  <th className="p-2 text-right">Current Stock</th>
                  <th className="p-2 text-right">Inward Cost Rate</th>
                  <th className="p-2 text-right">Total Cost Valuation</th>
                  <th className="p-2 text-right">Market Realizable Value (Wholesale)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2 font-medium font-sans text-slate-900">{p.name}</td>
                    <td className="p-2 text-slate-500 font-sans">{p.brand}</td>
                    <td className="p-2 text-[11px] text-slate-600 font-sans">{p.category}</td>
                    <td className="p-2 text-right font-bold">{p.currentStock} {p.unit}</td>
                    <td className="p-2 text-right text-slate-600">{formatINR(p.purchaseRate)}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatINR(p.currentStock * p.purchaseRate)}</td>
                    <td className="p-2 text-right text-indigo-700">{formatINR(p.currentStock * p.wholesaleRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 6: Wastage & Cold Chain Melt */}
      {activeReport === 'wastage' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Cold Chain Spoilage & Melting Incident Register
            </h3>
            <span className="font-mono font-bold text-sm text-rose-700">
              Total Wastage Loss: {formatINR(totalWastageLoss)}
            </span>
          </div>
          <div className="border border-slate-200 rounded overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[580px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-2">Date</th>
                  <th className="p-2">Product Description</th>
                  <th className="p-2">Batch #</th>
                  <th className="p-2">Incident Type</th>
                  <th className="p-2 text-right">Discarded Qty</th>
                  <th className="p-2 text-right">Financial Loss</th>
                  <th className="p-2">Root Cause Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {stockAdjustments.map((adj) => (
                  <tr key={adj.id}>
                    <td className="p-2 text-slate-600 font-sans">{formatDate(adj.date)}</td>
                    <td className="p-2 font-medium font-sans text-slate-900">{adj.productName}</td>
                    <td className="p-2 text-slate-600">{adj.batchNumber}</td>
                    <td className="p-2 font-sans font-bold text-slate-800">{adj.type}</td>
                    <td className="p-2 text-right text-rose-700 font-bold">{adj.qty} {adj.unit}</td>
                    <td className="p-2 text-right font-bold text-rose-700">{formatINR(adj.totalLoss)}</td>
                    <td className="p-2 text-slate-500 font-sans italic text-xs">{adj.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 7: Shop Ageing */}
      {activeReport === 'ageing' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Retail Accounts Receivables Ageing Schedule
          </h3>
          <div className="border border-slate-200 rounded overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-2">Retail Outlet</th>
                  <th className="p-2">Route</th>
                  <th className="p-2 text-right">Sanctioned Limit</th>
                  <th className="p-2 text-right">0 - 15 Days</th>
                  <th className="p-2 text-right">16 - 30 Days</th>
                  <th className="p-2 text-right">31 - 60 Days</th>
                  <th className="p-2 text-right">Overdue Total</th>
                  <th className="p-2 text-right">Total Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {shops.map((s) => (
                  <tr key={s.id}>
                    <td className="p-2 font-medium font-sans text-slate-900">{s.shopName}</td>
                    <td className="p-2 text-slate-500 font-sans">{s.routeArea.split(':')[0]}</td>
                    <td className="p-2 text-right text-slate-600">{formatINR(s.creditLimit)}</td>
                    <td className="p-2 text-right text-slate-700">{formatINR(Math.max(0, s.outstandingAmount - s.overdueAmount))}</td>
                    <td className="p-2 text-right text-amber-700">{formatINR(s.overdueAmount * 0.7)}</td>
                    <td className="p-2 text-right text-rose-700">{formatINR(s.overdueAmount * 0.3)}</td>
                    <td className="p-2 text-right font-bold text-rose-700">{formatINR(s.overdueAmount)}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatINR(s.outstandingAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 8: GST Tax Review (GSTR-1 & 3B) */}
      {activeReport === 'gst' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Output CGST (Central Tax 9%)
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {formatINR(totalTaxCollected / 2)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Payable under GSTR-3B</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Output SGST (State Tax 9%)
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {formatINR(totalTaxCollected / 2)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Tamil Nadu State Tax Code: 33</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Output Tax Liability
              </span>
              <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                {formatINR(totalTaxCollected)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Eligible for input tax credit (ITC) offset</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              GSTR-1 Outward Supplies Summary (B2B & B2C)
            </h3>
            <div className="border border-slate-200 rounded overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono min-w-[580px]">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-200 text-[11px] text-slate-700 font-sans">
                    <th className="p-2">HSN Code</th>
                    <th className="p-2">Item Category Description</th>
                    <th className="p-2 text-center">Tax Rate</th>
                    <th className="p-2 text-right">Taxable Turnover (₹)</th>
                    <th className="p-2 text-right">CGST (₹)</th>
                    <th className="p-2 text-right">SGST (₹)</th>
                    <th className="p-2 text-right">Total GST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2 font-bold text-slate-900">2105 00 00</td>
                    <td className="p-2 font-sans text-slate-700">Ice Cream and other edible ice (with or without cocoa)</td>
                    <td className="p-2 text-center">18%</td>
                    <td className="p-2 text-right text-slate-900">{formatINR(totalNetSales * 0.72, true)}</td>
                    <td className="p-2 text-right text-slate-600">{formatINR((totalTaxCollected * 0.8) / 2, true)}</td>
                    <td className="p-2 text-right text-slate-600">{formatINR((totalTaxCollected * 0.8) / 2, true)}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatINR(totalTaxCollected * 0.8, true)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-900">0405 10 00</td>
                    <td className="p-2 font-sans text-slate-700">Butter, Dairy Spreads and Pure Desi Ghee</td>
                    <td className="p-2 text-center">12%</td>
                    <td className="p-2 text-right text-slate-900">{formatINR(totalNetSales * 0.15, true)}</td>
                    <td className="p-2 text-right text-slate-600">{formatINR((totalTaxCollected * 0.12) / 2, true)}</td>
                    <td className="p-2 text-right text-slate-600">{formatINR((totalTaxCollected * 0.12) / 2, true)}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatINR(totalTaxCollected * 0.12, true)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-900">0406 10 00</td>
                    <td className="p-2 font-sans text-slate-700">Fresh Paneer, Standardized Cow Milk & Curd</td>
                    <td className="p-2 text-center">5%</td>
                    <td className="p-2 text-right text-slate-900">{formatINR(totalNetSales * 0.13, true)}</td>
                    <td className="p-2 text-right text-slate-600">{formatINR((totalTaxCollected * 0.08) / 2, true)}</td>
                    <td className="p-2 text-right text-slate-600">{formatINR((totalTaxCollected * 0.08) / 2, true)}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatINR(totalTaxCollected * 0.08, true)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
