import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Package, Store, Truck, FileText, ArrowRight, X } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    products,
    shops,
    suppliers,
    invoices,
    setCurrentScreen,
    setSelectedProductId,
    setSelectedShopId,
    setSelectedSupplierId,
    setSelectedInvoiceId,
  } = useApp();

  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return { products: [], shops: [], suppliers: [], invoices: [] };
    const q = query.toLowerCase();

    return {
      products: products.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)).slice(0, 4),
      shops: shops.filter((s) => s.shopName.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q) || s.routeArea.toLowerCase().includes(q)).slice(0, 4),
      suppliers: suppliers.filter((sup) => sup.name.toLowerCase().includes(q) || sup.contactPerson.toLowerCase().includes(q)).slice(0, 3),
      invoices: invoices.filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.shopName.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [query, products, shops, suppliers, invoices]);

  if (!isSearchOpen) return null;

  const totalResults = results.products.length + results.shops.length + results.suppliers.length + results.invoices.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, retail shops, suppliers, invoice # (e.g. 'Amul', 'INV-2026', 'Krishna')..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
          {query.length < 2 ? (
            <div className="p-6 text-center text-slate-400">
              Type at least 2 characters to search across inventory, ledger accounts, and invoices.
            </div>
          ) : totalResults === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {results.products.length > 0 && (
                <div className="py-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 px-2">
                    Products ({results.products.length})
                  </span>
                  {results.products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setCurrentScreen('products');
                        setIsSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-100 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-slate-400 font-mono text-[11px]">{p.code} · Stock: {p.currentStock} {p.unit}</p>
                        </div>
                      </div>
                      <span className="font-mono text-slate-700 font-medium">{formatINR(p.wholesaleRate)}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.shops.length > 0 && (
                <div className="py-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 px-2">
                    Retail Shops ({results.shops.length})
                  </span>
                  {results.shops.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedShopId(s.id);
                        setCurrentScreen('shops');
                        setIsSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-100 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900">{s.shopName}</p>
                          <p className="text-slate-400 text-[11px]">{s.ownerName} · {s.routeArea}</p>
                        </div>
                      </div>
                      <span className="font-mono text-rose-700 font-medium">Due: {formatINR(s.outstandingAmount)}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.invoices.length > 0 && (
                <div className="py-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 px-2">
                    Invoices ({results.invoices.length})
                  </span>
                  {results.invoices.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setCurrentScreen('invoices');
                        setIsSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-100 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900">{inv.invoiceNumber} — {inv.shopName}</p>
                          <p className="text-slate-400 text-[11px]">{inv.date} · {inv.paymentStatus}</p>
                        </div>
                      </div>
                      <span className="font-mono text-slate-900 font-medium">{formatINR(inv.grandTotal)}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.suppliers.length > 0 && (
                <div className="py-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 px-2">
                    Suppliers ({results.suppliers.length})
                  </span>
                  {results.suppliers.map((sup) => (
                    <button
                      key={sup.id}
                      onClick={() => {
                        setSelectedSupplierId(sup.id);
                        setCurrentScreen('suppliers');
                        setIsSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-100 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900">{sup.name}</p>
                          <p className="text-slate-400 text-[11px]">{sup.contactPerson} · {sup.city}</p>
                        </div>
                      </div>
                      <span className="font-mono text-slate-700 font-medium">Payable: {formatINR(sup.outstandingPayable)}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">ESC</kbd> to close</span>
          <span>Shortcut: <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">⌘ + K</kbd></span>
        </div>
      </div>
    </div>
  );
};
