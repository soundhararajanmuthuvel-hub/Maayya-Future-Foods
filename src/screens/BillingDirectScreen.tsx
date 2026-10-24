import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product, BrandName, InvoiceItem } from '../types';
import { formatINR } from '../utils/formatters';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  QrCode,
  DollarSign,
  CheckCircle,
  Zap,
} from 'lucide-react';

export const BillingDirectScreen: React.FC = () => {
  const { products, brands, companyInfo, createInvoice, setPrintableInvoice, addToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([
    { product: products[0], qty: 2 },
    { product: products[5] || products[1], qty: 1 },
  ]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Cash');
  const [cashTendered, setCashTendered] = useState<number>(200);
  const [customerName, setCustomerName] = useState('Counter Walk-in Customer');

  const brandOptions: string[] = ['All', ...brands.map((b) => b.name)];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedBrand !== 'All' && p.brand !== selectedBrand) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, selectedBrand, searchQuery]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; qty: number }[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Calculate Cart Totals
  const subtotal = cart.reduce((sum, item) => {
    const preTaxRate = item.product.retailRate / (1 + item.product.gstRate / 100);
    return sum + preTaxRate * item.qty;
  }, 0);

  const grandTotal = cart.reduce((sum, item) => sum + item.product.retailRate * item.qty, 0);
  const taxAmount = grandTotal - subtotal;
  const changeDue = Math.max(0, cashTendered - grandTotal);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const invoiceItems: InvoiceItem[] = cart.map((item) => {
      const bestBatch = item.product.batches[0];
      const preTaxRate = item.product.retailRate / (1 + item.product.gstRate / 100);
      const lineTax = (item.product.retailRate - preTaxRate) * item.qty;
      return {
        productId: item.product.id,
        productCode: item.product.code,
        productName: item.product.name,
        brand: item.product.brand,
        batchNumber: bestBatch?.batchNumber || 'BT-POS',
        expiryDate: bestBatch?.expiryDate || '2027-04-01',
        qty: item.qty,
        unit: item.product.unit,
        unitPrice: Number(preTaxRate.toFixed(2)),
        gstRate: item.product.gstRate,
        taxAmount: Number(lineTax.toFixed(2)),
        totalAmount: item.product.retailRate * item.qty,
      };
    });

    const newInv = createInvoice({
      date: '2026-10-23',
      dueDate: '2026-10-23',
      shopName: customerName,
      type: 'Direct POS',
      items: invoiceItems,
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      cgst: Number((taxAmount / 2).toFixed(2)),
      sgst: Number((taxAmount / 2).toFixed(2)),
      igst: 0,
      discountAmount: 0,
      grandTotal: Number(grandTotal.toFixed(2)),
      paidAmount: Number(grandTotal.toFixed(2)),
      balanceAmount: 0,
      paymentStatus: 'Paid',
      paymentMode,
      notes: `Direct counter POS sale. Tendered: ₹${cashTendered}. Change: ₹${changeDue.toFixed(2)}`,
    });

    clearCart();
    setPrintableInvoice(newInv);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4">
      {/* Left Area: Fast Item Grid */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200/90 rounded-lg overflow-hidden">
        {/* Search & Brand Filter Bar */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Fast counter barcode / product lookup (e.g. Cornetto, Matka, Vanilla)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            {brandOptions.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedBrand === b
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start max-h-[420px] lg:max-h-none">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.currentStock <= 0;
            return (
              <button
                key={p.id}
                disabled={isOutOfStock}
                onClick={() => addToCart(p)}
                className={`p-2.5 rounded border text-left transition-all flex flex-col justify-between group ${
                  isOutOfStock
                    ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-xs active:scale-[0.98]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>{p.brand}</span>
                    <span className={p.currentStock <= p.reorderLevel ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                      {p.currentStock} {p.unit}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 text-xs leading-snug line-clamp-2">
                    {p.name}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {formatINR(p.retailRate)}
                  </span>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    + Add
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Area: Fast POS Cart & Tender Terminal */}
      <div className="w-full lg:w-96 bg-white border border-slate-200/90 rounded-lg flex flex-col shrink-0 overflow-hidden shadow-xs">
        {/* Cart Header */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assets/maayya-future-foods-logo.png"
              alt={`${companyInfo.name} logo`}
              className="h-8 w-auto max-w-[42px] object-contain shrink-0"
            />
            <div className="min-w-0">
              <span className="font-bold text-slate-900 text-xs block leading-tight truncate">
                Direct Counter Bill
              </span>
              <span className="text-[10px] text-slate-500 font-mono block leading-none truncate">
                {companyInfo.name} · {companyInfo.city}
              </span>
            </div>
          </div>
          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="text-[11px] text-rose-600 hover:underline disabled:opacity-40 shrink-0 ml-2"
          >
            Clear All
          </button>
        </div>

        {/* Customer input */}
        <div className="px-3 py-2 border-b border-slate-100 bg-white">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer Name / Mobile (Optional)"
            className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-700"
          />
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 text-xs">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="font-medium text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tap items on the catalog grid to add to counter bill
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-2 px-1 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate text-xs">{item.product.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {formatINR(item.product.retailRate)} each
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => updateCartQty(item.product.id, -1)}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-100 text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-slate-900">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateCartQty(item.product.id, 1)}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-100 text-slate-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="w-16 text-right font-mono font-bold text-slate-900 shrink-0">
                  {formatINR(item.product.retailRate * item.qty)}
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-slate-300 hover:text-rose-600 p-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Payment & Tender Drawer */}
        <div className="border-t border-slate-200 bg-slate-50/70 p-3 space-y-3 shrink-0">
          {/* Summary rows */}
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-500">
              <span>Taxable Subtotal:</span>
              <span>{formatINR(subtotal, true)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST Included:</span>
              <span>{formatINR(taxAmount, true)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-950 pt-1 border-t border-slate-200">
              <span>Total Payable:</span>
              <span>{formatINR(grandTotal, true)}</span>
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => {
                setPaymentMode('Cash');
                setCashTendered(grandTotal);
              }}
              className={`py-1.5 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors ${
                paymentMode === 'Cash'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Cash</span>
            </button>
            <button
              onClick={() => {
                setPaymentMode('UPI');
                setCashTendered(grandTotal);
              }}
              className={`py-1.5 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors ${
                paymentMode === 'UPI'
                  ? 'bg-sky-700 text-white font-bold'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>UPI QR</span>
            </button>
            <button
              onClick={() => {
                setPaymentMode('Bank Transfer');
                setCashTendered(grandTotal);
              }}
              className={`py-1.5 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors ${
                paymentMode === 'Bank Transfer'
                  ? 'bg-indigo-700 text-white font-bold'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>
          </div>

          {/* Cash Tender & Change Due */}
          {paymentMode === 'Cash' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                  Tendered (₹)
                </label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold bg-white"
                />
              </div>
              <div className="bg-white border border-slate-200 p-1.5 rounded text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Change Due</span>
                <span className="font-mono font-bold text-xs text-emerald-700">
                  {formatINR(changeDue, true)}
                </span>
              </div>
            </div>
          )}

          {/* Checkout CTA */}
          <button
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full py-2.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 disabled:opacity-40 rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Complete & Print Slip ({formatINR(grandTotal)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
