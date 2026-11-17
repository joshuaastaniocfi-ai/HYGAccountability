import React, { useState } from 'react';
import { X, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function MaintenanceModal({ isOpen, onClose, item, onItemUpdated }) {
  const [formData, setFormData] = useState({
    status: item?.status || 'Under Maintenance',
    currentCondition: item?.currentCondition || 'Fair',
    remarks: '',
    performedBy: 'N/A',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.updateItem(item._id, {
        status: formData.status,
        currentCondition: formData.currentCondition,
        remarks: formData.remarks.trim(),
        performedBy: formData.performedBy.trim(),
      });
      if (onItemUpdated) onItemUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update maintenance status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Equipment Maintenance & Status</h3>
              <p className="text-xs text-slate-500">{item.itemDescription}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Target Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Asset Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Available', value: 'Available' },
                { label: 'Under Maintenance', value: 'Under Maintenance' },
                { label: 'Decommissioned', value: 'Decommissioned' },
              ].map((st) => (
                <button
                  type="button"
                  key={st.value}
                  onClick={() => setFormData({ ...formData, status: st.value })}
                  className={`py-2 text-center rounded-lg border font-semibold text-[11px] transition ${
                    formData.status === st.value
                      ? st.value === 'Under Maintenance'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500'
                        : st.value === 'Available'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                        : 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Current Condition
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['New', 'Good', 'Fair', 'Damaged'].map((cond) => (
                <button
                  type="button"
                  key={cond}
                  onClick={() => setFormData({ ...formData, currentCondition: cond })}
                  className={`py-2 text-center rounded-lg border font-semibold text-[11px] transition ${
                    formData.currentCondition === cond
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Maintenance Action Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Maintenance / Service Notes *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Sent to authorized service center for battery replacement; cleaned thermal fan."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Logged by */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Logged By
            </label>
            <input
              type="text"
              required
              value={formData.performedBy}
              onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.remarks.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Update Maintenance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

