import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InvoiceItem, RetailShop } from '../types';
import { formatINR } from '../utils/formatters';
import {
  Receipt,
  Plus,
  Trash2,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Store,
  CreditCard,
} from 'lucide-react';

export const BillingRetailScreen: React.FC = () => {
  const {
    shops,
    products,
    companyInfo,
    createInvoice,
    setPrintableInvoice,
    setCurrentScreen,
    addToast,
  } = useApp();

  const [selectedShopId, setSelectedShopId] = useState<string>(shops[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState('2026-10-23');
  const [dueDate, setDueDate] = useState('2026-11-06');
  const [paymentMode, setPaymentMode] = useState<'Credit' | 'Cash' | 'UPI' | 'Bank Transfer'>('Credit');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidNowAmount, setPaidNowAmount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('Standard morning distribution van delivery');

  const selectedShop = shops.find((s) => s.id === selectedShopId);

  // Line items state
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    const firstProd = products[0];
    const bestBatch = firstProd?.batches[0];
    const qty = 20;
    const unitPrice = firstProd?.wholesaleRate || 19.50;
    const gstRate = firstProd?.gstRate || 18;
    const tax = (qty * unitPrice * gstRate) / 100;
    return [
      {
        productId: firstProd?.id || '',
        productCode: firstProd?.code || '',
        productName: firstProd?.name || '',
        brand: firstProd?.brand || 'Amul',
        batchNumber: bestBatch?.batchNumber || 'BT-001',
        expiryDate: bestBatch?.expiryDate || '2027-03-10',
        qty,
        unit: firstProd?.unit || 'Piece',
        unitPrice,
        gstRate,
        taxAmount: tax,
        totalAmount: qty * unitPrice + tax,
      },
    ];
  });

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);
  const balanceDue = Math.max(0, grandTotal - paidNowAmount);

  // Credit Limit Check
  const projectedOutstanding = (selectedShop?.outstandingAmount || 0) + balanceDue;
  const isCreditExceeded = selectedShop ? projectedOutstanding > selectedShop.creditLimit : false;
  const isCreditWarning = selectedShop ? projectedOutstanding > selectedShop.creditLimit * 0.85 : false;

  const handleProductChange = (index: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    if (!prod) return;

    // FEFO: Sort batches by earliest expiry date
    const sortedBatches = [...prod.batches].sort(
      (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );
    const bestBatch = sortedBatches.find((b) => b.quantity > 0) || sortedBatches[0];

    const updated = [...items];
    const qty = updated[index].qty || 1;
    const unitPrice = prod.wholesaleRate;
    const gstRate = prod.gstRate;
    const tax = (qty * unitPrice * gstRate) / 100;

    updated[index] = {
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      brand: prod.brand,
      batchNumber: bestBatch?.batchNumber || 'BT-DEF',
      expiryDate: bestBatch?.expiryDate || '2027-03-01',
      qty,
      unit: prod.unit,
      unitPrice,
      gstRate,
      taxAmount: tax,
      totalAmount: qty * unitPrice + tax,
    };
    setItems(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...items];
    const item = updated[index];
    const tax = (qty * item.unitPrice * item.gstRate) / 100;
    updated[index] = {
      ...item,
      qty,
      taxAmount: tax,
      totalAmount: qty * item.unitPrice + tax,
    };
    setItems(updated);
  };

  const handlePriceChange = (index: number, unitPrice: number) => {
    const updated = [...items];
    const item = updated[index];
    const tax = (item.qty * unitPrice * item.gstRate) / 100;
    updated[index] = {
      ...item,
      unitPrice,
      taxAmount: tax,
      totalAmount: item.qty * unitPrice + tax,
    };
    setItems(updated);
  };

  const handleAddLine = () => {
    const defaultProd = products[1] || products[0];
    const sortedBatches = [...defaultProd.batches].sort(
      (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );
    const bestBatch = sortedBatches.find((b) => b.quantity > 0) || sortedBatches[0];
    const qty = 10;
    const tax = (qty * defaultProd.wholesaleRate * defaultProd.gstRate) / 100;

    setItems([
      ...items,
      {
        productId: defaultProd.id,
        productCode: defaultProd.code,
        productName: defaultProd.name,
        brand: defaultProd.brand,
        batchNumber: bestBatch?.batchNumber || 'BT-DEF',
        expiryDate: bestBatch?.expiryDate || '2027-04-01',
        qty,
        unit: defaultProd.unit,
        unitPrice: defaultProd.wholesaleRate,
        gstRate: defaultProd.gstRate,
        taxAmount: tax,
        totalAmount: qty * defaultProd.wholesaleRate + tax,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleGenerateInvoice = () => {
    if (!selectedShop || items.length === 0) return;

    const newInv = createInvoice({
      date: invoiceDate,
      dueDate,
      shopId: selectedShop.id,
      shopName: selectedShop.shopName,
      shopAddress: selectedShop.address,
      shopGstin: selectedShop.gstin,
      type: 'Retail Wholesale',
      items,
      subtotal,
      taxAmount,
      cgst,
      sgst,
      igst: 0,
      discountAmount,
      grandTotal,
      paidAmount: paidNowAmount,
      balanceAmount: balanceDue,
      paymentStatus: balanceDue === 0 ? 'Paid' : paidNowAmount > 0 ? 'Partial' : 'Unpaid',
      paymentMode,
      notes: orderNotes,
    });

    // Automatically pop open the printable Tax Invoice
    setPrintableInvoice(newInv);
  };

  return (
    <div className="space-y-4">
      {/* Header Info & Credit Check Bar */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src="/assets/maayya-future-foods-logo.png"
              alt={`${companyInfo.name} logo`}
              className="h-10 w-auto max-w-[55px] object-contain shrink-0"
            />
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-indigo-700" />
                <span>Wholesale Retail Distribution Invoice</span>
              </h2>
              <p className="text-xs text-slate-500">
                {companyInfo.name}, {companyInfo.city} (Phone: {companyInfo.phone}) · GST wholesale billing with FEFO batch allocation
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600 shrink-0">
            Series: INV-2026-###
          </span>
        </div>

        {/* Shop Select & Credit Warning */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Select Retail Shop / Consignee
            </label>
            <select
              value={selectedShopId}
              onChange={(e) => {
                setSelectedShopId(e.target.value);
                const s = shops.find((shop) => shop.id === e.target.value);
                if (s) {
                  // set due date according to credit days
                  const d = new Date(invoiceDate);
                  d.setDate(d.getDate() + s.creditDays);
                  setDueDate(d.toISOString().substring(0, 10));
                }
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shopName} ({s.routeArea.split(':')[0]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Billing Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment Terms</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
            >
              <option value="Credit">Regular Route Credit ({selectedShop?.creditDays || 14} Days)</option>
              <option value="UPI">Instant Delivery UPI / QR</option>
              <option value="Cash">Cash on Delivery</option>
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
            </select>
          </div>
        </div>

        {/* Selected Shop Credit Card Preview */}
        {selectedShop && (
          <div
            className={`p-3 rounded border text-xs flex flex-wrap items-center justify-between gap-3 ${
              isCreditExceeded
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : isCreditWarning
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Store className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="font-bold">{selectedShop.shopName}</span>
                <span className="text-[11px] text-slate-500 ml-2">
                  Owner: {selectedShop.ownerName} · {selectedShop.phone} · {selectedShop.routeArea}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Credit Limit</span>
                <span className="font-bold">{formatINR(selectedShop.creditLimit)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Outstanding Now</span>
                <span className="font-bold">{formatINR(selectedShop.outstandingAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Post-Bill Total</span>
                <span className={`font-bold ${isCreditExceeded ? 'text-rose-700' : 'text-slate-900'}`}>
                  {formatINR(projectedOutstanding)}
                </span>
              </div>
            </div>
          </div>
        )}

        {isCreditExceeded && (
          <div className="p-2.5 bg-rose-100/70 border border-rose-300 text-rose-900 rounded text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>
              <strong>Warning:</strong> This order pushes {selectedShop?.shopName} past their credit limit of{' '}
              {formatINR(selectedShop?.creditLimit || 0)}. Manager override permitted in demo mode.
            </span>
          </div>
        )}
      </div>

      {/* Invoice Line Items Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Invoice Line Items (FEFO Auto-Allocated)</span>
          </span>
          <button
            type="button"
            onClick={handleAddLine}
            className="flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                <th className="p-2.5 w-60">Item & Brand</th>
                <th className="p-2.5 w-32">Allocated Batch</th>
                <th className="p-2.5 w-24">Expiry</th>
                <th className="p-2.5 w-24 text-right">Quantity</th>
                <th className="p-2.5 w-24 text-right">Wholesale Rate</th>
                <th className="p-2.5 w-16 text-center">GST %</th>
                <th className="p-2.5 w-24 text-right">Tax (₹)</th>
                <th className="p-2.5 w-28 text-right">Total (₹)</th>
                <th className="p-2.5 w-8 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2">
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.brand}) — Stock: {p.currentStock} {p.unit}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={item.batchNumber}
                        onChange={(e) => {
                          const updated = [...items];
                          const selectedBatch = prod?.batches.find((b) => b.batchNumber === e.target.value);
                          updated[idx].batchNumber = e.target.value;
                          if (selectedBatch) {
                            updated[idx].expiryDate = selectedBatch.expiryDate;
                          }
                          setItems(updated);
                        }}
                        className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                      >
                        {prod?.batches.map((b) => (
                          <option key={b.batchNumber} value={b.batchNumber}>
                            {b.batchNumber} ({b.quantity} left)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 font-mono text-slate-600">{item.expiryDate}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-right font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.5"
                        value={item.unitPrice}
                        onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-right font-mono"
                      />
                    </td>
                    <td className="p-2 text-center font-mono">{item.gstRate}%</td>
                    <td className="p-2 text-right font-mono text-slate-700">
                      {formatINR(item.taxAmount, true)}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.totalAmount, true)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={items.length === 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation & Tender Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-3 border-t border-slate-200">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Order Delivery Notes & Driver Instructions
              </label>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Immediate Payment Received (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paidNowAmount}
                  onChange={(e) => setPaidNowAmount(Number(e.target.value))}
                  placeholder="0 for full credit"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Special Scheme Discount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
                />
              </div>
            </div>
          </div>

          {/* Breakdown summary */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-1.5 text-right font-mono text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (Excl. GST):</span>
              <span>{formatINR(subtotal, true)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CGST (Central Tax 9% / 2.5%):</span>
              <span>{formatINR(cgst, true)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST (State Tax 9% / 2.5%):</span>
              <span>{formatINR(sgst, true)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Promotional Discount:</span>
                <span>-{formatINR(discountAmount, true)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-300 pt-2">
              <span>Invoice Grand Total:</span>
              <span>{formatINR(grandTotal, true)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span>Paid on Delivery:</span>
              <span className="text-emerald-700">{formatINR(paidNowAmount, true)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Carried to Shop Ledger:</span>
              <span className={balanceDue > 0 ? 'text-rose-700' : 'text-slate-700'}>
                {formatINR(balanceDue, true)}
              </span>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
          <button
            type="button"
            onClick={() => setCurrentScreen('invoices')}
            className="text-xs text-slate-600 hover:underline"
          >
            ← View Invoices Registry
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateInvoice}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Generate & Print Tax Invoice (Demo)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
