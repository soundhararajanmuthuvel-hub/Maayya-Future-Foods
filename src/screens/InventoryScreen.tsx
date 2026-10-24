import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Batch, ColdStorageZone, StockAdjustment } from '../types';
import { formatINR, formatDate, getExpiryStatus, getStockStatus } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  Warehouse,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  SlidersHorizontal,
  ClipboardList,
  Flame,
  Plus,
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const {
    products,
    stockAdjustments,
    stockTransfers,
    recordStockAdjustment,
    recordStockTransfer,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'freezers' | 'adjustments' | 'audit'>('overview');

  // Stock Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjProductId, setAdjProductId] = useState(products[0]?.id || '');
  const [adjType, setAdjType] = useState<StockAdjustment['type']>('Cold-Chain Melt');
  const [adjAction, setAdjAction] = useState<'Deduct' | 'Add'>('Deduct');
  const [adjQty, setAdjQty] = useState(5);
  const [adjRemarks, setAdjRemarks] = useState('Door seal condensation leakage caused box soft-pack');

  // Stock Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [trfProductId, setTrfProductId] = useState(products[0]?.id || '');
  const [fromZone, setFromZone] = useState<ColdStorageZone>('Freezer A (-18°C Deep Freeze)');
  const [toZone, setToZone] = useState<ColdStorageZone>('Freezer B (-22°C Hardening Room)');
  const [trfQty, setTrfQty] = useState(20);
  const [trfNotes, setTrfNotes] = useState('Re-allocating bulk party tubs prior to festival load');

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
  const selectedTrfProduct = products.find((p) => p.id === trfProductId);

  // Submit Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjProduct || adjQty <= 0) return;

    const bestBatch = selectedAdjProduct.batches[0];
    const totalLoss = adjQty * selectedAdjProduct.purchaseRate;

    recordStockAdjustment({
      date: '2026-10-23',
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
      freezerZone: selectedAdjProduct.primaryZone,
      remarks: adjRemarks,
      recordedBy: 'M. Anand (Cold-Chain Supervisor)',
    });

    setIsAdjModalOpen(false);
  };

  // Submit Transfer
  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrfProduct || trfQty <= 0) return;

    recordStockTransfer({
      date: '2026-10-23',
      productId: selectedTrfProduct.id,
      productName: selectedTrfProduct.name,
      batchNumber: selectedTrfProduct.batches[0]?.batchNumber || 'BT-TRF',
      qty: trfQty,
      fromZone,
      toZone,
      transferredBy: 'R. Soundararajan (Lead Tech)',
      notes: trfNotes,
    });

    setIsTransferModalOpen(false);
  };

  const handleApplyAuditVariance = () => {
    addToast({
      type: 'success',
      title: 'Physical Audit Reconciled',
      message: 'Physical stock counts aligned with digital inventory registers. (Demo)',
    });
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation & Top Bar */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Product Stock & Status' },
            { id: 'batches', label: 'FEFO Batch & Expiry Tracker' },
            { id: 'freezers', label: 'Freezer Chambers & Transfers' },
            { id: 'adjustments', label: 'Wastage & Adjustments' },
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
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Stock Transfer</span>
          </button>
          <button
            onClick={() => setIsAdjModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
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
              width: '280px',
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
              header: 'Chamber Location',
              render: (p) => <span className="font-mono text-slate-600">{p.primaryZone}</span>,
            },
            {
              header: 'Unit Cost',
              align: 'right',
              sortable: true,
              accessor: 'purchaseRate',
              render: (p) => <span className="font-mono">{formatINR(p.purchaseRate)}</span>,
            },
            {
              header: 'Current Stock',
              align: 'right',
              sortable: true,
              accessor: 'currentStock',
              render: (p) => (
                <span className="font-mono font-bold text-slate-900">
                  {p.currentStock} {p.unit}
                </span>
              ),
            },
            {
              header: 'Inventory Value',
              align: 'right',
              render: (p) => (
                <span className="font-mono font-bold text-slate-900">
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
              width: '280px',
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
              header: 'Chamber',
              render: (b) => <span className="font-mono text-[11px] text-slate-600">{b.location}</span>,
            },
            {
              header: 'Mfg Date',
              render: (b) => <span className="font-mono text-slate-600">{b.mfgDate}</span>,
            },
            {
              header: 'Expiry Date',
              sortable: true,
              accessor: 'expiryDate',
              render: (b) => <span className="font-mono font-medium text-slate-900">{b.expiryDate}</span>,
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
                <span className="font-mono font-bold text-slate-900">
                  {b.quantity} {b.unit}
                </span>
              ),
            },
            {
              header: 'Batch Valuation',
              align: 'right',
              render: (b) => (
                <span className="font-mono text-slate-700">
                  {formatINR(b.quantity * b.costRate)}
                </span>
              ),
            },
          ]}
        />
      )}

      {/* TAB 3: Freezer Chambers Visual & Location View */}
      {activeTab === 'freezers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Freezer A */}
            <div className="bg-white border border-slate-200/90 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-slate-900 text-xs">Freezer A (Deep Freeze)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    -18°C Zone
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <p className="text-slate-600">
                    Primary ice cream chamber for cups, cones, sticks, and family packs.
                  </p>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Capacity:</span>
                      <span className="font-bold">4,500 units</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500">Current Occupancy:</span>
                      <span className="font-bold text-sky-700">3,120 units (69%)</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Stored Brands
                    </span>
                    <p className="text-slate-700 font-medium">Amul, Kwality Wall's, Vadilal, Havmor</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setFromZone('Freezer A (-18°C Deep Freeze)');
                  setIsTransferModalOpen(true);
                }}
                className="mt-4 w-full py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Transfer Items Out →
              </button>
            </div>

            {/* Freezer B */}
            <div className="bg-white border border-slate-200/90 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-xs">Freezer B (Hardening Room)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    -22°C Zone
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <p className="text-slate-600">
                    Deep blast hardening room for 4L / 5L bulk commercial catering tubs.
                  </p>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Capacity:</span>
                      <span className="font-bold">3,000 units</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500">Current Occupancy:</span>
                      <span className="font-bold text-indigo-700">1,940 units (65%)</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Stored Brands
                    </span>
                    <p className="text-slate-700 font-medium">Kwality Bulk, Vadilal Bulk, Maya Party Tubs</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setFromZone('Freezer B (-22°C Hardening Room)');
                  setIsTransferModalOpen(true);
                }}
                className="mt-4 w-full py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Transfer Items Out →
              </button>
            </div>

            {/* Chiller C */}
            <div className="bg-white border border-slate-200/90 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-xs">Chiller C (Dairy Cold Room)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    +4°C Zone
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <p className="text-slate-600">
                    Above-freezing chiller for milk pouches, butter, vacuum paneer & curd.
                  </p>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Capacity:</span>
                      <span className="font-bold">2,500 units</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500">Current Occupancy:</span>
                      <span className="font-bold text-emerald-700">1,480 units (59%)</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Stored Brands
                    </span>
                    <p className="text-slate-700 font-medium">Amul Dairy, Maya Fresh Paneer, Fresh Milk</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setFromZone('Chiller C (+4°C Dairy Room)');
                  setIsTransferModalOpen(true);
                }}
                className="mt-4 w-full py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Transfer Items Out →
              </button>
            </div>
          </div>

          {/* Transfers History */}
          {stockTransfers.length > 0 && (
            <div className="bg-white border border-slate-200/90 rounded-lg p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Recent Cold Storage Inter-Freezer Transfers
              </h4>
              <div className="border border-slate-200 rounded overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                      <th className="p-2">Date</th>
                      <th className="p-2">Product Description</th>
                      <th className="p-2">Batch #</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2">From Chamber</th>
                      <th className="p-2">To Chamber</th>
                      <th className="p-2">Technician</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockTransfers.map((st) => (
                      <tr key={st.id}>
                        <td className="p-2 text-slate-600">{st.date}</td>
                        <td className="p-2 font-medium text-slate-900">{st.productName}</td>
                        <td className="p-2 font-mono text-slate-600">{st.batchNumber}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">{st.qty}</td>
                        <td className="p-2 font-mono text-[11px] text-slate-600">{st.fromZone}</td>
                        <td className="p-2 font-mono text-[11px] text-indigo-700 font-medium">{st.toZone}</td>
                        <td className="p-2 text-slate-500">{st.transferredBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Stock Adjustments & Wastage */}
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
              render: (adj) => <span className="text-slate-600">{formatDate(adj.date)}</span>,
            },
            {
              header: 'Product Description',
              width: '260px',
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
              header: 'Variance Reason',
              sortable: true,
              accessor: 'type',
              render: (adj) => (
                <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {adj.type}
                </span>
              ),
            },
            {
              header: 'Adjustment',
              align: 'center',
              render: (adj) => (
                <span className={`font-mono font-bold ${adj.action === 'Deduct' ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {adj.action === 'Deduct' ? '-' : '+'}{adj.qty} {adj.unit}
                </span>
              ),
            },
            {
              header: 'Financial Loss',
              align: 'right',
              render: (adj) => (
                <span className="font-mono text-rose-700 font-bold">
                  {formatINR(adj.totalLoss)}
                </span>
              ),
            },
            {
              header: 'Remarks / Findings',
              width: '260px',
              render: (adj) => (
                <span className="text-slate-600 text-xs italic block truncate max-w-xs">
                  {adj.remarks}
                </span>
              ),
            },
            {
              header: 'Auditor',
              render: (adj) => <span className="text-slate-500">{adj.recordedBy}</span>,
            },
          ]}
        />
      )}

      {/* TAB 5: Physical Audit Sheet */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Cold Storage Physical Stock Audit Sheet
              </h3>
              <p className="text-[11px] text-slate-500">
                Compare floor count against system register. Enter physical counts to compute variance.
              </p>
            </div>
            <button
              onClick={handleApplyAuditVariance}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
            >
              Post Audit Discrepancies
            </button>
          </div>

          <div className="border border-slate-200 rounded overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[580px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-2">Item Description</th>
                  <th className="p-2 font-mono">Chamber</th>
                  <th className="p-2 text-right">System Qty</th>
                  <th className="p-2 w-32 text-right">Physical Count</th>
                  <th className="p-2 text-right">Variance</th>
                  <th className="p-2 text-right">Variance Loss (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const physical = auditCounts[p.id] !== undefined ? auditCounts[p.id] : p.currentStock;
                  const diff = physical - p.currentStock;
                  const loss = Math.abs(diff) * p.purchaseRate;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2">
                        <span className="font-medium text-slate-900">{p.name}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{p.code}</div>
                      </td>
                      <td className="p-2 font-mono text-[11px] text-slate-600">{p.primaryZone}</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-800">
                        {p.currentStock} {p.unit}
                      </td>
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
                          className="w-24 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-right"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold">
                        <span
                          className={
                            diff === 0
                              ? 'text-slate-400'
                              : diff < 0
                              ? 'text-rose-700'
                              : 'text-emerald-700'
                          }
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono">
                        {diff !== 0 ? formatINR(loss) : '—'}
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
        title="Record Cold-Chain Stock Adjustment / Wastage"
        subtitle="Account for defrosting, package puncture, transit melting, or count variance"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Select Product</label>
            <select
              value={adjProductId}
              onChange={(e) => setAdjProductId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current Stock: {p.currentStock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Variance</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="Cold-Chain Melt">Cold-Chain Melt (Temp Spike)</option>
                <option value="Damage / Spoilage">Damage / Spoilage / Expired</option>
                <option value="Punctured Pack">Punctured Pack / Leakage</option>
                <option value="Physical Audit Discrepancy">Physical Audit Discrepancy</option>
                <option value="Sampling / Promo">Tasting / Sampling Demo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Direction</label>
              <select
                value={adjAction}
                onChange={(e) => setAdjAction(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="Deduct">Deduct from Stock (-)</option>
                <option value="Add">Add to Stock (+)</option>
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

      {/* Stock Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Inter-Chamber Cold Storage Stock Transfer"
        subtitle="Safely move crates between Deep Freeze (-18°C), Hardening (-22°C), and Dairy (+4°C)"
        maxWidth="md"
      >
        <form onSubmit={handleSaveTransfer} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Select Product SKU</label>
            <select
              value={trfProductId}
              onChange={(e) => setTrfProductId(e.target.value)}
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Origin Chamber (From)</label>
              <select
                value={fromZone}
                onChange={(e) => setFromZone(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="Freezer A (-18°C Deep Freeze)">Freezer A (-18°C)</option>
                <option value="Freezer B (-22°C Hardening Room)">Freezer B (-22°C)</option>
                <option value="Chiller C (+4°C Dairy Room)">Chiller C (+4°C)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Destination Chamber (To)</label>
              <select
                value={toZone}
                onChange={(e) => setToZone(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="Freezer B (-22°C Hardening Room)">Freezer B (-22°C)</option>
                <option value="Freezer A (-18°C Deep Freeze)">Freezer A (-18°C)</option>
                <option value="Chiller C (+4°C Dairy Room)">Chiller C (+4°C)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Transfer Units Qty</label>
            <input
              required
              type="number"
              min="1"
              value={trfQty}
              onChange={(e) => setTrfQty(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Transfer Reason / Log Notes</label>
            <input
              type="text"
              value={trfNotes}
              onChange={(e) => setTrfNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              Execute Stock Relocation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
