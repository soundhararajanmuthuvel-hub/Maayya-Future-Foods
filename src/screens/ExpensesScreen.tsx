import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseItem } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { StatCard } from '../components/common/StatCard';
import {
  DollarSign,
  Plus,
  Flame,
  Zap,
  Truck,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Lock,
  Trash2,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';

export const ExpensesScreen: React.FC = () => {
  const {
    expenses,
    dailyCash,
    recordExpense,
    deleteExpense,
    closeDailyCash,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'expenses' | 'cashbook' | 'closing'>('expenses');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expense form
  const [category, setCategory] = useState<ExpenseItem['category']>('Cold Storage Electricity');
  const [amount, setAmount] = useState<number>(0);
  const [paidTo, setPaidTo] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank Transfer' | 'UPI'>('Cash');
  const [description, setDescription] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

  // Daily Closing Form
  const [physicalCount, setPhysicalCount] = useState<number>(dailyCash.physicalCountCash || 0);
  const [closingNotes, setClosingNotes] = useState('');

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !paidTo.trim()) return;

    recordExpense({
      date: new Date().toISOString().split('T')[0],
      category,
      amount,
      paymentMode,
      paidTo,
      description,
      referenceNo: referenceNo || `EXP-${Date.now().toString().slice(-4)}`,
      approvedBy: 'Business Owner',
    });

    setIsAddExpenseModalOpen(false);
  };

  const handleConfirmClosing = (e: React.FormEvent) => {
    e.preventDefault();
    closeDailyCash(physicalCount, closingNotes);
    setIsClosingModalOpen(false);
  };

  const columns: Column<ExpenseItem>[] = [
    {
      header: 'Voucher #',
      sortable: true,
      accessor: 'voucherNo',
      render: (e) => <span className="font-mono font-bold text-slate-900">{e.voucherNo}</span>,
    },
    {
      header: 'Date',
      sortable: true,
      accessor: 'date',
      render: (e) => <span className="text-slate-600">{formatDate(e.date)}</span>,
    },
    {
      header: 'Expense Category',
      sortable: true,
      accessor: 'category',
      render: (e) => (
        <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {e.category}
        </span>
      ),
    },
    {
      header: 'Beneficiary / Payee',
      sortable: true,
      accessor: 'paidTo',
      render: (e) => (
        <div>
          <span className="font-semibold text-slate-900">{e.paidTo}</span>
          <div className="text-[11px] text-slate-500 truncate max-w-xs">{e.description}</div>
        </div>
      ),
    },
    {
      header: 'Payment Mode',
      sortable: true,
      accessor: 'paymentMode',
      render: (e) => (
        <span className="font-mono text-xs text-slate-600">{e.paymentMode}</span>
      ),
    },
    {
      header: 'Amount Paid',
      align: 'right',
      sortable: true,
      accessor: 'amount',
      render: (e) => (
        <span className="font-mono font-bold text-rose-700">{formatINR(e.amount, true)}</span>
      ),
    },
    {
      header: 'Approved By',
      render: (e) => <span className="text-slate-500">{e.approvedBy}</span>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <div className="flex items-center justify-end" onClick={(ev) => ev.stopPropagation()}>
          <button
            onClick={() => setExpenseToDelete(e)}
            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
            title={`Delete ${e.voucherNo}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Navigation Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'expenses', label: 'Cold-Chain Operating Expenses' },
            { id: 'cashbook', label: 'Cash & Bank Register' },
            { id: 'closing', label: 'Daily Cash Closing & Drawer' },
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
            onClick={() => setIsClosingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Daily Cash Closing</span>
          </button>
          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Expense Voucher</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Expenses List */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard
              label="Cold Storage Electricity"
              value={formatINR(38400)}
              subValue="HT Power Tariff 33kV"
              icon={<Zap className="w-4 h-4 text-amber-600" />}
            />
            <StatCard
              label="DG Generator Fuel"
              value={formatINR(3200)}
              subValue="Backup Power (Power cut)"
              icon={<Flame className="w-4 h-4 text-rose-600" />}
            />
            <StatCard
              label="Van Fuel & Dry Ice"
              value={formatINR(4250)}
              subValue="Cold logistics delivery"
              icon={<Truck className="w-4 h-4 text-indigo-600" />}
            />
            <StatCard
              label="Compressor Maintenance"
              value={formatINR(4800)}
              subValue="R404A Freon refill"
              icon={<Wrench className="w-4 h-4 text-slate-600" />}
            />
          </div>

          <DataTable
            data={expenses}
            columns={columns}
            keyExtractor={(e) => e.id}
            searchPlaceholder="Search expense voucher, payee, category..."
            searchFilter={(e, q) =>
              e.voucherNo.toLowerCase().includes(q) ||
              e.category.toLowerCase().includes(q) ||
              e.paidTo.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q)
            }
          />
        </div>
      )}

      {/* TAB 2: Cash & Bank Book */}
      {activeTab === 'cashbook' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Cash in Office Safe / Drawer
              </span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                {formatINR(dailyCash.physicalCountCash)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Physical liquid counter cash</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                HDFC Current Bank Account (5020...)
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {formatINR(342800)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">UPI, RTGS & Cheques clearing balance</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Liquid Liquidity
              </span>
              <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                {formatINR(dailyCash.physicalCountCash + 342800)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Ready working capital</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-lg p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Today's Cash Ledger Transactions (2026-10-23)
            </h3>
            <div className="border border-slate-200 rounded overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                    <th className="p-2">Description / Transaction</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-right">Debit (Inflow)</th>
                    <th className="p-2 text-right">Credit (Outflow)</th>
                    <th className="p-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  <tr>
                    <td className="p-2 font-sans font-medium text-slate-900">Morning Opening Cash Balance</td>
                    <td className="p-2 text-slate-500 font-sans">Opening</td>
                    <td className="p-2 text-right text-emerald-700">{formatINR(dailyCash.openingCash, true)}</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatINR(dailyCash.openingCash, true)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-medium text-slate-900">Direct Walk-In POS Cash Collections</td>
                    <td className="p-2 text-slate-500 font-sans">Sales</td>
                    <td className="p-2 text-right text-emerald-700">{formatINR(dailyCash.cashSales, true)}</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                    <td className="p-2 text-right font-bold text-slate-900">
                      {formatINR(dailyCash.openingCash + dailyCash.cashSales, true)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-medium text-slate-900">Van Route 1 & 2 Shop Collections (Cash)</td>
                    <td className="p-2 text-slate-500 font-sans">Receivables</td>
                    <td className="p-2 text-right text-emerald-700">{formatINR(dailyCash.cashCollectionsFromShops, true)}</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                    <td className="p-2 text-right font-bold text-slate-900">
                      {formatINR(dailyCash.openingCash + dailyCash.cashSales + dailyCash.cashCollectionsFromShops, true)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-medium text-slate-900">Diesel Generator Fuel + Dry Ice Purchases</td>
                    <td className="p-2 text-slate-500 font-sans">Expense</td>
                    <td className="p-2 text-right text-slate-400">—</td>
                    <td className="p-2 text-right text-rose-700">{formatINR(dailyCash.cashExpenses, true)}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatINR(dailyCash.expectedCashInDrawer, true)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Daily Closing Drawer Summary */}
      {activeTab === 'closing' && (
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Cash Closing & Drawer Audit</h3>
              <p className="text-xs text-slate-500">Date: 23-Oct-2026 · Shift: Morning to Evening</p>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                dailyCash.isClosed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {dailyCash.isClosed ? 'SHIFT CLOSED & LOCKED' : 'SHIFT IN PROGRESS'}
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-slate-600 font-sans">Opening Cash:</span>
              <span className="font-bold text-slate-900">{formatINR(dailyCash.openingCash, true)}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-slate-600 font-sans">(+) Cash Sales from Direct POS:</span>
              <span className="font-bold text-emerald-700">+{formatINR(dailyCash.cashSales, true)}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-slate-600 font-sans">(+) Cash Collections from Retail Shops:</span>
              <span className="font-bold text-emerald-700">+{formatINR(dailyCash.cashCollectionsFromShops, true)}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-slate-600 font-sans">(-) Cash Vouchers & Fuel Expenses:</span>
              <span className="font-bold text-rose-700">-{formatINR(dailyCash.cashExpenses, true)}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-100 border border-slate-200 rounded text-sm font-bold">
              <span className="font-sans">Expected Closing Cash in Register:</span>
              <span className="text-slate-950">{formatINR(dailyCash.expectedCashInDrawer, true)}</span>
            </div>
            <div className="flex justify-between p-3 bg-emerald-50 border border-emerald-200 rounded text-sm font-bold">
              <span className="font-sans">Physical Verified Cash Count:</span>
              <span className="text-emerald-800">{formatINR(dailyCash.physicalCountCash, true)}</span>
            </div>
            <div className="flex justify-between p-2 text-xs">
              <span className="font-sans text-slate-500">Closing Variance:</span>
              <span className={dailyCash.variance === 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                {dailyCash.variance === 0 ? '₹0.00 (Perfect Match)' : formatINR(dailyCash.variance, true)}
              </span>
            </div>
          </div>

          {dailyCash.closingNotes && (
            <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded border border-slate-200">
              Audit Notes: {dailyCash.closingNotes}
            </p>
          )}

          {!dailyCash.isClosed && (
            <button
              onClick={() => setIsClosingModalOpen(true)}
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Perform End-of-Day Register Closing</span>
            </button>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        title="Log Operational Cold-Chain Expense Voucher"
        subtitle="Record expenses for electricity, DG set diesel, reefer van fuel & repairs"
        maxWidth="md"
      >
        <form onSubmit={handleSaveExpense} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
            >
              <option value="Cold Storage Electricity">Cold Storage Electricity (HT Bill)</option>
              <option value="Diesel Generator Fuel">Diesel Generator Fuel (35kVA DG)</option>
              <option value="Warehouse & Equipment Maintenance">Warehouse & Equipment Maintenance</option>
              <option value="Dry Ice & Gel Packs">Dry Ice & Gel Packs (Transit Cold)</option>
              <option value="Delivery Vehicle Diesel">Delivery Vehicle Diesel</option>
              <option value="Packaging & Insulated Thermocol">Packaging & Insulated Thermocol</option>
              <option value="Staff Salaries & Overtime">Staff Salaries & Overtime</option>
              <option value="Shop Rent & Warehouse Taxes">Shop Rent & Warehouse Taxes</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Amount (₹)</label>
              <input
                required
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="Cash">Cash Drawer</option>
                <option value="UPI">Corporate UPI QR</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Paid To / Vendor Name</label>
            <input
              required
              type="text"
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Expense Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddExpenseModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              Log Expense Voucher
            </button>
          </div>
        </form>
      </Modal>

      {/* Daily Closing Dialog */}
      <Modal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        title="End-of-Day Cash Drawer Closing"
        subtitle="Count currency notes in register and reconcile against daily billing register"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmClosing} className="space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
            <div className="flex justify-between font-mono">
              <span className="text-slate-500 font-sans">System Expected Balance:</span>
              <span className="font-bold text-slate-900">{formatINR(dailyCash.expectedCashInDrawer, true)}</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Opening (₹{dailyCash.openingCash}) + POS (₹{dailyCash.cashSales}) + Collections (₹{dailyCash.cashCollectionsFromShops}) - Expenses (₹{dailyCash.cashExpenses})
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Physical Cash Count in Drawer (₹)
            </label>
            <input
              required
              type="number"
              value={physicalCount}
              onChange={(e) => setPhysicalCount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded text-slate-900"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate-500">Variance:</span>
              <span className={`font-mono font-bold ${physicalCount === dailyCash.expectedCashInDrawer ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatINR(physicalCount - dailyCash.expectedCashInDrawer, true)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Supervisor Notes</label>
            <textarea
              rows={2}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsClosingModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              Confirm & Lock Daily Closing
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Expense Modal */}
      {expenseToDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(expenseToDelete)}
          onClose={() => setExpenseToDelete(null)}
          title="Delete Expense Voucher"
          recordType="Expense Voucher"
          recordName={`${expenseToDelete.voucherNo} (${expenseToDelete.category})`}
          details={`Amount: ${formatINR(expenseToDelete.amount, true)} · Payee: ${expenseToDelete.paidTo} · Mode: ${expenseToDelete.paymentMode}`}
          warningNote={
            expenseToDelete.paymentMode === 'Cash'
              ? 'Deleting this cash expense will automatically reverse the deduction and restore the drawer cash balance in PostgreSQL.'
              : undefined
          }
          isProcessing={isDeleting}
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              await deleteExpense(expenseToDelete.id);
              setExpenseToDelete(null);
            } finally {
              setIsDeleting(false);
            }
          }}
        />
      )}
    </div>
  );
};
