import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Wrench,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Store,
  FileText,
  Search,
  Check,
  ShieldCheck,
  Laptop,
  Zap,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function ReplaceWholeModal({ isOpen, onClose, targetItem, onSuccess }) {
  const { user } = useAuth();

  const [disposition, setDisposition] = useState('For Repair'); // 'For Repair' | 'For Disposal'
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');

  const [availableItems, setAvailableItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Common defect presets
  const defectPresets = [
    'Motherboard / Mainboard hardware failure',
    'Liquid spill / water damage',
    'Screen shattered / broken display hinges',
    'Power circuit short / will not power on',
    'Persistent system crash / SSD failure',
    'Physical body impact & casing damage',
    'Battery failure / thermal swelling',
    'Optical barcode scanner sensor defective',
  ];

  // Fetch available replacement items
  useEffect(() => {
    if (isOpen && targetItem) {
      setError(null);
      setReason('');
      setCustomReason('');
      setNotes('');
      setDisposition('For Repair');
      fetchAvailableItems();
    }
  }, [isOpen, targetItem]);

  const fetchAvailableItems = async () => {
    setLoadingInventory(true);
    try {
      const items = await api.getItems({ status: 'Available' });
      // Exclude the target item itself if somehow available
      const cleanItems = items.filter((i) => i._id !== targetItem?._id);
      setAvailableItems(cleanItems);

      // Auto-select first matching equipment type
      const targetType = targetItem?.equipmentType;
      const matchingItems = cleanItems.filter(
        (i) => i.equipmentType === targetType || i.category === targetItem?.category
      );

      if (matchingItems.length > 0) {
        setSelectedReplacementId(matchingItems[0]._id);
      } else if (cleanItems.length > 0) {
        setSelectedReplacementId(cleanItems[0]._id);
      } else {
        setSelectedReplacementId('');
      }
    } catch (err) {
      console.error('Error fetching available replacement equipment:', err);
      setError('Failed to fetch available replacement units from inventory.');
    } finally {
      setLoadingInventory(false);
    }
  };

  if (!isOpen || !targetItem) return null;

  // Filter available items according to search and type toggle
  const filteredAvailable = availableItems.filter((item) => {
    // If not showing all types, restrict to matching equipmentType or category
    if (!showAllTypes) {
      const matchesType =
        item.equipmentType && targetItem.equipmentType
          ? item.equipmentType.toLowerCase() === targetItem.equipmentType.toLowerCase()
          : item.category === targetItem.category;
      if (!matchesType) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchText =
        item.itemDescription?.toLowerCase().includes(q) ||
        item.brandModel?.toLowerCase().includes(q) ||
        item.serialNumber?.toLowerCase().includes(q) ||
        item.assetTag?.toLowerCase().includes(q) ||
        item.itemNumber?.toLowerCase().includes(q);
      if (!matchText) return false;
    }

    return true;
  });

  const selectedReplacement = availableItems.find((i) => i._id === selectedReplacementId);

  const activeCustodianName =
    targetItem.currentAssignment?.employeeName ||
    targetItem.currentAssignment?.storeName ||
    'Assigned Custodian';

  const isStoreCustody =
    targetItem.currentAssignment?.accountabilityType === 'Store' ||
    Boolean(targetItem.currentAssignment?.storeName);

  const formNumber = targetItem.currentAssignment?.formNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const finalReason = reason === 'Other' ? customReason.trim() : reason || customReason.trim();

    if (!finalReason) {
      setError('Please select or specify a defect reason for replacing this unit.');
      return;
    }

    if (!selectedReplacementId) {
      setError('Please select a valid replacement unit from available inventory.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        oldUnit: {
          disposition,
          condition: disposition === 'For Repair' ? 'Under Repair' : 'Damaged',
          reason: finalReason,
        },
        newReplacementItemId: selectedReplacementId,
        performedBy: user?.name || 'IT Systems Administrator',
        notes: notes.trim(),
      };

      await api.replaceWhole(targetItem._id, payload);

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Failed to replace whole unit:', err);
      setError(err.message || 'Failed to process whole unit replacement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header (Pinned Top) */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition z-10"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Hardware Swap / RMA
                </span>
                <span className="text-xs text-slate-400">
                  {targetItem.equipmentType || 'Equipment'}
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-1">
                Replace Whole Equipment Unit
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-xl">
            Swap out an active defective unit for an available unit in inventory. The accountability
            form & custodian custody will be transferred automatically.
          </p>
        </div>

        {/* Current Issued Unit Card (Pinned Top) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {targetItem.assetTag || targetItem.itemNumber}
                  </span>
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    Defective Unit (To Swap)
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-1">
                  {targetItem.itemDescription}
                </h4>
                <p className="text-xs text-slate-500">
                  Model: <span className="font-semibold text-slate-700">{targetItem.brandModel}</span> | S/N:{' '}
                  <span className="font-mono font-semibold text-slate-700">{targetItem.serialNumber}</span>
                </p>
              </div>
            </div>

            {/* Custodian tag */}
            <div className="sm:text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Active Custodian
              </span>
              <div className="flex items-center sm:justify-end space-x-1.5 mt-0.5">
                {isStoreCustody ? (
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span className="font-bold text-xs text-slate-800">{activeCustodianName}</span>
              </div>
              {formNumber && (
                <span className="text-[10px] font-mono text-slate-500 block">
                  Form: {formNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs">
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

          {/* Section 1: Disposition of Defective Unit */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1. Disposition of Defective Unit (Old Item)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: For Repair */}
              <button
                type="button"
                onClick={() => setDisposition('For Repair')}
                className={`p-4 rounded-2xl border text-left transition flex items-start space-x-3 ${
                  disposition === 'For Repair'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    disposition === 'For Repair'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                    <span>Route to "For Repair"</span>
                    {disposition === 'For Repair' && (
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Unit will be placed in IT maintenance queue for troubleshooting, board repair,
                    or warranty supplier RMA.
                  </p>
                </div>
              </button>

              {/* Option B: For Disposal */}
              <button
                type="button"
                onClick={() => setDisposition('For Disposal')}
                className={`p-4 rounded-2xl border text-left transition flex items-start space-x-3 ${
                  disposition === 'For Disposal'
                    ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    disposition === 'For Disposal'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                    <span>Designate "For Disposal"</span>
                    {disposition === 'For Disposal' && (
                      <Check className="w-3.5 h-3.5 text-rose-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Unit is totally damaged, unrepairable, or obsolete. Routed to corporate E-waste /
                    asset retirement protocol.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Defect Reason */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              2. Defect / Reason for Whole Unit Swap <span className="text-rose-500">*</span>
            </label>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {defectPresets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    setReason(preset);
                    setCustomReason('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                    reason === preset
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setReason('Other')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                  reason === 'Other'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                Other Reason...
              </button>
            </div>

            {/* Custom reason input if "Other" or desired */}
            {(reason === 'Other' || !reason) && (
              <input
                type="text"
                placeholder="Explain defect (e.g. Unit fails to boot after power surge)..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </div>

          {/* Section 3: Select Available Replacement Unit */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  3. Select Replacement Unit from In-Stock Inventory{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Currently showing available units ready for immediate issuance
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center space-x-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAllTypes}
                    onChange={(e) => setShowAllTypes(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Show all equipment types</span>
                </label>
              </div>
            </div>

            {/* Search filter for available units */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search available units by Tag, Model, or Serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Available Items List */}
            {loadingInventory ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                Scanning inventory stock...
              </div>
            ) : filteredAvailable.length === 0 ? (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center text-xs text-amber-800 space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto" />
                <p className="font-bold">
                  No available {targetItem.equipmentType || 'equipment'} units found in stock.
                </p>
                <p className="text-amber-700">
                  There are currently no "Available" {targetItem.equipmentType || 'units'}. Check
                  "Show all equipment types" above or intake new units via Batch Intake first.
                </p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {filteredAvailable.map((item) => {
                  const isSelected = item._id === selectedReplacementId;
                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedReplacementId(item._id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {item.assetTag || item.itemNumber}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {item.equipmentType || item.category}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                              {item.currentCondition}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-slate-900 mt-0.5">
                            {item.brandModel || item.itemDescription}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            SN: {item.serialNumber}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                          In Stock Ready
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Swap Preview & Custody Transfer Summary */}
          {selectedReplacement && (
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Custody Transfer Summary</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Defective Unit (Old)
                  </span>
                  <div className="font-bold text-slate-800">
                    {targetItem.assetTag || targetItem.itemNumber} - {targetItem.brandModel}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Status will become:{' '}
                    <strong
                      className={
                        disposition === 'For Repair' ? 'text-amber-700' : 'text-rose-700'
                      }
                    >
                      {disposition}
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-500">Custody will be cleared.</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Replacement Unit (New)
                  </span>
                  <div className="font-bold text-emerald-800">
                    {selectedReplacement.assetTag || selectedReplacement.itemNumber} -{' '}
                    {selectedReplacement.brandModel}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Status will become: <strong className="text-emerald-700">Assigned</strong>
                  </div>
                  <div className="text-[11px] text-slate-600 font-semibold">
                    Assigned to: {activeCustodianName}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Optional notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Additional Technical Notes / Work Order Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. RMA warranty ticket #4819 filed with Lenovo; transferred laptop bag & charger..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Modal Footer (Pinned Bottom) */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedReplacementId}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Swap...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Confirm & Replace Whole Unit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}

