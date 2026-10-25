import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, BrandName, ProductCategory } from '../types';
import { formatINR, getStockStatus } from '../utils/formatters';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Plus, Eye, Edit, Package, Layers, Warehouse, TrendingUp, Sparkles } from 'lucide-react';

export const ProductsScreen: React.FC = () => {
  const { products, brands, selectedProductId, setSelectedProductId, addProduct, updateProduct } = useApp();

  const [activeBrand, setActiveBrand] = useState<string>('All');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    brand: brands[0]?.name || 'Heritage Milk',
    category: 'Ice Cream Cones & Cups' as ProductCategory,
    unit: 'Piece' as const,
    hsnCode: '21050000',
    mrp: 50,
    purchaseRate: 30,
    wholesaleRate: 40,
    retailRate: 50,
    gstRate: 18 as 5 | 12 | 18,
    minStockAlert: 20,
    reorderLevel: 40,
    initialQty: 100,
    initialBatchNo: 'BT-2026-N01',
    initialExpDate: '2027-04-15',
  });

  const brandOptions: string[] = ['All', ...brands.map((b) => b.name)];
  const categories: (ProductCategory | 'All')[] = [
    'All',
    'Ice Cream Cones & Cups',
    'Tubs & Family Packs',
    'Bulk Commercial Tubs',
    'Fresh Milk & Pouches',
    'Paneer, Butter & Curd',
  ];

  // Filtering
  const filteredProducts = products.filter((p) => {
    if (activeBrand !== 'All' && p.brand !== activeBrand) return false;
    if (activeCategory !== 'All' && p.category !== activeCategory) return false;
    return true;
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleOpenAdd = () => {
    setFormData({
      code: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      brand: brands[0]?.name || 'Heritage Milk',
      category: 'Ice Cream Cones & Cups',
      unit: 'Piece',
      hsnCode: '21050000',
      mrp: 60,
      purchaseRate: 36,
      wholesaleRate: 46,
      retailRate: 60,
      gstRate: 18,
      minStockAlert: 25,
      reorderLevel: 40,
      initialQty: 50,
      initialBatchNo: `BT-${Date.now().toString().slice(-4)}`,
      initialExpDate: '2027-05-01',
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      name: p.name,
      brand: p.brand,
      category: p.category,
      unit: p.unit as any,
      hsnCode: p.hsnCode,
      mrp: p.mrp,
      purchaseRate: p.purchaseRate,
      wholesaleRate: p.wholesaleRate,
      retailRate: p.retailRate,
      gstRate: p.gstRate,
      minStockAlert: p.minStockAlert,
      reorderLevel: p.reorderLevel,
      initialQty: p.currentStock,
      initialBatchNo: p.batches[0]?.batchNumber || 'BT-001',
      initialExpDate: p.batches[0]?.expiryDate || '2027-04-01',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        code: formData.code,
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        unit: formData.unit,
        hsnCode: formData.hsnCode,
        mrp: Number(formData.mrp),
        purchaseRate: Number(formData.purchaseRate),
        wholesaleRate: Number(formData.wholesaleRate),
        retailRate: Number(formData.retailRate),
        gstRate: formData.gstRate,
        minStockAlert: Number(formData.minStockAlert),
        reorderLevel: Number(formData.reorderLevel),
      });
    } else {
      addProduct({
        code: formData.code,
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        unit: formData.unit,
        hsnCode: formData.hsnCode,
        mrp: Number(formData.mrp),
        purchaseRate: Number(formData.purchaseRate),
        wholesaleRate: Number(formData.wholesaleRate),
        retailRate: Number(formData.retailRate),
        gstRate: formData.gstRate,
        currentStock: Number(formData.initialQty),
        minStockAlert: Number(formData.minStockAlert),
        reorderLevel: Number(formData.reorderLevel),
        isActive: true,
        batches: [
          {
            batchNumber: formData.initialBatchNo,
            mfgDate: new Date().toISOString().split('T')[0],
            expiryDate: formData.initialExpDate,
            quantity: Number(formData.initialQty),
            costRate: Number(formData.purchaseRate),
            daysToExpiry: 180,
          },
        ],
      });
    }
    setIsAddModalOpen(false);
  };

  // Columns definition for DataTable
  const columns: Column<Product>[] = [
    {
      header: 'Code / Item',
      width: '280px',
      sortable: true,
      accessor: 'name',
      render: (p) => (
        <div>
          <div className="font-semibold text-slate-900">{p.name}</div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
            <span>{p.code}</span>
            <span>·</span>
            <span className="text-slate-600 font-sans">{p.brand}</span>
            <span>·</span>
            <span>HSN: {p.hsnCode}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      sortable: true,
      accessor: 'category',
      render: (p) => <span className="text-slate-600">{p.category}</span>,
    },
    {
      header: 'MRP',
      align: 'right',
      sortable: true,
      accessor: 'mrp',
      render: (p) => <span className="font-mono">{formatINR(p.mrp)}</span>,
    },
    {
      header: 'Cost Rate',
      align: 'right',
      sortable: true,
      accessor: 'purchaseRate',
      render: (p) => <span className="font-mono text-slate-600">{formatINR(p.purchaseRate)}</span>,
    },
    {
      header: 'Wholesale',
      align: 'right',
      sortable: true,
      accessor: 'wholesaleRate',
      render: (p) => <span className="font-mono font-medium text-slate-900">{formatINR(p.wholesaleRate)}</span>,
    },
    {
      header: 'Stock',
      align: 'right',
      sortable: true,
      accessor: 'currentStock',
      render: (p) => (
        <span className="font-mono font-bold text-slate-900">
          {p.currentStock} <span className="text-[10px] font-normal text-slate-500">{p.unit}</span>
        </span>
      ),
    },
    {
      header: 'Stock Status',
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
    {
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedProductId(p.id)}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
            title="View Details & Batches"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(p)}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
            title="Edit Product"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Brand & Category Navigation Pills */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
            Brand Filter:
          </span>
          {brandOptions.map((b) => (
            <button
              key={b}
              onClick={() => setActiveBrand(b)}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                activeBrand === b
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
            Category:
          </span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors ${
                activeCategory === c
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search product name, SKU code, brand, HSN..."
        searchFilter={(p, q) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.hsnCode.includes(q)
        }
        onRowClick={(p) => setSelectedProductId(p.id)}
        actions={
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        }
      />

      {/* Product Detail Modal / Drawer */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProductId(null)}
          title={`${selectedProduct.name}`}
          subtitle={`SKU: ${selectedProduct.code} · ${selectedProduct.brand} · ${selectedProduct.category}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 font-mono">
                Total Stock: <strong>{selectedProduct.currentStock} {selectedProduct.unit}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(selectedProduct);
                    setSelectedProductId(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => setSelectedProductId(null)}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Brand Logo & Identification Header */}
            {(() => {
              const brandRecord = brands.find(
                (b) => b.name.trim().toLowerCase() === selectedProduct.brand.trim().toLowerCase()
              );
              return (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-10 rounded border border-slate-300 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      {brandRecord?.logoUrl ? (
                        <img
                          src={brandRecord.logoUrl}
                          alt={`${selectedProduct.brand} logo`}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono font-semibold">
                          {selectedProduct.brand.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Product Brand</span>
                      <h4 className="font-bold text-slate-900 text-sm">{selectedProduct.brand}</h4>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 font-medium">
                    SKU: {selectedProduct.code}
                  </span>
                </div>
              );
            })()}

            {/* Rates & Profitability Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">MRP</span>
                <p className="text-base font-bold text-slate-900 font-mono">
                  {formatINR(selectedProduct.mrp)}
                </p>
                <span className="text-[10px] text-slate-400">Retail Box</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Cost (Inward)</span>
                <p className="text-base font-bold text-slate-700 font-mono">
                  {formatINR(selectedProduct.purchaseRate)}
                </p>
                <span className="text-[10px] text-slate-400">Excl. {selectedProduct.gstRate}% GST</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Wholesale Rate</span>
                <p className="text-base font-bold text-indigo-700 font-mono">
                  {formatINR(selectedProduct.wholesaleRate)}
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold font-mono">
                  +{(((selectedProduct.wholesaleRate - selectedProduct.purchaseRate) / selectedProduct.purchaseRate) * 100).toFixed(1)}% margin
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Direct POS Rate</span>
                <p className="text-base font-bold text-emerald-700 font-mono">
                  {formatINR(selectedProduct.retailRate)}
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold font-mono">
                  +{(((selectedProduct.retailRate - selectedProduct.purchaseRate) / selectedProduct.purchaseRate) * 100).toFixed(1)}% margin
                </span>
              </div>
            </div>

            {/* Inventory Batches (FEFO Tracker) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Warehouse className="w-4 h-4 text-sky-600" />
                  <span>Batches & Stock Inward Tracker</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-500">FEFO Enforced</span>
              </div>

              <div className="border border-slate-200 rounded overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                      <th className="p-2">Batch #</th>
                      <th className="p-2">Mfg Date</th>
                      <th className="p-2">Expiry Date</th>
                      <th className="p-2">Shelf Life</th>
                      <th className="p-2 text-right">In-Stock Qty</th>
                      <th className="p-2 text-right">Batch Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProduct.batches.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-medium text-slate-900">{b.batchNumber}</td>
                        <td className="p-2 font-mono text-slate-600">{b.mfgDate}</td>
                        <td className="p-2 font-mono text-slate-600">{b.expiryDate}</td>
                        <td className="p-2">
                          <StatusBadge
                            label={b.isExpired ? 'EXPIRED' : b.isNearExpiry ? `${b.daysToExpiry}d (Near)` : `${b.daysToExpiry} days`}
                            variant={b.isExpired ? 'danger' : b.isNearExpiry ? 'warning' : 'success'}
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          {b.quantity} {selectedProduct.unit}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-700">
                          {formatINR(b.quantity * selectedProduct.purchaseRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Threshold Settings */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-3 text-xs">
              <div>
                <span className="text-slate-500">Min Alert Level:</span>
                <p className="font-mono font-semibold text-slate-800">{selectedProduct.minStockAlert} {selectedProduct.unit}</p>
              </div>
              <div>
                <span className="text-slate-500">Reorder Threshold:</span>
                <p className="font-mono font-semibold text-slate-800">{selectedProduct.reorderLevel} {selectedProduct.unit}</p>
              </div>
              <div>
                <span className="text-slate-500">HSN & Tax Code:</span>
                <p className="font-mono font-semibold text-slate-800">{selectedProduct.hsnCode} ({selectedProduct.gstRate}% GST)</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProduct ? `Edit ${editingProduct.name}` : 'Add New Product to Catalog'}
        subtitle="Catalog master for multi-brand cold storage inventory"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">SKU / Item Code</label>
              <input
                required
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Brand <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
              >
                {brands
                  .filter((b) => b.status === 'Active' || b.name === formData.brand)
                  .map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.category})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Product Description</label>
            <input
              required
              type="text"
              placeholder="e.g. Amul Gold Real Vanilla Cup 100ml"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="Ice Cream Cones & Cups">Ice Cream Cones & Cups</option>
                <option value="Tubs & Family Packs">Tubs & Family Packs</option>
                <option value="Bulk Commercial Tubs">Bulk Commercial Tubs</option>
                <option value="Fresh Milk & Pouches">Fresh Milk & Pouches</option>
                <option value="Paneer, Butter & Curd">Paneer, Butter & Curd</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Billing Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value="Piece">Piece</option>
                <option value="Pack">Pack</option>
                <option value="Litre">Litre</option>
                <option value="Kg">Kg</option>
                <option value="Tub (5L)">Tub (5L)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">GST Rate (%)</label>
              <select
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) as any })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              >
                <option value={5}>5% (Milk & Paneer)</option>
                <option value={12}>12% (Butter & Ghee)</option>
                <option value={18}>18% (Ice Cream standard)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">MRP (₹)</label>
              <input
                required
                type="number"
                step="0.5"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Purchase Rate (₹)</label>
              <input
                required
                type="number"
                step="0.5"
                value={formData.purchaseRate}
                onChange={(e) => setFormData({ ...formData, purchaseRate: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Wholesale (₹)</label>
              <input
                required
                type="number"
                step="0.5"
                value={formData.wholesaleRate}
                onChange={(e) => setFormData({ ...formData, wholesaleRate: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Retail POS (₹)</label>
              <input
                required
                type="number"
                step="0.5"
                value={formData.retailRate}
                onChange={(e) => setFormData({ ...formData, retailRate: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Min Stock Alert Level</label>
              <input
                type="number"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reorder Level Alert</label>
              <input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          {!editingProduct && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Initial Opening Batch
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600">Batch Code</label>
                  <input
                    type="text"
                    value={formData.initialBatchNo}
                    onChange={(e) => setFormData({ ...formData, initialBatchNo: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600">Initial Stock</label>
                  <input
                    type="number"
                    value={formData.initialQty}
                    onChange={(e) => setFormData({ ...formData, initialQty: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.initialExpDate}
                    onChange={(e) => setFormData({ ...formData, initialExpDate: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                  />
                </div>
              </div>
            </div>
          )}

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
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
