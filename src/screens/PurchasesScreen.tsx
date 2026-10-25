import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PurchaseBill, PurchaseItem, ColdStorageZone } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  Truck,
  Plus,
  Trash2,
  FileText,
  Printer,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const PurchasesScreen: React.FC = () => {
  const {
    purchases,
    suppliers,
    products,
    selectedPurchaseId,
    setSelectedPurchaseId,
    createPurchase,
    postPurchaseBill,
    addToast,
  } = useApp();

  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);

  // New Purchase Bill Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [billNumber, setBillNumber] = useState(`PB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [billDate, setBillDate] = useState('2026-10-23');
  const [receivedDate, setReceivedDate] = useState('2026-10-23');
  const [paidAmount, setPaidAmount] = useState(0);
  const [remarks, setRemarks] = useState('Refrigerated reefer truck receipt. Temperatures verified.');

  const [lineItems, setLineItems] = useState<PurchaseItem[]>([]);

  const selectedPurchase = purchases.find((p) => p.id === selectedPurchaseId);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  // Totals Calculation for Form
  const formSubtotal = lineItems.reduce((sum, item) => sum + item.qty * item.costRate, 0);
  const formTaxTotal = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const formGrandTotal = formSubtotal + formTaxTotal;
  const formBalance = Math.max(0, formGrandTotal - paidAmount);

  const handleProductSelect = (index: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    if (!prod) return;

    const updated = [...lineItems];
    const qty = updated[index].qty || 1;
    const costRate = prod.purchaseRate;
    const gstRate = prod.gstRate;
    const tax = (qty * costRate * gstRate) / 100;

    updated[index] = {
      ...updated[index],
      productId: prod.id,
      productName: prod.name,
      brand: prod.brand,
      unit: prod.unit,
      costRate,
      gstRate,
      taxAmount: tax,
      totalAmount: qty * costRate + tax,
      zone: prod.primaryZone,
    };
    setLineItems(updated);
  };

  const handleLineQtyChange = (index: number, qty: number) => {
    const updated = [...lineItems];
    const item = updated[index];
    const tax = (qty * item.costRate * item.gstRate) / 100;
    updated[index] = {
      ...item,
      qty,
      taxAmount: tax,
      totalAmount: qty * item.costRate + tax,
    };
    setLineItems(updated);
  };

  const handleLineRateChange = (index: number, costRate: number) => {
    const updated = [...lineItems];
    const item = updated[index];
    const tax = (item.qty * costRate * item.gstRate) / 100;
    updated[index] = {
      ...item,
      costRate,
      taxAmount: tax,
      totalAmount: item.qty * costRate + tax,
    };
    setLineItems(updated);
  };

  const handleAddLine = () => {
    const defaultProd = products[0];
    if (!defaultProd) {
      addToast({
        type: 'warning',
        title: 'No Products Configured',
        message: 'Please add at least one product in the Products tab before adding purchase line items.',
      });
      return;
    }
    const tax = (50 * defaultProd.purchaseRate * defaultProd.gstRate) / 100;
    setLineItems([
      ...lineItems,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        brand: defaultProd.brand,
        batchNumber: `BT-${Math.floor(100 + Math.random() * 900)}`,
        mfgDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        qty: 50,
        unit: defaultProd.unit,
        costRate: defaultProd.purchaseRate,
        gstRate: defaultProd.gstRate,
        taxAmount: tax,
        totalAmount: 50 * defaultProd.purchaseRate + tax,
        zone: defaultProd.primaryZone,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmitPurchase = (autoPost: boolean) => {
    if (!selectedSupplier || lineItems.length === 0) return;

    createPurchase(
      {
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        supplierGstin: selectedSupplier.gstin,
        billDate,
        receivedDate,
        status: autoPost ? 'Posted' : 'Draft',
        items: lineItems,
        subtotal: formSubtotal,
        taxAmount: formTaxTotal,
        grandTotal: formGrandTotal,
        paidAmount,
        balanceAmount: formBalance,
        paymentStatus: formBalance === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending',
        remarks,
      },
      autoPost
    );

    setIsNewBillModalOpen(false);
  };

  const columns: Column<PurchaseBill>[] = [
    {
      header: 'Bill # / Reference',
      sortable: true,
      accessor: 'billNumber',
      render: (pb) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{pb.billNumber}</span>
          <div className="text-[10px] text-slate-400 font-mono">Recv: {formatDate(pb.receivedDate)}</div>
        </div>
      ),
    },
    {
      header: 'Supplier Depot',
      sortable: true,
      accessor: 'supplierName',
      width: '280px',
      render: (pb) => (
        <div>
          <div className="font-semibold text-slate-900 truncate max-w-xs">{pb.supplierName}</div>
          <div className="text-[10px] text-slate-400 font-mono">GSTIN: {pb.supplierGstin}</div>
        </div>
      ),
    },
    {
      header: 'Bill Date',
      sortable: true,
      accessor: 'billDate',
      render: (pb) => <span className="text-slate-600">{formatDate(pb.billDate)}</span>,
    },
    {
      header: 'Items Inward',
      align: 'center',
      render: (pb) => (
        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {pb.items.length} SKUs ({pb.items.reduce((s, i) => s + i.qty, 0)} units)
        </span>
      ),
    },
    {
      header: 'Grand Total',
      align: 'right',
      sortable: true,
      accessor: 'grandTotal',
      render: (pb) => <span className="font-mono font-bold text-slate-900">{formatINR(pb.grandTotal, true)}</span>,
    },
    {
      header: 'Payable Due',
      align: 'right',
      sortable: true,
      accessor: 'balanceAmount',
      render: (pb) => (
        <span className={`font-mono ${pb.balanceAmount > 0 ? 'text-amber-800 font-bold' : 'text-slate-400'}`}>
          {formatINR(pb.balanceAmount, true)}
        </span>
      ),
    },
    {
      header: 'Stock Status',
      align: 'center',
      render: (pb) => (
        <StatusBadge
          label={pb.status === 'Posted' ? 'POSTED TO STOCK' : 'DRAFT (NOT IN STOCK)'}
          variant={pb.status === 'Posted' ? 'success' : 'warning'}
        />
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (pb) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {pb.status === 'Draft' ? (
            <button
              onClick={() => postPurchaseBill(pb.id)}
              className="px-2 py-1 text-[11px] font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
            >
              Post Stock
            </button>
          ) : (
            <button
              onClick={() => setSelectedPurchaseId(pb.id)}
              className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              View GRN
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Purchases Posted (Current Month)
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatINR(purchases.filter((p) => p.status === 'Posted').reduce((sum, p) => sum + p.grandTotal, 0))}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Inventory core stock fully reconciled
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
            Pending Inward Drafts
          </span>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            {purchases.filter((p) => p.status === 'Draft').length} Shipments Unposted
          </div>
          <div className="text-xs text-amber-600 mt-0.5">
            Stock remains unincremented until warehouse quality sign-off
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Cold Storage Inward Policy
          </span>
          <div className="text-xl font-bold font-mono text-sky-800 mt-1">
            Reefer &lt; -18°C
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Thermal probe verification mandatory prior to posting
          </div>
        </div>
      </div>

      {/* Main Purchases Table */}
      <DataTable
        data={purchases}
        columns={columns}
        keyExtractor={(pb) => pb.id}
        searchPlaceholder="Search bill #, supplier name, GSTIN..."
        searchFilter={(pb, q) =>
          pb.billNumber.toLowerCase().includes(q) ||
          pb.supplierName.toLowerCase().includes(q) ||
          pb.supplierGstin.toLowerCase().includes(q)
        }
        onRowClick={(pb) => setSelectedPurchaseId(pb.id)}
        actions={
          <button
            onClick={() => setIsNewBillModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Purchase Bill (GRN)</span>
          </button>
        }
      />

      {/* New Purchase Bill Modal */}
      <Modal
        isOpen={isNewBillModalOpen}
        onClose={() => setIsNewBillModalOpen(false)}
        title="Inward Purchase Entry & Goods Receipt Note (GRN)"
        subtitle="Record ice cream / milk arrival with batch numbers, expiry dates & cold zone"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {/* Supplier & Header Info */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Supplier Depot <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
              >
                {suppliers.length === 0 ? (
                  <option value="">No suppliers registered (Add in Suppliers tab)</option>
                ) : (
                  suppliers
                    .filter((s) => (s.status || 'Active') === 'Active' || s.id === supplierId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Supplier Bill #</label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Bill Date</label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Received Date</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          {/* Selected Supplier Status Banner */}
          {selectedSupplier && (
            <div className="flex flex-wrap items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200 rounded text-xs gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-700" />
                <span className="font-semibold text-slate-900">{selectedSupplier.name}</span>
                <span className="text-slate-500">· {selectedSupplier.city}</span>
                {selectedSupplier.gstin && <span className="font-mono text-slate-500 text-[11px]">· GST: {selectedSupplier.gstin}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-600">
                  Credit Terms: <strong>{selectedSupplier.paymentTermsDays} Days</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] text-slate-700">
                  Current Outstanding: <strong className="font-mono text-amber-800">{formatINR(selectedSupplier.outstandingPayable)}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Inward Items & Cold Storage Allocation
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                    <th className="p-2 w-52">Product Description</th>
                    <th className="p-2 w-28">Batch #</th>
                    <th className="p-2 w-28">Expiry Date</th>
                    <th className="p-2 w-20 text-right">Qty</th>
                    <th className="p-2 w-24 text-right">Rate (₹)</th>
                    <th className="p-2 w-16 text-center">GST %</th>
                    <th className="p-2 w-28 text-right">Total (₹)</th>
                    <th className="p-2 w-44">Target Freezer Zone</th>
                    <th className="p-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-1.5">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.brand})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[idx].batchNumber = e.target.value;
                            setLineItems(updated);
                          }}
                          className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[idx].expiryDate = e.target.value;
                            setLineItems(updated);
                          }}
                          className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleLineQtyChange(idx, Number(e.target.value))}
                          className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded text-right font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.5"
                          value={item.costRate}
                          onChange={(e) => handleLineRateChange(idx, Number(e.target.value))}
                          className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded text-right font-mono"
                        />
                      </td>
                      <td className="p-1.5 text-center font-mono">{item.gstRate}%</td>
                      <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.totalAmount, true)}
                      </td>
                      <td className="p-1.5">
                        <select
                          value={item.zone}
                          onChange={(e) => {
                            const updated = [...lineItems];
                            updated[idx].zone = e.target.value as ColdStorageZone;
                            setLineItems(updated);
                          }}
                          className="w-full px-1.5 py-1 text-[11px] border border-slate-300 rounded bg-white font-mono"
                        >
                          <option value="Freezer A (-18°C Deep Freeze)">Freezer A (-18°C)</option>
                          <option value="Freezer B (-22°C Hardening Room)">Freezer B (-22°C)</option>
                          <option value="Chiller C (+4°C Dairy Room)">Chiller C (+4°C)</option>
                        </select>
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={lineItems.length === 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Grand Total Summary */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Advance Paid on Delivery (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
              <div className="mt-2">
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Reefer Temperature & Quality Notes
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5 text-right font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. Tax):</span>
                <span>{formatINR(formSubtotal, true)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST Tax:</span>
                <span>{formatINR(formTaxTotal, true)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-1">
                <span>Grand Inward Total:</span>
                <span>{formatINR(formGrandTotal, true)}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold">
                <span>Balance Payable:</span>
                <span>{formatINR(formBalance, true)}</span>
              </div>
            </div>
          </div>

          {/* Actions: Save Draft vs Post to Stock */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-[11px] text-slate-500">
              * Note: Stock inventory increases <strong>only</strong> when posted.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsNewBillModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmitPurchase(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmitPurchase(true)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Post & Increment Stock</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Purchase Detail GRN Modal */}
      {selectedPurchase && (
        <Modal
          isOpen={!!selectedPurchase}
          onClose={() => setSelectedPurchaseId(null)}
          title={`Goods Receipt Note (GRN): ${selectedPurchase.billNumber}`}
          subtitle={`Supplier: ${selectedPurchase.supplierName} · Received on ${formatDate(selectedPurchase.receivedDate)}`}
          maxWidth="3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div>
                <span className="text-xs font-mono text-slate-600">
                  Total: <strong>{formatINR(selectedPurchase.grandTotal, true)}</strong>
                </span>
              </div>
              <div className="flex gap-2">
                {selectedPurchase.status === 'Draft' && (
                  <button
                    onClick={() => {
                      postPurchaseBill(selectedPurchase.id);
                      setSelectedPurchaseId(null);
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded"
                  >
                    Post to Stock Now
                  </button>
                )}
                <button
                  onClick={() => {
                    window.print();
                    addToast({
                      type: 'info',
                      title: 'GRN Printed',
                      message: `Goods receipt note printed for ${selectedPurchase.billNumber}.`,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print GRN</span>
                </button>
                <button
                  onClick={() => setSelectedPurchaseId(null)}
                  className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Supplier Info</span>
                <p className="font-bold text-slate-900">{selectedPurchase.supplierName}</p>
                <p className="font-mono text-slate-500">GSTIN: {selectedPurchase.supplierGstin}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Dates & Status</span>
                <p className="text-slate-700">Bill Date: {formatDate(selectedPurchase.billDate)}</p>
                <p className="text-slate-700">Received: {formatDate(selectedPurchase.receivedDate)}</p>
                <div className="mt-1">
                  <StatusBadge
                    label={selectedPurchase.status}
                    variant={selectedPurchase.status === 'Posted' ? 'success' : 'warning'}
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Details</span>
                <p className="font-mono">Grand Total: {formatINR(selectedPurchase.grandTotal, true)}</p>
                <p className="font-mono text-emerald-700">Paid: {formatINR(selectedPurchase.paidAmount, true)}</p>
                <p className="font-mono text-amber-800 font-bold">Balance: {formatINR(selectedPurchase.balanceAmount, true)}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[580px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-2">Item Description</th>
                  <th className="p-2 font-mono">Batch #</th>
                  <th className="p-2 font-mono">Expiry</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2">Storage Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPurchase.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-medium text-slate-900">{item.productName}</td>
                    <td className="p-2 font-mono text-slate-600">{item.batchNumber}</td>
                    <td className="p-2 font-mono text-slate-600">{item.expiryDate}</td>
                    <td className="p-2 text-right font-mono">{item.qty} {item.unit}</td>
                    <td className="p-2 text-right font-mono">{formatINR(item.costRate, true)}</td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.totalAmount, true)}
                    </td>
                    <td className="p-2 font-mono text-[11px] text-slate-600">{item.zone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            {selectedPurchase.remarks && (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                Inspection Remarks: {selectedPurchase.remarks}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
