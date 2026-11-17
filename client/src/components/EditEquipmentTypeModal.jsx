import React, { useState, useEffect } from 'react';
import { X, Pencil, AlertOctagon, Boxes, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  'Laptops & Desktops',
  'Office Equipment',
  'Printers & Peripherals',
  'Warehouse & Barcode Scanners',
  'Laboratory & QA Equipment',
  'Mobile & Tablets',
  'Production & Machinery',
  'Other',
];

export default function EditEquipmentTypeModal({ isOpen, onClose, group, onSuccess }) {
  const [newType, setNewType] = useState('');
  const [category, setCategory] = useState('Office Equipment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && group) {
      setNewType(group.equipmentType || '');
      setCategory(group.category || 'Office Equipment');
      setError(null);
    }
  }, [isOpen, group]);

  if (!isOpen || !group) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newType.trim()) {
      setError('Equipment Type name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.updateEquipmentType(group.equipmentType, newType.trim(), category);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update equipment type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Equipment Type</h3>
              <p className="text-xs text-slate-500">
                Rename or reclassify this inventory group
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

        {/* Group Scope Overview */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Current Group:</span>
            <span className="font-bold text-slate-900">{group.equipmentType}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Fleet Affected:</span>
            <span className="font-mono font-semibold text-slate-700">
              {group.total} unit(s) ({group.assigned} assigned, {group.available} in stock)
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Equipment Type Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="e.g. UPS Battery, Laptop, Desktop Set"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Classification <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

