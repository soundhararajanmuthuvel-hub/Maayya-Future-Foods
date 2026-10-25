import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Supplier } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
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
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  Receipt,
  FileText,
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
    deleteSupplier,
    toggleSupplierStatus,
    recordSupplierPayment,
    companyInfo,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTargetSupplier, setPayTargetSupplier] = useState<Supplier | null>(null);
  const [deactivatingSupplier, setDeactivatingSupplier] = useState<Supplier | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    address: '',
    paymentTermsDays: 15,
    leadTimeDays: 2,
    openingBalance: 0,
    notes: '',
    status: 'Active' as 'Active' | 'Inactive',
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

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    if (statusFilter !== 'All' && (s.status || 'Active') !== statusFilter) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      gstin: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: '',
      address: '',
      paymentTermsDays: 15,
      leadTimeDays: 2,
      openingBalance: 0,
      notes: '',
      status: 'Active',
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
      gstin: sup.gstin || '',
      city: sup.city,
      state: sup.state || 'Tamil Nadu',
      pincode: sup.pincode || '',
      address: sup.address,
      paymentTermsDays: sup.paymentTermsDays,
      leadTimeDays: sup.leadTimeDays,
      openingBalance: sup.openingBalance || 0,
      notes: sup.notes || '',
      status: sup.status || 'Active',
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
        name: supplierForm.name.trim(),
      });
    } else {
      addSupplier({
        ...supplierForm,
        name: supplierForm.name.trim(),
        outstandingPayable: Number(supplierForm.openingBalance) || 0,
        totalPurchases: 0,
        amountPaid: 0,
      });
    }
    setIsAddModalOpen(false);
  };

  const handleToggleStatusClick = (sup: Supplier) => {
    const hasBalance = sup.outstandingPayable > 0;
    const hasPurchases = purchases.some((p) => p.supplierId === sup.id);

    if (sup.status !== 'Inactive' && (hasBalance || hasPurchases)) {
      setDeactivatingSupplier(sup);
      return;
    }

    toggleSupplierStatus(sup.id);
  };

  const confirmDeactivate = () => {
    if (deactivatingSupplier) {
      toggleSupplierStatus(deactivatingSupplier.id);
      setDeactivatingSupplier(null);
    }
  };

  const handleOpenPay = (sup: Supplier) => {
    setPayTargetSupplier(sup);
    setPaymentAmount(sup.outstandingPayable > 0 ? sup.outstandingPayable : 0);
    setPaymentRef(`NEFT-${Date.now().toString().slice(-6)}`);
    setPaymentNotes(`Payment for cold storage goods inward`);
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTargetSupplier || paymentAmount <= 0) return;

    recordSupplierPayment({
      date: new Date().toISOString().split('T')[0],
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
      header: 'Supplier / Business Name',
      sortable: true,
      accessor: 'name',
      width: '260px',
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-900 flex items-center gap-2">
            <span>{s.name}</span>
            <StatusBadge
              label={s.status || 'Active'}
              variant={(s.status || 'Active') === 'Active' ? 'success' : 'neutral'}
            />
          </div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
            <span>{s.code}</span>
            <span>·</span>
            <span className="font-sans text-slate-600">{s.contactPerson}</span>
            {s.gstin && (
              <>
                <span>·</span>
                <span>GST: {s.gstin}</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Contact & Phone',
      render: (s) => (
        <div className="text-xs">
          <div className="font-mono text-slate-800">{s.phone}</div>
          {s.email && <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{s.email}</div>}
        </div>
      ),
    },
    {
      header: 'City & State',
      sortable: true,
      accessor: 'city',
      render: (s) => (
        <div className="text-xs text-slate-600">
          <span>{s.city}</span>
          {s.state && <span className="text-[11px] text-slate-400 block">{s.state}</span>}
        </div>
      ),
    },
    {
      header: 'Total Purchases',
      align: 'right',
      sortable: true,
      accessor: 'totalPurchases',
      render: (s) => <span className="font-mono text-xs text-slate-700">{formatINR(s.totalPurchases)}</span>,
    },
    {
      header: 'Amount Paid',
      align: 'right',
      render: (s) => {
        const totalPaid = (s.amountPaid || 0) + supplierPayments
          .filter((p) => p.supplierId === s.id)
          .reduce((sum, p) => sum + p.amount, 0);
        return <span className="font-mono text-xs text-emerald-700">{formatINR(totalPaid)}</span>;
      },
    },
    {
      header: 'Outstanding Payable',
      align: 'right',
      sortable: true,
      accessor: 'outstandingPayable',
      render: (s) => (
        <span className={`font-mono font-bold text-xs ${s.outstandingPayable > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
          {formatINR(s.outstandingPayable)}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenPay(s)}
            className="px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs"
          >
            Record Payment
          </button>
          <button
            onClick={() => setSelectedSupplierId(s.id)}
            className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            View Ledger
          </button>
          <button
            onClick={() => handleOpenEdit(s)}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
            title="Edit Supplier"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleStatusClick(s)}
            className={`px-2 py-1 text-[10px] font-medium rounded border ${
              (s.status || 'Active') === 'Active'
                ? 'border-slate-300 text-slate-600 hover:bg-slate-50'
                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
            }`}
            title={(s.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
          >
            {(s.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
          {purchases.filter((p) => p.supplierId === s.id).length === 0 && s.outstandingPayable === 0 && (
            <button
              onClick={() => deleteSupplier(s.id)}
              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
              title="Delete Supplier"
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
      {/* Header & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Supplier Payables Due
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatINR(suppliers.reduce((sum, s) => sum + s.outstandingPayable, 0))}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Active trade payables across {suppliers.filter((s) => (s.status || 'Active') === 'Active').length} active vendor(s)
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Inward Purchases
          </span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            {formatINR(purchases.reduce((sum, p) => sum + (p.status === 'Posted' ? p.grandTotal : 0), 0))}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Cumulative stock received into cold chain facilities
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Supplier Directory Status
          </span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            {suppliers.length} Registered
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Procurement depots for ice cream, milk, cones & packaging
          </div>
        </div>
      </div>

      {/* Main DataTable Card */}
      <div className="bg-white border border-slate-200/90 rounded-lg shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Supplier Directory ({filteredSuppliers.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium">Filter:</span>
              {(['All', 'Active', 'Inactive'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Supplier</span>
            </button>
          </div>
        </div>

        <DataTable
          data={filteredSuppliers}
          columns={columns}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Search supplier name, code, contact person, city, GSTIN..."
          searchFilter={(s, q) =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.contactPerson.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            (s.gstin || '').toLowerCase().includes(q) ||
            (s.phone || '').toLowerCase().includes(q)
          }
          onRowClick={(s) => setSelectedSupplierId(s.id)}
        />
      </div>

      {/* Supplier Ledger / Details Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={!!selectedSupplier && !isStatementModalOpen}
          onClose={() => setSelectedSupplierId(null)}
          title={`Supplier Ledger: ${selectedSupplier.name}`}
          subtitle={`Code: ${selectedSupplier.code} · ${selectedSupplier.city}${selectedSupplier.state ? `, ${selectedSupplier.state}` : ''} · Contact: ${selectedSupplier.phone}`}
          maxWidth="3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 font-mono">
                Outstanding Balance: <strong className="text-amber-800">{formatINR(selectedSupplier.outstandingPayable)}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsStatementModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
                <button
                  onClick={() => handleOpenPay(selectedSupplier)}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded"
                >
                  Record Payment
                </button>
                <button
                  onClick={() => setSelectedSupplierId(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Contact & Terms Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">GSTIN</span>
                <p className="font-mono font-bold text-slate-900">{selectedSupplier.gstin || 'Unregistered / None'}</p>
                <span className="text-slate-500">{selectedSupplier.city}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Credit Terms</span>
                <p className="font-mono font-bold text-slate-900">{selectedSupplier.paymentTermsDays} Days</p>
                <span className="text-slate-500">Lead time: {selectedSupplier.leadTimeDays} days</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Purchases</span>
                <p className="font-mono font-bold text-slate-900">{formatINR(selectedSupplier.totalPurchases)}</p>
                <span className="text-slate-500">{supplierPurchases.length} bill(s) logged</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Outstanding Payable</span>
                <p className="font-mono font-bold text-amber-800">{formatINR(selectedSupplier.outstandingPayable)}</p>
                <span className="text-[11px] text-slate-500 font-medium">Status: {selectedSupplier.status || 'Active'}</span>
              </div>
            </div>

            {selectedSupplier.notes && (
              <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded text-xs text-blue-900">
                <span className="font-bold">Notes: </span> {selectedSupplier.notes}
              </div>
            )}

            {/* Inward Purchases Bills */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-sky-600" />
                <span>Purchase Inward Bills History</span>
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
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Disbursements & Settlement Vouchers</span>
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
                    {supplierPaymentsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          No payment vouchers recorded for this supplier yet.
                        </td>
                      </tr>
                    ) : (
                      supplierPaymentsList.map((sp) => (
                        <tr key={sp.id}>
                          <td className="p-2 font-mono font-medium text-slate-900">{sp.voucherNo}</td>
                          <td className="p-2 text-slate-600">{formatDate(sp.date)}</td>
                          <td className="p-2 text-slate-700">{sp.mode}</td>
                          <td className="p-2 font-mono text-slate-500">{sp.referenceNo}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatINR(sp.amount, true)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Supplier Statement Modal */}
      {selectedSupplier && isStatementModalOpen && (
        <Modal
          isOpen={isStatementModalOpen}
          onClose={() => setIsStatementModalOpen(false)}
          title={`Supplier Statement · ${selectedSupplier.name}`}
          maxWidth="2xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="p-4 bg-white border border-slate-300 rounded text-slate-800 text-xs font-sans space-y-4 print:p-0 print:border-none">
            {/* Statement Header */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-950 font-serif">{companyInfo.name}</h3>
                <p className="text-slate-600 text-[11px]">{companyInfo.address}, {companyInfo.city}</p>
                <p className="text-slate-600 text-[11px]">Phone: {companyInfo.phone} · GSTIN: {companyInfo.gstin}</p>
              </div>
              <div className="text-right">
                <span className="font-bold uppercase tracking-wider text-slate-900 border border-slate-900 px-2 py-0.5 inline-block mb-1">
                  Supplier Statement
                </span>
                <p className="text-[11px] text-slate-500 font-mono">Date: {new Date().toISOString().split('T')[0]}</p>
              </div>
            </div>

            {/* Vendor Details */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Supplier Account</span>
                <p className="font-bold text-slate-900">{selectedSupplier.name}</p>
                <p className="text-slate-600">{selectedSupplier.address}, {selectedSupplier.city} {selectedSupplier.pincode}</p>
                <p className="font-mono text-slate-600">GSTIN: {selectedSupplier.gstin || 'N/A'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Closing Balance Payable</span>
                <p className="text-base font-bold font-mono text-amber-800">
                  {formatINR(selectedSupplier.outstandingPayable)}
                </p>
                <p className="text-slate-500 text-[11px]">Payment Terms: {selectedSupplier.paymentTermsDays} Days</p>
              </div>
            </div>

            {/* Inward Bills & Payments Breakdown */}
            <div>
              <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[11px] tracking-wider">
                Transaction History
              </h4>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                    <th className="p-1.5">Date</th>
                    <th className="p-1.5">Ref / Voucher</th>
                    <th className="p-1.5">Type</th>
                    <th className="p-1.5 text-right">Debit / Billed</th>
                    <th className="p-1.5 text-right">Credit / Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {supplierPurchases.map((pb) => (
                    <tr key={pb.id}>
                      <td className="p-1.5 font-mono">{formatDate(pb.billDate)}</td>
                      <td className="p-1.5 font-mono">{pb.billNumber}</td>
                      <td className="p-1.5 text-slate-600">Purchase Inward</td>
                      <td className="p-1.5 text-right font-mono font-medium">{formatINR(pb.grandTotal, true)}</td>
                      <td className="p-1.5 text-right font-mono text-slate-400">—</td>
                    </tr>
                  ))}
                  {supplierPaymentsList.map((sp) => (
                    <tr key={sp.id}>
                      <td className="p-1.5 font-mono">{formatDate(sp.date)}</td>
                      <td className="p-1.5 font-mono">{sp.voucherNo}</td>
                      <td className="p-1.5 text-emerald-700">Payment ({sp.mode})</td>
                      <td className="p-1.5 text-right font-mono text-slate-400">—</td>
                      <td className="p-1.5 text-right font-mono font-bold text-emerald-700">{formatINR(sp.amount, true)}</td>
                    </tr>
                  ))}
                  {supplierPurchases.length === 0 && supplierPaymentsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-slate-400">
                        No transactions recorded for this supplier.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-300 text-[10px] text-slate-500 flex justify-between">
              <span>Maayya Future Foods · Smart Business Manager</span>
              <span>Software Developed by MSR Solutions</span>
            </div>
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
        maxWidth="lg"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Supplier / Business Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Heritage Foods Ltd or Hangyo Ice Creams Pvt Ltd"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="Manager / Dispatch Officer"
                value={supplierForm.contactPerson}
                onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="+91 98765 43210"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="dispatch@supplier.com"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="33AAAAA0000A1Z5"
                value={supplierForm.gstin}
                onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                required
                type="text"
                placeholder="City / Depot Area"
                value={supplierForm.city}
                onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={supplierForm.state}
                onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                placeholder="600001"
                value={supplierForm.pincode}
                onChange={(e) => setSupplierForm({ ...supplierForm, pincode: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Depot / Plant Address</label>
            <textarea
              rows={2}
              placeholder="Factory or depot street address"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Terms (Days)</label>
              <input
                type="number"
                min="0"
                value={supplierForm.paymentTermsDays}
                onChange={(e) => setSupplierForm({ ...supplierForm, paymentTermsDays: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
              <input
                type="number"
                min="0"
                value={supplierForm.leadTimeDays}
                onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeDays: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            {!editingSupplier && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={supplierForm.openingBalance}
                  onChange={(e) => setSupplierForm({ ...supplierForm, openingBalance: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
                />
              </div>
            )}
            {editingSupplier && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={supplierForm.status}
                  onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Supply Agreements</label>
            <input
              type="text"
              placeholder="e.g. Weekly reefer delivery schedule or depot code"
              value={supplierForm.notes}
              onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              {editingSupplier ? 'Save Changes' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivation Warning Modal */}
      {deactivatingSupplier && (
        <Modal
          isOpen={!!deactivatingSupplier}
          onClose={() => setDeactivatingSupplier(null)}
          title="Warning: Deactivate Supplier with Outstanding Records"
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <span className="font-bold block text-sm">
                  {deactivatingSupplier.name} has active records
                </span>
                <p className="mt-1">
                  Outstanding Balance: <strong>{formatINR(deactivatingSupplier.outstandingPayable)}</strong>.
                  Linked purchases: <strong>{purchases.filter((p) => p.supplierId === deactivatingSupplier.id).length}</strong>.
                  Deactivating this vendor prevents new purchases from being created under this supplier, but maintains all financial history and ledger records.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeactivatingSupplier(null)}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                className="px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Deactivate Supplier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
