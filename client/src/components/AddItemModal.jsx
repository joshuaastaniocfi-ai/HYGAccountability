import React, { useState, useEffect } from 'react';
import { X, PackagePlus, AlertOctagon, Boxes } from 'lucide-react';
import { api } from '../services/api';
import BatchIntakeModal from './BatchIntakeModal';

export default function AddItemModal({ isOpen, onClose, onItemAdded, initialMode = 'single' }) {
  const [mode, setMode] = useState(initialMode); // 'single' | 'batch'
  const [formData, setFormData] = useState({
    assetTag: '',
    itemDescription: '',
    equipmentType: '',
    brandModel: '',
    serialNumber: '',
    category: 'Laptops & Desktops',
    currentCondition: 'Good',
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

  const detectEquipmentType = (desc) => {
    const d = (desc || '').toLowerCase();
    if (d.includes('battery')) return 'UPS Battery';
    if (d.includes('ups') || d.includes('back-ups')) return 'UPS';
    if (d.includes('mouse')) return 'Mouse';
    if (d.includes('keyboard')) return 'Keyboard';
    if (d.includes('monitor')) return 'Monitor';
    if (d.includes('laptop') || d.includes('macbook') || d.includes('thinkpad')) return 'Laptop';
    if (d.includes('desktop') || d.includes('system unit') || d.includes('cpu')) return 'Desktop';
    if (d.includes('scanner') || d.includes('barcode')) return 'Barcode Scanner';
    if (d.includes('printer')) return 'Printer';
    if (d.includes('tablet') || d.includes('ipad')) return 'Tablet';
    if (d.includes('pos') || d.includes('terminal')) return 'POS Terminal';
    return '';
  };

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    const detected = detectEquipmentType(val);
    setFormData((prev) => ({
      ...prev,
      itemDescription: val,
      equipmentType: detected || prev.equipmentType || '',
      category:
        detected === 'UPS Battery' || detected === 'UPS'
          ? 'Office Equipment'
          : prev.category,
    }));
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFormData({
        assetTag: '',
        itemDescription: '',
        equipmentType: '',
        brandModel: '',
        serialNumber: '',
        category: 'Laptops & Desktops',
        currentCondition: 'Good',
        remarks: '',
      });
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  if (mode === 'batch') {
    return (
      <BatchIntakeModal
        isOpen={isOpen}
        onClose={() => {
          setMode('single');
          onClose();
        }}
        onBatchCreated={(res) => {
          if (onItemAdded) {
            onItemAdded(res.items?.[0] || res.batch);
          }
        }}
      />
    );
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await api.createItem(formData);
      onItemAdded(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Equipment / Item</h3>
              <p className="text-xs text-slate-500">Register company asset into inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold mt-3">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              mode === 'single'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Single Asset</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className="flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1.5 text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold"
          >
            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
            <span>Batch Intake (Bulk e.g. 10 Units)</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Asset Tag *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CFI-LAP-005"
                value={formData.assetTag}
                onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Item Name / Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UPS Battery, Dell Latitude 5420 Laptop"
                value={formData.itemDescription}
                onChange={handleDescriptionChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Equipment Type *
              </label>
              <select
                value={formData.equipmentType}
                onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
              >
                <option value="">-- Auto-Detect from Name --</option>
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
              <label className="block font-semibold text-slate-700 mb-1">
                Brand & Model *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dell Latitude 5420"
                value={formData.brandModel}
                onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SN-89472-X"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Current Condition *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['New', 'Good', 'Fair'].map((cond) => (
                <button
                  type="button"
                  key={cond}
                  onClick={() => setFormData({ ...formData, currentCondition: cond })}
                  className={`py-2 text-center rounded-lg border font-semibold transition ${
                    formData.currentCondition === cond
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Accessories / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Includes charger, power cord, carrying sleeve"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
