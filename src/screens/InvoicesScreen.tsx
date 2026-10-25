import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  FileText,
  Printer,
  Ban,
  RotateCcw,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Trash2,
  RotateCw,
} from 'lucide-react';

export const InvoicesScreen: React.FC = () => {
  const {
    invoices,
    selectedInvoiceId,
    setSelectedInvoiceId,
    setPrintableInvoice,
    cancelInvoice,
    reloadWorkspaceFromBackend,
    addToast,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'All' && inv.paymentStatus !== statusFilter) return false;
    if (typeFilter !== 'All' && inv.type !== typeFilter) return false;
    return true;
  });

  const handleOpenCancel = (inv: Invoice) => {
    setCancellingInvoice(inv);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingInvoice || !cancelReason.trim()) return;

    setIsCancelling(true);
    try {
      await cancelInvoice(cancellingInvoice.id, cancelReason);
      setIsCancelModalOpen(false);
      setCancellingInvoice(null);
    } finally {
      setIsCancelling(false);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      sortable: true,
      accessor: 'invoiceNumber',
      render: (inv) => (
        <div>
          <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
          <div className="text-[10px] text-slate-400 font-mono">Billed: {formatDate(inv.date)}</div>
        </div>
      ),
    },
    {
      header: 'Customer / Shop',
      sortable: true,
      accessor: 'shopName',
      width: '260px',
      render: (inv) => (
        <div>
          <div className="font-semibold text-slate-900 truncate max-w-xs">{inv.shopName}</div>
          <div className="text-[10px] text-slate-500 flex items-center gap-2">
            <span>{inv.type}</span>
            {inv.paymentMode && (
              <>
                <span>·</span>
                <span>{inv.paymentMode}</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Due Date',
      sortable: true,
      accessor: 'dueDate',
      render: (inv) => <span className="text-slate-600">{formatDate(inv.dueDate)}</span>,
    },
    {
      header: 'Grand Total',
      align: 'right',
      sortable: true,
      accessor: 'grandTotal',
      render: (inv) => (
        <span className={`font-mono font-bold ${inv.paymentStatus === 'Cancelled' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
          {formatINR(inv.grandTotal, true)}
        </span>
      ),
    },
    {
      header: 'Paid Amount',
      align: 'right',
      sortable: true,
      accessor: 'paidAmount',
      render: (inv) => (
        <span className="font-mono text-emerald-700 font-medium">
          {formatINR(inv.paidAmount, true)}
        </span>
      ),
    },
    {
      header: 'Balance Due',
      align: 'right',
      sortable: true,
      accessor: 'balanceAmount',
      render: (inv) => (
        <span className={`font-mono ${inv.balanceAmount > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'}`}>
          {formatINR(inv.balanceAmount, true)}
        </span>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      render: (inv) => (
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
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (inv) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setPrintableInvoice(inv)}
            className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            Print
          </button>
          {inv.paymentStatus !== 'Cancelled' && (
            <button
              onClick={() => handleOpenCancel(inv)}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Void / Cancel Invoice & Reverse Stock"
              aria-label={`Void invoice ${inv.invoiceNumber}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Buttons */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {['All', 'Paid', 'Partial', 'Unpaid', 'Overdue', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Type:
          </span>
          {['All', 'Retail Wholesale', 'Direct POS'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                typeFilter === type
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Invoices Table */}
      <DataTable
        data={filteredInvoices}
        columns={columns}
        keyExtractor={(inv) => inv.id}
        searchPlaceholder="Search invoice #, customer name, date..."
        searchFilter={(inv, q) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.shopName.toLowerCase().includes(q) ||
          inv.date.includes(q)
        }
        onRowClick={(inv) => setPrintableInvoice(inv)}
      />

      {/* Invoice Cancellation Modal (Mandatory audit reversal) */}
      {cancellingInvoice && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title={`Cancel & Reverse Invoice: ${cancellingInvoice.invoiceNumber}`}
          subtitle={`Customer: ${cancellingInvoice.shopName} · Total: ${formatINR(cancellingInvoice.grandTotal)}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmCancel} className="space-y-3">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900 text-xs">
              <span className="font-bold uppercase tracking-wider block mb-1">
                Cold-Chain Audit Reversal Policy
              </span>
              <p>
                In compliance with strict accounting standards, invoices are never silently deleted.
                Cancelling this invoice will record a reversal credit voucher, restore{' '}
                {cancellingInvoice.items.reduce((s, i) => s + i.qty, 0)} units to cold storage inventory,
                and update customer ledger.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mandatory Reason for Cancellation
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Retailer rejected consignment; delivery slip duplicated; billing error..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded disabled:opacity-50"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={isCancelling}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCancelling ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isCancelling ? 'Processing Reversal...' : 'Confirm Cancellation & Reverse Stock'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
