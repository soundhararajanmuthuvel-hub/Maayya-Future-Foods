import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RetailShop, Invoice } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  Store,
  Plus,
  DollarSign,
  AlertTriangle,
  Receipt,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  Ban,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

export const ShopsScreen: React.FC = () => {
  const {
    shops,
    invoices,
    shopPayments,
    selectedShopId,
    setSelectedShopId,
    addShop,
    updateShop,
    recordShopPayment,
    setPrintableInvoice,
    addToast,
    companyInfo,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<RetailShop | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetShop, setPaymentTargetShop] = useState<RetailShop | null>(null);

  // WhatsApp Reminder State
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [whatsappTargetShop, setWhatsappTargetShop] = useState<RetailShop | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappPhoneError, setWhatsappPhoneError] = useState('');

  // Shop Form state
  const [shopForm, setShopForm] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    gstin: '',
    address: '',
    routeArea: 'Route 1: Anna Nagar - Kilpauk',
    creditLimit: 100000,
    creditDays: 14,
  });

  // Payment Form state
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Cheque' | 'Bank Transfer'>('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const selectedShop = shops.find((s) => s.id === selectedShopId);
  const shopInvoices = selectedShop
    ? invoices.filter((i) => i.shopId === selectedShop.id)
    : [];
  const shopPaymentsList = selectedShop
    ? shopPayments.filter((p) => p.shopId === selectedShop.id)
    : [];

  const handleOpenAddShop = () => {
    setEditingShop(null);
    setShopForm({
      shopName: '',
      ownerName: '',
      phone: '+91 98',
      gstin: '33AABCS',
      address: '',
      routeArea: 'Route 1: Anna Nagar - Kilpauk',
      creditLimit: 100000,
      creditDays: 14,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditShop = (s: RetailShop) => {
    setEditingShop(s);
    setShopForm({
      shopName: s.shopName,
      ownerName: s.ownerName,
      phone: s.phone,
      gstin: s.gstin || '',
      address: s.address,
      routeArea: s.routeArea,
      creditLimit: s.creditLimit,
      creditDays: s.creditDays,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopForm.shopName.trim()) return;

    if (editingShop) {
      updateShop({
        ...editingShop,
        ...shopForm,
      });
    } else {
      addShop({
        ...shopForm,
        outstandingAmount: 0,
        overdueAmount: 0,
        status: 'Active',
      });
    }
    setIsAddModalOpen(false);
  };

  const handleOpenPayment = (shop: RetailShop) => {
    setPaymentTargetShop(shop);
    setPayAmount(shop.outstandingAmount);
    setPayRef(`UPI-${Date.now().toString().slice(-6)}`);
    setPayNotes(`Collections against unpaid invoices for ${shop.shopName}`);
    setIsPaymentModalOpen(true);
  };

  const handleOpenWhatsappReminder = (shop: RetailShop) => {
    setWhatsappTargetShop(shop);
    setWhatsappPhone(shop.phone || '');
    setWhatsappPhoneError('');

    // Fetch unpaid bills for this shop
    const unpaidInvoices = invoices.filter(
      (inv) =>
        inv.shopId === shop.id &&
        inv.balanceAmount > 0 &&
        inv.paymentStatus !== 'Cancelled'
    );

    const invoiceSummaryLines = unpaidInvoices.map(
      (inv) => `• Bill ${inv.invoiceNumber} (${formatDate(inv.date)}): ₹${inv.balanceAmount.toLocaleString('en-IN')}`
    );

    const invoiceListText = invoiceSummaryLines.length > 0 ? invoiceSummaryLines.join('\n') : '';

    const defaultTpl =
      companyInfo.whatsappReminderTemplate ||
      'Hello [Shop Name], this is a payment reminder from Maayya Future Foods. Your outstanding balance is ₹[Outstanding Amount]. Please review your pending bills and arrange payment when convenient. Thank you.';

    let formatted = defaultTpl
      .replace(/\[Shop Name\]/g, shop.shopName)
      .replace(/\[Outstanding Amount\]/g, shop.outstandingAmount.toLocaleString('en-IN'));

    if (invoiceListText) {
      formatted += `\n\nPending Invoices:\n${invoiceListText}`;
    }

    if (companyInfo.upiId) {
      formatted += `\n\nUPI Payment ID: ${companyInfo.upiId}`;
    }

    setWhatsappMessage(formatted);
    setIsWhatsappModalOpen(true);
  };

  const handleSendWhatsapp = () => {
    const rawPhone = whatsappPhone.trim().replace(/[^\d+]/g, '');
    let cleanPhone = rawPhone.replace(/\+/g, '');

    // India standard mobile number formatting
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      setWhatsappPhoneError('Please enter a valid 10-digit mobile number with country code (e.g., +91 98400 12345).');
      return;
    }

    setWhatsappPhoneError('');
    const encodedMsg = encodeURIComponent(whatsappMessage);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

    // Open WhatsApp in a new tab without claiming delivery
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    addToast({
      type: 'info',
      title: 'WhatsApp Launched',
      message: `Opening WhatsApp chat with ${whatsappTargetShop?.shopName}. Please review and send in WhatsApp.`,
    });

    setIsWhatsappModalOpen(false);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetShop || payAmount <= 0) return;

    // Find unpaid/partial invoices for this shop
    const unpaidInvoices = invoices.filter(
      (inv) =>
        inv.shopId === paymentTargetShop.id &&
        inv.balanceAmount > 0 &&
        inv.paymentStatus !== 'Cancelled'
    );

    let remainingToAllocate = payAmount;
    const allocated: { invoiceNumber: string; allocatedAmount: number }[] = [];

    for (const inv of unpaidInvoices) {
      if (remainingToAllocate <= 0) break;
      const alloc = Math.min(inv.balanceAmount, remainingToAllocate);
      allocated.push({
        invoiceNumber: inv.invoiceNumber,
        allocatedAmount: alloc,
      });
      remainingToAllocate -= alloc;
    }

    recordShopPayment({
      date: '2026-10-23',
      shopId: paymentTargetShop.id,
      shopName: paymentTargetShop.shopName,
      amount: payAmount,
      mode: payMode,
      referenceNo: payRef,
      allocatedInvoices: allocated,
      notes: payNotes,
    });

    setIsPaymentModalOpen(false);
  };

  const handleSimulatePrintStatement = () => {
    if (!selectedShop) return;
    window.print();
    addToast({
      type: 'info',
      title: 'Statement Printed',
      message: `Account ledger statement generated for ${selectedShop.shopName}.`,
    });
  };

  const columns: Column<RetailShop>[] = [
    {
      header: 'Code / Shop Name',
      sortable: true,
      accessor: 'shopName',
      width: '280px',
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-900">{s.shopName}</div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
            <span>{s.code}</span>
            <span>·</span>
            <span className="font-sans text-slate-600">{s.ownerName}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Delivery Route',
      sortable: true,
      accessor: 'routeArea',
      render: (s) => <span className="text-slate-600 truncate max-w-xs block">{s.routeArea}</span>,
    },
    {
      header: 'Credit Limit',
      align: 'right',
      sortable: true,
      accessor: 'creditLimit',
      render: (s) => <span className="font-mono">{formatINR(s.creditLimit)}</span>,
    },
    {
      header: 'Outstanding Due',
      align: 'right',
      sortable: true,
      accessor: 'outstandingAmount',
      render: (s) => {
        const utilPercent = (s.outstandingAmount / s.creditLimit) * 100;
        return (
          <div>
            <span className={`font-mono font-bold ${s.outstandingAmount > s.creditLimit ? 'text-rose-700' : 'text-slate-900'}`}>
              {formatINR(s.outstandingAmount)}
            </span>
            <div className="text-[10px] text-slate-400 font-mono">
              {utilPercent.toFixed(0)}% limit
            </div>
          </div>
        );
      },
    },
    {
      header: 'Overdue',
      align: 'right',
      sortable: true,
      accessor: 'overdueAmount',
      render: (s) => (
        <span className={`font-mono ${s.overdueAmount > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'}`}>
          {formatINR(s.overdueAmount)}
        </span>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      render: (s) => (
        <StatusBadge
          label={s.status}
          variant={s.status === 'Active' ? 'success' : s.status === 'Warning' ? 'warning' : 'danger'}
        />
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenWhatsappReminder(s)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
            title={`Send WhatsApp payment reminder to ${s.shopName}`}
          >
            <MessageSquare className="w-3 h-3 text-emerald-600" />
            <span>Reminder</span>
          </button>
          <button
            onClick={() => handleOpenPayment(s)}
            className="px-2 py-1 text-[11px] font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors"
          >
            Receive ₹
          </button>
          <button
            onClick={() => setSelectedShopId(s.id)}
            className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            Ledger
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Route & Credit Overview Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Receivables Outstanding
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatINR(shops.reduce((sum, s) => sum + s.outstandingAmount, 0))}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Across 8 active distribution retail outlets
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
            Overdue Balance (&gt; Credit Days)
          </span>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">
            {formatINR(shops.reduce((sum, s) => sum + s.overdueAmount, 0))}
          </div>
          <div className="text-xs text-rose-600 mt-0.5">
            Requires route collection team follow-up
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Accounts In Credit Risk / Blocked
          </span>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            {shops.filter((s) => s.status !== 'Active').length} Shops
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Credit limits exceeded: Om Sai Daily Mart (Blocked)
          </div>
        </div>
      </div>

      {/* Main Shops Table */}
      <DataTable
        data={shops}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search shop name, owner, area, GSTIN..."
        searchFilter={(s, q) =>
          s.shopName.toLowerCase().includes(q) ||
          s.ownerName.toLowerCase().includes(q) ||
          s.routeArea.toLowerCase().includes(q) ||
          (s.gstin ? s.gstin.toLowerCase().includes(q) : false)
        }
        onRowClick={(s) => setSelectedShopId(s.id)}
        actions={
          <button
            onClick={handleOpenAddShop}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Retail Shop</span>
          </button>
        }
      />

      {/* Shop Detail & Ledger Modal */}
      {selectedShop && (
        <Modal
          isOpen={!!selectedShop}
          onClose={() => setSelectedShopId(null)}
          title={`Shop Ledger: ${selectedShop.shopName}`}
          subtitle={`${selectedShop.ownerName} · Phone: ${selectedShop.phone} · ${selectedShop.routeArea}`}
          maxWidth="3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={handleSimulatePrintStatement}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ledger Statement</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenWhatsappReminder(selectedShop)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Reminder</span>
                </button>
                <button
                  onClick={() => handleOpenPayment(selectedShop)}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                >
                  Receive Payment (₹)
                </button>
                <button
                  onClick={() => setSelectedShopId(null)}
                  className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Credit Limit & Outstanding Meter */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Credit Limit</span>
                <p className="text-base font-bold text-slate-900 font-mono">
                  {formatINR(selectedShop.creditLimit)}
                </p>
                <span className="text-[10px] text-slate-400">{selectedShop.creditDays} days cycle</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Current Outstanding</span>
                <p className="text-base font-bold text-slate-900 font-mono">
                  {formatINR(selectedShop.outstandingAmount)}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  {((selectedShop.outstandingAmount / selectedShop.creditLimit) * 100).toFixed(0)}% utilized
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Overdue Amount</span>
                <p className={`text-base font-bold font-mono ${selectedShop.overdueAmount > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                  {formatINR(selectedShop.overdueAmount)}
                </p>
                <span className="text-[10px] text-rose-600">Immediate attention</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Account Status</span>
                <div className="mt-1">
                  <StatusBadge
                    label={selectedShop.status}
                    variant={selectedShop.status === 'Active' ? 'success' : selectedShop.status === 'Warning' ? 'warning' : 'danger'}
                  />
                </div>
              </div>
            </div>

            {/* Invoices History for this shop */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Billed Invoices History
              </h4>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Due Date</th>
                      <th className="p-2 text-right">Grand Total</th>
                      <th className="p-2 text-right">Paid</th>
                      <th className="p-2 text-right">Balance Due</th>
                      <th className="p-2 text-center">Status</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shopInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400">
                          No invoices recorded yet for this shop.
                        </td>
                      </tr>
                    ) : (
                      shopInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-medium text-slate-900">{inv.invoiceNumber}</td>
                          <td className="p-2 text-slate-600">{formatDate(inv.date)}</td>
                          <td className="p-2 text-slate-600">{formatDate(inv.dueDate)}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatINR(inv.grandTotal, true)}
                          </td>
                          <td className="p-2 text-right font-mono text-emerald-700">
                            {formatINR(inv.paidAmount, true)}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-800">
                            {formatINR(inv.balanceAmount, true)}
                          </td>
                          <td className="p-2 text-center">
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
                          <td className="p-2 text-right">
                            <button
                              onClick={() => setPrintableInvoice(inv)}
                              className="text-[11px] text-slate-700 hover:text-slate-950 font-medium underline"
                            >
                              View Tax Bill
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments Receipt History */}
            {shopPaymentsList.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Payments Received Ledger
                </h4>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                        <th className="p-2">Receipt #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Mode</th>
                        <th className="p-2">Reference</th>
                        <th className="p-2 text-right">Amount Credited</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shopPaymentsList.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2 font-mono font-medium text-slate-900">{p.receiptNo}</td>
                          <td className="p-2 text-slate-600">{formatDate(p.date)}</td>
                          <td className="p-2 text-slate-700">{p.mode}</td>
                          <td className="p-2 font-mono text-slate-500">{p.referenceNo || '—'}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">
                            {formatINR(p.amount, true)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Receive Payment Modal */}
      {paymentTargetShop && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Receive Payment from ${paymentTargetShop.shopName}`}
          subtitle={`Current Outstanding: ${formatINR(paymentTargetShop.outstandingAmount)} · Route: ${paymentTargetShop.routeArea}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Receipt Amount (₹)
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded text-slate-900"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Full or partial collection will be automatically credited across pending invoices.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                  <option value="Cash">Cash (Van Collection)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reference / UTR #</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Remarks</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
              >
                Confirm Payment Credit (Demo)
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Shop Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingShop ? `Edit ${editingShop.shopName}` : 'Register New Retail Shop'}
        subtitle="Distribution route partner master record"
        maxWidth="md"
      >
        <form onSubmit={handleSaveShop} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Shop / Outlet Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Royal Sweets & Ice Cream Parlor"
              value={shopForm.shopName}
              onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Owner / Contact Name</label>
              <input
                required
                type="text"
                value={shopForm.ownerName}
                onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                required
                type="text"
                value={shopForm.phone}
                onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="33AABCS..."
                value={shopForm.gstin}
                onChange={(e) => setShopForm({ ...shopForm, gstin: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Route Area</label>
              <select
                value={shopForm.routeArea}
                onChange={(e) => setShopForm({ ...shopForm, routeArea: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="Route 1: Anna Nagar - Kilpauk">Route 1: Anna Nagar - Kilpauk</option>
                <option value="Route 2: T. Nagar - Kodambakkam">Route 2: T. Nagar - Kodambakkam</option>
                <option value="Route 3: Velachery - OMR Hub">Route 3: Velachery - OMR Hub</option>
                <option value="Route 4: Adyar - Thiruvanmiyur">Route 4: Adyar - Thiruvanmiyur</option>
                <option value="Route 5: Mylapore - Mandaveli">Route 5: Mylapore - Mandaveli</option>
                <option value="Route 6: Chromepet - Tambaram">Route 6: Chromepet - Tambaram</option>
                <option value="Route 7: Porur - Ramapuram">Route 7: Porur - Ramapuram</option>
                <option value="Route 8: Guindy - Saidapet">Route 8: Guindy - Saidapet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Shop Address</label>
            <textarea
              rows={2}
              value={shopForm.address}
              onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                value={shopForm.creditLimit}
                onChange={(e) => setShopForm({ ...shopForm, creditLimit: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Credit Days</label>
              <input
                type="number"
                value={shopForm.creditDays}
                onChange={(e) => setShopForm({ ...shopForm, creditDays: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              {editingShop ? 'Save Changes' : 'Register Shop'}
            </button>
          </div>
        </form>
      </Modal>

      {/* WhatsApp Payment Reminder Review & Send Modal */}
      {isWhatsappModalOpen && whatsappTargetShop && (
        <Modal
          isOpen={isWhatsappModalOpen}
          onClose={() => setIsWhatsappModalOpen(false)}
          title={`WhatsApp Payment Reminder — ${whatsappTargetShop.shopName}`}
          subtitle="Review and edit the message before launching WhatsApp. Never sends without your explicit action."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-500">
                Opens directly in official <strong className="text-emerald-700">WhatsApp</strong> application.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWhatsappModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsapp}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open WhatsApp & Review</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-3.5">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded text-xs text-emerald-900 flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Owner Review Before Sending</span>
                <span className="text-[11px] text-emerald-800">
                  You can personalize the message text or adjust the recipient phone number below. WhatsApp will open with this message prefilled.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipient WhatsApp Phone Number
              </label>
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => {
                  setWhatsappPhone(e.target.value);
                  setWhatsappPhoneError('');
                }}
                className={`w-full px-3 py-2 text-xs border rounded font-mono ${
                  whatsappPhoneError
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-500'
                    : 'border-slate-300 text-slate-900 focus:ring-slate-900'
                }`}
                placeholder="+91 98400 12345"
              />
              {whatsappPhoneError ? (
                <p className="text-[11px] text-rose-600 mt-1">{whatsappPhoneError}</p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1">
                  Stored contact phone for {whatsappTargetShop.ownerName} ({whatsappTargetShop.shopName}).
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Message Content (Editable)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {whatsappMessage.length} characters
                </span>
              </div>
              <textarea
                rows={7}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded font-sans text-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
