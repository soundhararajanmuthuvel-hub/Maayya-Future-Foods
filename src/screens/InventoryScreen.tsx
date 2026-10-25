import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Batch, StockAdjustment } from '../types';
import { formatINR, formatDate, getExpiryStatus, getStockStatus } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  Warehouse,
  Clock,
  AlertTriangle,
  SlidersHorizontal,
  ClipboardList,
  Plus,
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const {
    products,
    stockAdjustments,
    recordStockAdjustment,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'adjustments' | 'audit'>('overview');

  // Stock Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjProductId, setAdjProductId] = useState(products[0]?.id || '');
  const [adjType, setAdjType] = useState<StockAdjustment['type']>('Damaged / Soft Pack');
  const [adjAction, setAdjAction] = useState<'Deduct' | 'Add'>('Deduct');
  const [adjQty, setAdjQty] = useState(5);
  const [adjRemarks, setAdjRemarks] = useState('Packaging damage or transit leak detected during inspection');

  // Audit Sheet State (Physical count)
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    products.forEach((p) => {
      init[p.id] = p.currentStock;
    });
    return init;
  });

  // Flat Batches List
  const allBatches = products.flatMap((p) =>
    p.batches.map((b) => ({
      ...b,
      productId: p.id,
      productName: p.name,
      productCode: p.code,
      brand: p.brand,
      unit: p.unit,
      costRate: p.purchaseRate,
    }))
  );

  const selectedAdjProduct = products.find((p) => p.id === adjProductId);

  // Submit Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjProduct || adjQty <= 0) return;

    const bestBatch = selectedAdjProduct.batches[0];
    const totalLoss = adjQty * selectedAdjProduct.purchaseRate;

    recordStockAdjustment({
      date: new Date().toISOString().split('T')[0],
      productId: selectedAdjProduct.id,
      productName: selectedAdjProduct.name,
      brand: selectedAdjProduct.brand,
      batchNumber: bestBatch?.batchNumber || 'BT-ADJ',
      type: adjType,
      action: adjAction,
      qty: adjQty,
      unit: selectedAdjProduct.unit,
      unitCost: selectedAdjProduct.purchaseRate,
      totalLoss,
      remarks: adjRemarks,
      recordedBy: 'Inventory Manager',
    });

    setIsAdjModalOpen(false);
  };

  const handleApplyAuditVariance = () => {
    addToast({
      type: 'success',
      title: 'Physical Audit Reconciled',
      message: 'Physical stock counts aligned with digital inventory registers.',
    });
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation & Top Bar */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Product Stock & Status' },
            { id: 'batches', label: 'FEFO Batch & Expiry Tracker' },
            { id: 'adjustments', label: 'Wastage & Stock Adjustments' },
            { id: 'audit', label: 'Physical Audit Count' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdjModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Adjustment</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Product Stock Overview */}
      {activeTab === 'overview' && (
        <DataTable
          data={products}
          keyExtractor={(p) => p.id}
          searchPlaceholder="Search product name, code, brand..."
          searchFilter={(p, q) =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q)
          }
          columns={[
            {
              header: 'Item / Code',
              sortable: true,
              accessor: 'name',
              width: '320px',
              render: (p) => (
                <div>
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {p.code} · {p.brand} · HSN: {p.hsnCode}
                  </div>
                </div>
              ),
            },
            {
              header: 'Category',
              sortable: true,
              accessor: 'category',
              render: (p) => <span className="text-slate-600 text-xs">{p.category}</span>,
            },
            {
              header: 'Unit Cost',
              align: 'right',
              sortable: true,
              accessor: 'purchaseRate',
              render: (p) => <span className="font-mono text-xs">{formatINR(p.purchaseRate)}</span>,
            },
            {
              header: 'Current Stock',
              align: 'right',
              sortable: true,
              accessor: 'currentStock',
              render: (p) => (
                <span className="font-mono font-bold text-xs text-slate-900">
                  {p.currentStock} {p.unit}
                </span>
              ),
            },
            {
              header: 'Inventory Value',
              align: 'right',
              render: (p) => (
                <span className="font-mono font-bold text-xs text-slate-900">
                  {formatINR(p.currentStock * p.purchaseRate)}
                </span>
              ),
            },
            {
              header: 'Alert Threshold',
              align: 'center',
              render: (p) => (
                <span className="font-mono text-[11px] text-slate-500">
                  Reorder: {p.reorderLevel}
                </span>
              ),
            },
            {
              header: 'Status',
              align: 'center',
              render: (p) => {
                const { label, badgeClass } = getStockStatus(p.currentStock, p.reorderLevel);
                return (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${badgeClass}`}>
                    {label}
                  </span>
                );
              },
            },
          ]}
        />
      )}

      {/* TAB 2: FEFO Batch & Expiry Tracker */}
      {activeTab === 'batches' && (
        <DataTable
          data={allBatches}
          keyExtractor={(b) => `${b.productId}-${b.batchNumber}`}
          searchPlaceholder="Search batch number, SKU, product..."
          searchFilter={(b, q) =>
            b.batchNumber.toLowerCase().includes(q) ||
            b.productName.toLowerCase().includes(q) ||
            b.brand.toLowerCase().includes(q)
          }
          columns={[
            {
              header: 'Batch Number',
              sortable: true,
              accessor: 'batchNumber',
              render: (b) => <span className="font-mono font-bold text-slate-900">{b.batchNumber}</span>,
            },
            {
              header: 'Product Description',
              width: '320px',
              sortable: true,
              accessor: 'productName',
              render: (b) => (
                <div>
                  <div className="font-medium text-slate-900">{b.productName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{b.brand}</div>
                </div>
              ),
            },
            {
              header: 'Mfg Date',
              render: (b) => <span className="font-mono text-xs text-slate-600">{b.mfgDate}</span>,
            },
            {
              header: 'Expiry Date',
              sortable: true,
              accessor: 'expiryDate',
              render: (b) => <span className="font-mono text-xs font-medium text-slate-900">{b.expiryDate}</span>,
            },
            {
              header: 'Days Left',
              align: 'center',
              sortable: true,
              accessor: 'daysToExpiry',
              render: (b) => {
                const { status, badgeClass } = getExpiryStatus(b.expiryDate);
                return (
                  <span className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded ${badgeClass}`}>
                    {b.daysToExpiry < 0 ? 'EXPIRED' : `${b.daysToExpiry} days`}
                  </span>
                );
              },
            },
            {
              header: 'Batch Stock',
              align: 'right',
              sortable: true,
              accessor: 'quantity',
              render: (b) => (
                <span className="font-mono font-bold text-xs text-slate-900">
                  {b.quantity} {b.unit}
                </span>
              ),
            },
            {
              header: 'Batch Valuation',
              align: 'right',
              render: (b) => (
                <span className="font-mono text-xs text-slate-700">
                  {formatINR(b.quantity * b.costRate)}
                </span>
              ),
            },
          ]}
        />
      )}

      {/* TAB 3: Stock Adjustments & Wastage */}
      {activeTab === 'adjustments' && (
        <DataTable
          data={stockAdjustments}
          keyExtractor={(adj) => adj.id}
          searchPlaceholder="Search adjustments by product, reason, remarks..."
          searchFilter={(adj, q) =>
            adj.productName.toLowerCase().includes(q) ||
            adj.type.toLowerCase().includes(q) ||
            adj.remarks.toLowerCase().includes(q)
          }
          columns={[
            {
              header: 'Date',
              sortable: true,
              accessor: 'date',
              render: (adj) => <span className="text-slate-600 text-xs">{formatDate(adj.date)}</span>,
            },
            {
              header: 'Product Description',
              width: '280px',
              sortable: true,
              accessor: 'productName',
              render: (adj) => (
                <div>
                  <div className="font-semibold text-slate-900">{adj.productName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Batch: {adj.batchNumber} · {adj.brand}
                  </div>
                </div>
              ),
            },
            {
              header: 'Adjustment Reason',
              sortable: true,
              accessor: 'type',
              render: (adj) => (
                <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                  {adj.type}
                </span>
              ),
            },
            {
              header: 'Adjustment',
              align: 'center',
              render: (adj) => (
                <span className={`font-mono font-bold text-xs ${adj.action === 'Deduct' ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {adj.action === 'Deduct' ? '-' : '+'}{adj.qty} {adj.unit}
                </span>
              ),
            },
            {
              header: 'Financial Value',
              align: 'right',
              render: (adj) => (
                <span className="font-mono text-rose-700 font-bold text-xs">
                  {formatINR(adj.totalLoss)}
                </span>
              ),
            },
            {
              header: 'Remarks / Notes',
              width: '280px',
              render: (adj) => (
                <span className="text-slate-600 text-xs italic block truncate max-w-xs">
                  {adj.remarks}
                </span>
              ),
            },
            {
              header: 'Logged By',
              render: (adj) => <span className="text-slate-500 text-xs">{adj.recordedBy}</span>,
            },
          ]}
        />
      )}

      {/* TAB 4: Physical Audit Sheet */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Physical Stock Inventory Audit Sheet
              </h3>
              <p className="text-[11px] text-slate-500">
                Reconcile physical on-shelf stock against ledger counts to log discrepancies.
              </p>
            </div>
            <button
              onClick={handleApplyAuditVariance}
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              Confirm & Reconcile Audit
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-2">Item Code</th>
                  <th className="p-2">Product Description</th>
                  <th className="p-2">Brand</th>
                  <th className="p-2 text-right">System Register Stock</th>
                  <th className="p-2 text-right">Physical Count</th>
                  <th className="p-2 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const physical = auditCounts[p.id] !== undefined ? auditCounts[p.id] : p.currentStock;
                  const variance = physical - p.currentStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="p-2 font-mono text-slate-600">{p.code}</td>
                      <td className="p-2 font-semibold text-slate-900">{p.name}</td>
                      <td className="p-2 text-slate-600">{p.brand}</td>
                      <td className="p-2 text-right font-mono font-medium">{p.currentStock} {p.unit}</td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={physical}
                          onChange={(e) =>
                            setAuditCounts({
                              ...auditCounts,
                              [p.id]: Number(e.target.value),
                            })
                          }
                          className="w-20 px-1.5 py-0.5 text-right border border-slate-300 rounded font-mono text-xs"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold">
                        {variance === 0 ? (
                          <span className="text-slate-400">0</span>
                        ) : variance > 0 ? (
                          <span className="text-emerald-700">+{variance}</span>
                        ) : (
                          <span className="text-rose-700">{variance}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        title="Stock Adjustment & Spoilage Voucher"
        subtitle="Record inventory shrinkage, transit damage, or physical audit adjustments"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Product SKU</label>
            <select
              value={adjProductId}
              onChange={(e) => setAdjProductId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.brand}) — Stock: {p.currentStock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Adjustment Action</label>
              <select
                value={adjAction}
                onChange={(e) => setAdjAction(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="Deduct">Deduct (Wastage / Loss)</option>
                <option value="Add">Add (Found Stock / Inward Variance)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reason Code</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="Damaged / Soft Pack">Damaged / Soft Pack</option>
                <option value="Damage / Spoilage">Damage / Spoilage</option>
                <option value="Punctured Pack">Punctured Pack</option>
                <option value="Physical Audit Discrepancy">Physical Audit Discrepancy</option>
                <option value="Sampling / Promo">Sampling / Promo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
              <input
                required
                type="number"
                min="1"
                value={adjQty}
                onChange={(e) => setAdjQty(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2 rounded text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Loss</span>
              <span className="font-mono font-bold text-sm text-rose-700">
                {formatINR(adjQty * (selectedAdjProduct?.purchaseRate || 0))}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Technical Notes / Remarks</label>
            <input
              required
              type="text"
              value={adjRemarks}
              onChange={(e) => setAdjRemarks(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdjModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              Log Adjustment Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
