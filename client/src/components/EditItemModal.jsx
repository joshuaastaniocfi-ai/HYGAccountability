import React, { useState, useEffect } from 'react';
import { X, Pencil, AlertOctagon, Package, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function EditItemModal({ isOpen, onClose, item, onItemUpdated }) {
  const [formData, setFormData] = useState({
    assetTag: '',
    itemDescription: '',
    equipmentType: '',
    brandModel: '',
    serialNumber: '',
    category: 'Laptops & Desktops',
    currentCondition: 'Good',
    status: 'Available',
    remarks: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const EQUIPMENT_TYPES = [
    'UPS Battery',
    'UPS',
    'Laptop',
    'Mouse',
    'Keyboard',
    'Monitor',
    'Barcode Scanner',
    'Printer',
    'Tablet',
    'POS Terminal',
    'Laboratory & QA Tool',
    'Desktop',
    'Other',
  ];

  useEffect(() => {
    if (isOpen && item) {
      setError(null);
      setFormData({
        assetTag: item.assetTag || item.propertyTag || item.equipmentTag || '',
        itemDescription: item.itemDescription || item.equipmentType || '',
        equipmentType: item.equipmentType || '',
        brandModel: item.brandModel || item.brand || '',
        serialNumber: item.serialNumber || '',
        category: item.category || 'Laptops & Desktops',
        currentCondition: item.currentCondition || item.condition || 'Good',
        status: item.status || 'Available',
        remarks: item.remarks || '',
      });
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const categories = [
    'Laptops & Desktops',
    'Mobile & Tablets',
    'Warehouse & Barcode Scanners',
    'Laboratory & QA Equipment',
    'Production & Machinery',
    'Printers & Peripherals',
    'Office Equipment',
    'Other',
  ];

  const conditions = ['New', 'Good', 'Fair', 'Defective'];
  const statuses = ['Available', 'Assigned', 'Under Maintenance', 'Decommissioned'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        assetTag: formData.assetTag.trim().toUpperCase(),
        itemDescription: formData.itemDescription.trim(),
        equipmentType: formData.equipmentType ? formData.equipmentType.trim() : undefined,
        brandModel: formData.brandModel.trim(),
        serialNumber: formData.serialNumber.trim(),
        category: formData.category,
        currentCondition: formData.currentCondition,
        status: formData.status,
        remarks: formData.remarks.trim(),
        performedBy: 'System Administrator',
      };

      const updated = await api.updateItem(item._id, payload);
      if (onItemUpdated) {
        onItemUpdated(updated);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Equipment Details</h3>
              <p className="text-xs text-slate-500">
                Item ID: <span className="font-mono font-bold text-slate-700">{item.itemNumber || item.assetTag}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Asset Tag / Tag</label>
              <input
                type="text"
                required
                value={formData.assetTag}
                onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                placeholder="CFI-TAG-001"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="SN-123456"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description / Item Name</label>
              <input
                type="text"
                required
                value={formData.itemDescription}
                onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Dell OptiPlex 3080 Desktop, UPS Battery"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Equipment Type</label>
              <select
                value={formData.equipmentType}
                onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-800"
              >
                <option value="">-- Select Type --</option>
                {EQUIPMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Brand / Model</label>
              <input
                type="text"
                value={formData.brandModel}
                onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Dell / ASUS"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Condition</label>
              <select
                value={formData.currentCondition}
                onChange={(e) => setFormData({ ...formData, currentCondition: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                {conditions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Operational Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Maintenance / Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional notes or specifications update..."
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

