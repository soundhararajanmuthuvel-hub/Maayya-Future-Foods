import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Brand } from '../types';
import { formatDate } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Package,
  Layers,
  AlertTriangle,
  Info,
  Building2,
  Upload,
} from 'lucide-react';

export const BrandsScreen: React.FC = () => {
  const { brands, products, invoices, addBrand, updateBrand, deleteBrand, toggleBrandStatus, addToast } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deactivatingBrand, setDeactivatingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [isDeleteProcessing, setIsDeleteProcessing] = useState(false);

  // Form State
  const [brandForm, setBrandForm] = useState({
    name: '',
    category: 'Ice Cream',
    logoUrl: '',
    description: '',
    contactDetails: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const categories = ['All', 'Ice Cream', 'Milk Products', 'Other'];

  // Filtering
  const filteredBrands = brands.filter((b) => {
    if (categoryFilter !== 'All') {
      const bCat = b.category.toLowerCase();
      const filter = categoryFilter.toLowerCase();
      if (filter === 'ice cream' && !bCat.includes('ice cream')) return false;
      if (filter === 'milk products' && !bCat.includes('milk') && !bCat.includes('dairy')) return false;
      if (filter === 'other' && (bCat.includes('ice cream') || bCat.includes('milk') || bCat.includes('dairy'))) return false;
    }
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setBrandForm({
      name: '',
      category: 'Ice Cream',
      logoUrl: '',
      description: '',
      contactDetails: '',
      status: 'Active',
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      category: brand.category,
      logoUrl: brand.logoUrl,
      description: brand.description || '',
      contactDetails: brand.contactDetails || '',
      status: brand.status,
    });
    setIsAddEditModalOpen(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast({
        type: 'warning',
        title: 'Image File Too Large',
        message: 'Please choose a brand logo image smaller than 2MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBrandForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
        addToast({
          type: 'success',
          title: 'Brand Logo Loaded',
          message: `${file.name} ready for invoice rendering.`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name.trim()) return;

    if (editingBrand) {
      updateBrand({
        ...editingBrand,
        name: brandForm.name.trim(),
        category: brandForm.category,
        logoUrl: brandForm.logoUrl,
        description: brandForm.description,
        contactDetails: brandForm.contactDetails,
        status: brandForm.status,
      });
    } else {
      addBrand({
        name: brandForm.name.trim(),
        category: brandForm.category,
        logoUrl: brandForm.logoUrl,
        description: brandForm.description,
        contactDetails: brandForm.contactDetails,
        status: brandForm.status,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    setIsAddEditModalOpen(false);
  };

  const handleToggleStatusClick = (brand: Brand) => {
    const linkedCount = products.filter(
      (p) => p.brand.trim().toLowerCase() === brand.name.trim().toLowerCase()
    ).length;

    if (brand.status === 'Active' && linkedCount > 0) {
      setDeactivatingBrand(brand);
      return;
    }

    toggleBrandStatus(brand.id);
  };

  const confirmDeactivate = () => {
    if (deactivatingBrand) {
      toggleBrandStatus(deactivatingBrand.id);
      setDeactivatingBrand(null);
    }
  };

  const columns: Column<Brand>[] = [
    {
      header: 'Brand Logo & Details',
      accessor: 'name',
      sortable: true,
      render: (b) => {
        return (
          <div className="flex items-center gap-3">
            <div className="w-20 h-10 rounded border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0 overflow-hidden">
              {b.logoUrl ? (
                <img
                  src={b.logoUrl}
                  alt={`${b.name} logo`}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    // Fallback to text if image error
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">No Logo</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs sm:text-sm">{b.name}</span>
                {b.isInitial && (
                  <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[10px] font-mono font-semibold">
                    Core
                  </span>
                )}
              </div>
              {b.description && (
                <p className="text-[11px] text-slate-500 line-clamp-1 max-w-md">{b.description}</p>
              )}
              {b.contactDetails && (
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Contact: {b.contactDetails}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (b) => <span className="text-xs text-slate-700 font-medium">{b.category}</span>,
    },
    {
      header: 'Products Linked',
      align: 'center',
      render: (b) => {
        const count = products.filter(
          (p) => p.brand.trim().toLowerCase() === b.name.trim().toLowerCase()
        ).length;
        return (
          <span
            className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
              count > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {count} product{count === 1 ? '' : 's'}
          </span>
        );
      },
    },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      sortable: true,
      render: (b) => (
        <span className="font-mono text-[11px] text-slate-500">
          {b.createdAt ? formatDate(b.createdAt) : 'Initial'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (b) => (
        <StatusBadge
          label={b.status}
          variant={b.status === 'Active' ? 'success' : 'neutral'}
        />
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleToggleStatusClick(b)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
              b.status === 'Active'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={b.status === 'Active' ? 'Deactivate Brand' : 'Activate Brand'}
          >
            {b.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => handleOpenEdit(b)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded"
            title="Edit Brand"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {!b.isInitial && (
            <button
              onClick={() => setDeletingBrand(b)}
              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded"
              title="Delete Brand"
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
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Brand Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage partner product brands (Heritage Milk, Hangyo Ice Cream & future partner brands). Logos configured here automatically render on invoices and product master records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
          {(['All', 'Active', 'Inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={filteredBrands}
        columns={columns}
        keyExtractor={(b) => b.id}
        searchPlaceholder="Search brand name, category, contact, description..."
        searchFilter={(b, query) =>
          b.name.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          (b.description || '').toLowerCase().includes(query) ||
          (b.contactDetails || '').toLowerCase().includes(query)
        }
      />

      {/* Add / Edit Brand Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingBrand ? `Edit ${editingBrand.name}` : 'Add New Product Brand'}
        subtitle="Configure partner brand details and invoice logo"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveBrand} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Brand Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Heritage Milk or Hangyo Ice Cream"
              value={brandForm.name}
              onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Category</label>
              <select
                value={brandForm.category}
                onChange={(e) => setBrandForm({ ...brandForm, category: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="Ice Cream">Ice Cream</option>
                <option value="Milk Products">Milk Products</option>
                <option value="Dairy & Fresh Milk">Dairy & Fresh Milk</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={brandForm.status}
                onChange={(e) => setBrandForm({ ...brandForm, status: e.target.value as 'Active' | 'Inactive' })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
              >
                <option value="Active">Active (Invoices & Catalog Enabled)</option>
                <option value="Inactive">Inactive (Hidden from Billing)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Brand Logo (For Invoices)</label>
            <div className="flex items-center gap-3">
              <div className="w-24 h-14 rounded border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                {brandForm.logoUrl ? (
                  <img
                    src={brandForm.logoUrl}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono text-center">No Logo Uploaded</span>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-500">
                  PNG or JPEG with transparent or clean background recommended (Max 2MB).
                </p>
                {brandForm.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setBrandForm({ ...brandForm, logoUrl: '' })}
                    className="text-[10px] text-rose-600 hover:underline block"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Brand Description</label>
            <textarea
              rows={2}
              placeholder="e.g. Authorized distributor for ice cream cups, tubs & fresh pouch milk"
              value={brandForm.description}
              onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Details (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Regional depot phone, representative email, or supply contact"
              value={brandForm.contactDetails}
              onChange={(e) => setBrandForm({ ...brandForm, contactDetails: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
            >
              {editingBrand ? 'Save Changes' : 'Create Brand'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivation Warning Modal */}
      {deactivatingBrand && (
        <Modal
          isOpen={!!deactivatingBrand}
          onClose={() => setDeactivatingBrand(null)}
          title="Warning: Deactivate Brand with Linked Products"
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <span className="font-bold block text-sm">
                  {deactivatingBrand.name} has linked catalog products
                </span>
                <p className="mt-1">
                  There are currently{' '}
                  <strong>
                    {products.filter((p) => p.brand.trim().toLowerCase() === deactivatingBrand.name.trim().toLowerCase()).length}
                  </strong>{' '}
                  products assigned to this brand. Deactivating this brand will prevent it from appearing as an active filter or invoice badge for new sales, but existing product records and historical invoices will remain intact.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeactivatingBrand(null)}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                className="px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Deactivate Brand
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Brand Delete Confirmation Modal */}
      {deletingBrand && (
        <ConfirmDeleteModal
          isOpen={!!deletingBrand}
          onClose={() => setDeletingBrand(null)}
          title="Delete Brand"
          recordType="Brand"
          recordName={deletingBrand.name}
          details={`Are you sure you want to delete brand "${deletingBrand.name}"? If products or past invoices reference this brand, the system will protect historical records.`}
          confirmButtonLabel="Delete Brand"
          isProcessing={isDeleteProcessing}
          onConfirm={async () => {
            setIsDeleteProcessing(true);
            try {
              deleteBrand(deletingBrand.id);
              setDeletingBrand(null);
            } finally {
              setIsDeleteProcessing(false);
            }
          }}
        />
      )}
    </div>
  );
};
