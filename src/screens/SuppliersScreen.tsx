import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Supplier } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import {
  Building2,
  Plus,
  Truck,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileCheck,
} from 'lucide-react';

export const SuppliersScreen: React.FC = () => {
  const {
    suppliers,
    purchases,
    supplierPayments,
    selectedSupplierId,
    setSelectedSupplierId,
    addSupplier,
    updateSupplier,
    recordSupplierPayment,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTargetSupplier, setPayTargetSupplier] = useState<Supplier | null>(null);

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    city: '',
    address: '',
    paymentTermsDays: 15,
    leadTimeDays: 2,
  });

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'NEFT / RTGS' | 'Cheque' | 'UPI'>('NEFT / RTGS');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);
  const supplierPurchases = selectedSupplier
    ? purchases.filter((p) => p.supplierId === selectedSupplier.id)
    : [];
  const supplierPaymentsList = selectedSupplier
    ? supplierPayments.filter((p) => p.supplierId === selectedSupplier.id)
    : [];

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '+91 98',
      email: '',
      gstin: '33AAAC',
      city: 'Chennai',
      address: '',
      paymentTermsDays: 15,
      leadTimeDays: 2,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email,
      gstin: sup.gstin,
      city: sup.city,
      address: sup.address,
      paymentTermsDays: sup.paymentTermsDays,
      leadTimeDays: sup.leadTimeDays,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;

    if (editingSupplier) {
      updateSupplier({
        ...editingSupplier,
        ...supplierForm,
      });
    } else {
      addSupplier({
        ...supplierForm,
        outstandingPayable: 0,
        totalPurchases: 0,
      });
    }
    setIsAddModalOpen(false);
  };

  const handleOpenPay = (sup: Supplier) => {
    setPayTargetSupplier(sup);
    setPaymentAmount(sup.outstandingPayable);
    setPaymentRef(`NEFT-${Date.now().toString().slice(-6)}`);
    setPaymentNotes(`Payment for cold storage goods inward`);
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTargetSupplier || paymentAmount <= 0) return;

    recordSupplierPayment({
      date: '2026-10-23',
      supplierId: payTargetSupplier.id,
      supplierName: payTargetSupplier.name,
      amount: paymentAmount,
      mode: paymentMode,
      referenceNo: paymentRef,
      notes: paymentNotes,
    });

    setIsPayModalOpen(false);
  };

  const columns: Column<Supplier>[] = [
    {
      header: 'Supplier / Company',
      sortable: true,
      accessor: 'name',
      width: '300px',
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-900">{s.name}</div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
            <span>{s.code}</span>
            <span>·</span>
            <span className="font-sans text-slate-600">{s.contactPerson}</span>
            <span>·</span>
            <span>GSTIN: {s.gstin}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Hub / City',
      sortable: true,
      accessor: 'city',
      render: (s) => <span className="text-slate-600">{s.city}</span>,
    },
    {
      header: 'Terms',
      align: 'center',
      render: (s) => (
        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {s.paymentTermsDays} Days
        </span>
      ),
    },
    {
      header: 'Total Volume',
      align: 'right',
      sortable: true,
      accessor: 'totalPurchases',
      render: (s) => <span className="font-mono text-slate-700">{formatINR(s.totalPurchases)}</span>,
    },
    {
      header: 'Outstanding Payable',
      align: 'right',
      sortable: true,
      accessor: 'outstandingPayable',
      render: (s) => (
        <span className={`font-mono font-bold ${s.outstandingPayable > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
          {formatINR(s.outstandingPayable)}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenPay(s)}
            className="px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
          >
            Pay Vendor
          </button>
          <button
            onClick={() => setSelectedSupplierId(s.id)}
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
      {/* Top Payable KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Supplier Payables Due
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatINR(suppliers.reduce((sum, s) => sum + s.outstandingPayable, 0))}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Cold-chain manufacturers & dairy procurement depots
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Largest Outstanding Account
          </span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            Amul (GCMMF) — ₹1,48,500
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Credit terms: 15 days (Current balance within credit period)
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Average Lead Delivery Time
          </span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            1.8 Days
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Reefer trucks dispatched from Ambattur & Poonamallee hubs
          </div>
        </div>
      </div>

      {/* Main Suppliers Table */}
      <DataTable
        data={suppliers}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search supplier name, person, depot, GSTIN..."
        searchFilter={(s, q) =>
          s.name.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.gstin.toLowerCase().includes(q)
        }
        onRowClick={(s) => setSelectedSupplierId(s.id)}
        actions={
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        }
      />

      {/* Supplier Ledger Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplierId(null)}
          title={`Supplier Ledger: ${selectedSupplier.name}`}
          subtitle={`${selectedSupplier.contactPerson} · ${selectedSupplier.phone} · ${selectedSupplier.city}`}
          maxWidth="3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-mono text-slate-600">
                Outstanding Balance:{' '}
                <strong className="text-amber-800">{formatINR(selectedSupplier.outstandingPayable)}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenPay(selectedSupplier)}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded"
                >
                  Make Payment
                </button>
                <button
                  onClick={() => setSelectedSupplierId(null)}
                  className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Contact & Terms Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">GSTIN & Compliance</span>
                <p className="font-mono font-bold text-slate-900">{selectedSupplier.gstin}</p>
                <span className="text-slate-500">{selectedSupplier.city}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Payment Credit Terms</span>
                <p className="font-mono font-bold text-slate-900">{selectedSupplier.paymentTermsDays} Days</p>
                <span className="text-slate-500">Lead time: {selectedSupplier.leadTimeDays} days</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Purchases to Date</span>
                <p className="font-mono font-bold text-slate-900">{formatINR(selectedSupplier.totalPurchases)}</p>
                <span className="text-emerald-700 font-medium">Verified Active Partner</span>
              </div>
            </div>

            {/* Inward Purchases Bills */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Inward Purchase Bills History
              </h4>
              <div className="border border-slate-200 rounded overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[540px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                      <th className="p-2">Bill #</th>
                      <th className="p-2">Bill Date</th>
                      <th className="p-2">Received Date</th>
                      <th className="p-2 text-right">Items</th>
                      <th className="p-2 text-right">Grand Total</th>
                      <th className="p-2 text-right">Balance Due</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-400">
                          No purchase bills logged for this vendor yet.
                        </td>
                      </tr>
                    ) : (
                      supplierPurchases.map((pb) => (
                        <tr key={pb.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-medium text-slate-900">{pb.billNumber}</td>
                          <td className="p-2 text-slate-600">{formatDate(pb.billDate)}</td>
                          <td className="p-2 text-slate-600">{formatDate(pb.receivedDate)}</td>
                          <td className="p-2 text-right font-mono text-slate-700">{pb.items.length} SKUs</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatINR(pb.grandTotal, true)}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-amber-800">
                            {formatINR(pb.balanceAmount, true)}
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                              pb.status === 'Posted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {pb.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments Made to Vendor */}
            {supplierPaymentsList.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Settlements & Payments Made
                </h4>
                <div className="border border-slate-200 rounded overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                        <th className="p-2">Voucher #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Mode</th>
                        <th className="p-2">UTR / Reference</th>
                        <th className="p-2 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierPaymentsList.map((sp) => (
                        <tr key={sp.id}>
                          <td className="p-2 font-mono font-medium text-slate-900">{sp.voucherNo}</td>
                          <td className="p-2 text-slate-600">{formatDate(sp.date)}</td>
                          <td className="p-2 text-slate-700">{sp.mode}</td>
                          <td className="p-2 font-mono text-slate-500">{sp.referenceNo}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatINR(sp.amount, true)}
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

      {/* Pay Vendor Modal */}
      {payTargetSupplier && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Disburse Payment to ${payTargetSupplier.name}`}
          subtitle={`Current Payable Balance: ${formatINR(payTargetSupplier.outstandingPayable)}`}
          maxWidth="md"
        >
          <form onSubmit={handlePaySubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Disbursement Amount (₹)
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value="NEFT / RTGS">Bank NEFT / RTGS</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="UPI">Corporate UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">UTR / Ref Number</label>
                <input
                  required
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Remarks / Note</label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
              >
                Record Supplier Disbursement
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingSupplier ? `Edit ${editingSupplier.name}` : 'Register New Cold-Chain Supplier'}
        subtitle="Vendor master profile for raw milk & branded ice cream procurement"
        maxWidth="md"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Supplier / Depot Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Vadilal Industries Cold Chain Hub"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contact Officer</label>
              <input
                required
                type="text"
                value={supplierForm.contactPerson}
                onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                required
                type="text"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN</label>
              <input
                required
                type="text"
                value={supplierForm.gstin}
                onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Depot City / Area</label>
              <input
                required
                type="text"
                value={supplierForm.city}
                onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Depot Address</label>
            <textarea
              rows={2}
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Credit Terms (Days)</label>
              <input
                type="number"
                value={supplierForm.paymentTermsDays}
                onChange={(e) => setSupplierForm({ ...supplierForm, paymentTermsDays: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lead Time (Days)</label>
              <input
                type="number"
                value={supplierForm.leadTimeDays}
                onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeDays: Number(e.target.value) })}
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
              {editingSupplier ? 'Save Changes' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
