import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RetailShop } from '../types';
import { formatINR } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatCard } from '../components/common/StatCard';
import {
  CreditCard,
  AlertTriangle,
  Clock,
  DollarSign,
  Phone,
  Store,
  ShieldAlert,
} from 'lucide-react';

export const AccountsScreen: React.FC = () => {
  const { shops, invoices, setCurrentScreen, setSelectedShopId } = useApp();

  // Synthetic Ageing breakdown calculations
  const totalOutstanding = shops.reduce((sum, s) => sum + s.outstandingAmount, 0);

  // Ageing buckets
  const currentBucket = totalOutstanding * 0.48; // 0-15 days
  const bucket16to30 = totalOutstanding * 0.28; // 16-30 days
  const bucket31to60 = totalOutstanding * 0.16; // 31-60 days
  const bucket60Plus = totalOutstanding * 0.08; // 60+ days

  const columns: Column<RetailShop>[] = [
    {
      header: 'Retail Shop & Route',
      sortable: true,
      accessor: 'shopName',
      width: '260px',
      render: (s) => (
        <div>
          <span className="font-semibold text-slate-900">{s.shopName}</span>
          <div className="text-[11px] text-slate-500">{s.ownerName} · {s.routeArea.split(':')[0]}</div>
        </div>
      ),
    },
    {
      header: 'Credit Limit',
      align: 'right',
      sortable: true,
      accessor: 'creditLimit',
      render: (s) => <span className="font-mono text-slate-700">{formatINR(s.creditLimit)}</span>,
    },
    {
      header: 'Current (0-15d)',
      align: 'right',
      render: (s) => (
        <span className="font-mono text-slate-700">
          {formatINR(Math.max(0, s.outstandingAmount - s.overdueAmount))}
        </span>
      ),
    },
    {
      header: 'Overdue (16-30d)',
      align: 'right',
      render: (s) => (
        <span className={`font-mono ${s.overdueAmount > 0 ? 'text-amber-800 font-semibold' : 'text-slate-400'}`}>
          {formatINR(s.overdueAmount * 0.7)}
        </span>
      ),
    },
    {
      header: 'Overdue (30d+)',
      align: 'right',
      render: (s) => (
        <span className={`font-mono ${s.overdueAmount > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'}`}>
          {formatINR(s.overdueAmount * 0.3)}
        </span>
      ),
    },
    {
      header: 'Total Outstanding',
      align: 'right',
      sortable: true,
      accessor: 'outstandingAmount',
      render: (s) => (
        <span className={`font-mono font-bold text-sm ${s.outstandingAmount > s.creditLimit ? 'text-rose-700' : 'text-slate-900'}`}>
          {formatINR(s.outstandingAmount)}
        </span>
      ),
    },
    {
      header: 'Limit Utilization',
      align: 'center',
      render: (s) => {
        const util = Math.min(100, (s.outstandingAmount / s.creditLimit) * 100);
        return (
          <div className="w-28 mx-auto">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-0.5">
              <span>{util.toFixed(0)}%</span>
              <span>{s.status}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${util}%` }}
                className={`h-full ${
                  util >= 100 ? 'bg-rose-600' : util >= 80 ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
              ></div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Action',
      align: 'right',
      render: (s) => (
        <button
          onClick={() => {
            setSelectedShopId(s.id);
            setCurrentScreen('shops');
          }}
          className="px-2.5 py-1 text-[11px] font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
        >
          Open Ledger
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Ageing Buckets Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Current (0-15 Days)"
          value={formatINR(currentBucket)}
          subValue="Healthy distribution turnover"
          trend={{ text: '48% of total', type: 'positive' }}
          icon={<Clock className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Due (16-30 Days)"
          value={formatINR(bucket16to30)}
          subValue="Due in this billing cycle"
          trend={{ text: '28% of total', type: 'neutral' }}
          icon={<Clock className="w-4 h-4 text-slate-500" />}
        />
        <StatCard
          label="Overdue (31-60 Days)"
          value={formatINR(bucket31to60)}
          subValue="Requires sales call"
          trend={{ text: '16% of total', type: 'warning' }}
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Critical (60+ Days)"
          value={formatINR(bucket60Plus)}
          subValue="Blocked dispatch warning"
          trend={{ text: '8% high risk', type: 'negative' }}
          icon={<ShieldAlert className="w-4 h-4 text-rose-600" />}
        />
      </div>

      {/* Credit Risk Warning Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Accounts Credit Alert:</strong> Om Sai Daily Mart has breached the sanctioned credit ceiling of ₹75,000 (Current: ₹78,300). Further dispatch van deliveries are set to blocked status.
          </span>
        </div>
        <button
          onClick={() => setCurrentScreen('shops')}
          className="px-3 py-1 text-xs font-semibold text-amber-950 bg-amber-200/80 hover:bg-amber-300 rounded transition-colors shrink-0 self-end sm:self-auto"
        >
          Review Shop Accounts →
        </button>
      </div>

      {/* Main Ageing Table */}
      <DataTable
        data={shops}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search shop accounts, route, owners..."
        searchFilter={(s, q) =>
          s.shopName.toLowerCase().includes(q) ||
          s.ownerName.toLowerCase().includes(q) ||
          s.routeArea.toLowerCase().includes(q)
        }
      />
    </div>
  );
};
