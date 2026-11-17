import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertOctagon,
  Layers,
  CheckSquare,
  Square,
  Archive,
  Info,
  Package,
} from 'lucide-react';
import { api } from '../services/api';

export default function ReturnModal({
  isOpen,
  onClose,
  onSubmit,
  formId,
  record: initialRecord,
  item = null, // specific component if opened from row action
  isBulk = false,
  initialMode = null,
}) {
  const [record, setRecord] = useState(initialRecord || null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  // Return scope mode: 'set' | 'component' | 'all'
  const [scopeMode, setScopeMode] = useState('set');
  const [selectedSetTag, setSelectedSetTag] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());

  // Form details
  const [formData, setFormData] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    conditionUponReturn: 'Good',
    completeness: 'Complete',
    incompleteNotes: '',
    chargesAssessment: 'No charges',
    chargesAmount: 0,
    notes: '',
    approvedBy: 'N/A',
    inspectedBy: 'N/A',
    employeeSignature: '',
  });

  const [makeAvailable, setMakeAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch record if not provided but formId is given
  useEffect(() => {
    if (!isOpen) return;

    if (initialRecord) {
      setRecord(initialRecord);
    } else if (formId) {
      setLoadingRecord(true);
      api
        .getAccountability(formId)
        .then((data) => setRecord(data))
        .catch((err) => console.error('Error fetching accountability record:', err))
        .finally(() => setLoadingRecord(false));
    }
  }, [isOpen, initialRecord, formId]);

  // Determine active items and available sets
  const activeItems = (record?.items || []).filter((i) => i.status === 'Active');
  const activeSets = Array.from(
    new Set(activeItems.map((i) => i.setTag).filter(Boolean))
  );

  // Initialize selection when modal opens or item/record changes
  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      // Opened for a specific component
      setScopeMode('component');
      const targetId = item._id || item.item?._id || item.item;
      setSelectedItemIds(new Set(targetId ? [targetId.toString()] : []));
      if (item.setTag) {
        setSelectedSetTag(item.setTag);
      } else if (activeSets.length > 0) {
        setSelectedSetTag(activeSets[0]);
      }
    } else if (initialMode) {
      setScopeMode(initialMode);
      if (activeSets.length > 0) setSelectedSetTag(activeSets[0]);
      setSelectedItemIds(new Set(activeItems.map((i) => (i._id || i.item).toString())));
    } else if (isBulk) {
      if (activeSets.length > 0) {
        setScopeMode('set');
        setSelectedSetTag(activeSets[0]);
      } else {
        setScopeMode('all');
      }
      setSelectedItemIds(new Set(activeItems.map((i) => (i._id || i.item).toString())));
    } else {
      if (activeSets.length > 0) {
        setScopeMode('set');
        setSelectedSetTag(activeSets[0]);
      } else {
        setScopeMode('component');
      }
      setSelectedItemIds(new Set(activeItems.map((i) => (i._id || i.item).toString())));
    }
  }, [isOpen, item, isBulk, initialMode, record]);

  if (!isOpen) return null;

  const handleConditionChange = (cond) => {
    setFormData((prev) => ({ ...prev, conditionUponReturn: cond }));
    if (cond === 'Excellent' || cond === 'Good' || cond === 'Fair') {
      setMakeAvailable(true);
    } else if (cond === 'Damaged') {
      setMakeAvailable(false);
    }
  };

  const toggleItemSelection = (idStr) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
      }
      return next;
    });
  };

  const selectAllItems = () => {
    setSelectedItemIds(new Set(activeItems.map((i) => (i._id || i.item).toString())));
  };

  const deselectAllItems = () => {
    setSelectedItemIds(new Set());
  };

  const selectSetComponents = (setTag) => {
    const setItemIds = activeItems
      .filter((i) => i.setTag === setTag)
      .map((i) => (i._id || i.item).toString());
    setSelectedItemIds(new Set(setItemIds));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        makeAvailable,
      };

      if (scopeMode === 'set') {
        if (!selectedSetTag) {
          throw new Error('Please select an equipment set to return.');
        }
        payload.setTag = selectedSetTag;
      } else if (scopeMode === 'component') {
        if (selectedItemIds.size === 0) {
          throw new Error('Please select at least one component to return.');
        }
        payload.itemIds = Array.from(selectedItemIds);
      } else {
        // Return entire form
        payload.itemIds = [];
        payload.setTag = null;
      }

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process return');
    } finally {
      setLoading(false);
    }
  };

  // Items in currently selected set
  const itemsInSelectedSet = activeItems.filter((i) => i.setTag === selectedSetTag);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900">
                Process Equipment Return
              </h3>
              {record?.formNumber && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {record.formNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Custodian:{' '}
              <strong className="text-slate-700">
                {record?.employeeInfo?.name || 'Store Custodian'}
              </strong>{' '}
              ({record?.employeeInfo?.department || record?.employeeInfo?.company || 'Staff'})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2 shrink-0">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Informational notice when single component was selected from row */}
        {item && item.setTag && (
          <div className="mx-5 mt-3 p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-xl flex items-start space-x-2 shrink-0">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span>
                You selected <strong>{item.itemDescription || item.equipment || 'Item'}</strong>, which is part of the{' '}
                <strong>{item.setTag}</strong>.
              </span>
              <div className="text-[11px] text-indigo-700 mt-0.5">
                You can return just this component, or switch to <strong>Return by Set</strong> to return the entire package at once.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
            {/* Scope Selection Tabs */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px] tracking-wider">
                Select Return Method
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                {/* 1. By Set */}
                <button
                  type="button"
                  onClick={() => setScopeMode('set')}
                  disabled={activeSets.length === 0}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    scopeMode === 'set'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : activeSets.length === 0
                      ? 'text-slate-400 cursor-not-allowed opacity-60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Return by Set {activeSets.length > 0 ? `(${activeSets.length})` : ''}</span>
                </button>

                {/* 2. By Component */}
                <button
                  type="button"
                  onClick={() => setScopeMode('component')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    scopeMode === 'component'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>By Component ({selectedItemIds.size})</span>
                </button>

                {/* 3. Entire Form */}
                <button
                  type="button"
                  onClick={() => setScopeMode('all')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    scopeMode === 'all'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>All Active ({activeItems.length})</span>
                </button>
              </div>
            </div>

            {/* TAB VIEW 1: RETURN BY SET */}
            {scopeMode === 'set' && (
              <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Choose Pre-Set Package to Return:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Returns all components belonging to the chosen set
                  </span>
                </div>

                <div className="space-y-2">
                  {activeSets.map((tag) => {
                    const setUnits = activeItems.filter((i) => i.setTag === tag);
                    const isSelected = selectedSetTag === tag;

                    return (
                      <div
                        key={tag}
                        onClick={() => setSelectedSetTag(tag)}
                        className={`p-3 rounded-xl border-2 transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="selectedSetTag"
                              checked={isSelected}
                              onChange={() => setSelectedSetTag(tag)}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="font-bold text-sm text-slate-900">{tag}</div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-emerald-200 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {setUnits.length} active component{setUnits.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* List of items inside this set */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-1.5 text-[11px]">
                          {setUnits.map((u, uIdx) => (
                            <div
                              key={u._id || uIdx}
                              className="flex items-center space-x-1.5 text-slate-600 truncate"
                            >
                              <span className="text-emerald-600 font-bold">&bull;</span>
                              <span className="font-medium truncate">
                                {u.itemDescription || u.equipment || 'Item'}
                              </span>
                              {u.serialNumber && u.serialNumber !== 'N/A' && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  ({u.serialNumber})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB VIEW 2: RETURN BY COMPONENT */}
            {scopeMode === 'component' && (
              <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-xs">
                      Select Individual Components:
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {selectedItemIds.size} of {activeItems.length} selected
                    </span>
                  </div>
                  <div className="space-x-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={selectAllItems}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold hover:bg-slate-100 text-slate-700"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllItems}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold hover:bg-slate-100 text-slate-700"
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {activeItems.map((formItem, idx) => {
                    const idStr = (formItem._id || formItem.item).toString();
                    const isChecked = selectedItemIds.has(idStr);

                    return (
                      <label
                        key={idStr || idx}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItemSelection(idStr)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 truncate flex items-center space-x-2">
                              <span>{formItem.itemDescription || formItem.equipment || 'Item'}</span>
                              {formItem.setTag && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {formItem.setTag}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center space-x-2">
                              {formItem.itemNumber && <span>Tag: {formItem.itemNumber}</span>}
                              {formItem.serialNumber && formItem.serialNumber !== 'N/A' && (
                                <span>SN: {formItem.serialNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-500 shrink-0 ml-2 font-medium">
                          {formItem.conditionAtIssuance || 'Good'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB VIEW 3: RETURN ALL */}
            {scopeMode === 'all' && (
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-300 text-emerald-950 space-y-2">
                <div className="flex items-center space-x-2">
                  <Archive className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-xs">Return Entire Accountability Record</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  This will process the return of all <strong>{activeItems.length} active equipment units</strong> in this form,
                  closing the form as fully returned upon confirmation.
                </p>
              </div>
            )}

            {/* Return Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Return Date
              </label>
              <input
                type="date"
                required
                value={formData.returnDate}
                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Condition Upon Return */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Condition Upon Return
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['Excellent', 'Good', 'Fair', 'Damaged'].map((cond) => (
                  <button
                    type="button"
                    key={cond}
                    onClick={() => handleConditionChange(cond)}
                    className={`py-2 text-center rounded-lg border font-semibold transition ${
                      formData.conditionUponReturn === cond
                        ? cond === 'Damaged'
                          ? 'bg-rose-50 border-rose-400 text-rose-700 ring-1 ring-rose-400'
                          : 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
              {formData.conditionUponReturn === 'Damaged' && (
                <p className="text-[11px] text-rose-600 mt-1">
                  Note: Damaged condition automatically routes the returned units to Under Maintenance / Repair queue.
                </p>
              )}
            </div>

            {/* Availability Upon Return Toggle Card */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                makeAvailable
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs">Inventory Availability</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        makeAvailable
                          ? 'bg-emerald-200/90 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-200/90 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {makeAvailable ? 'Available for Reissuance' : 'Under Maintenance / Hold'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {makeAvailable
                      ? '✅ Returned units will be made available in inventory immediately.'
                      : '⚠️ Returned units will be placed in "Under Maintenance" / repair queue.'}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={makeAvailable}
                  onClick={() => setMakeAvailable(!makeAvailable)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    makeAvailable ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      makeAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Completeness */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Return Completeness
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Complete', 'Incomplete'].map((comp) => (
                  <button
                    type="button"
                    key={comp}
                    onClick={() => setFormData({ ...formData, completeness: comp })}
                    className={`py-2 text-center rounded-lg border font-semibold transition ${
                      formData.completeness === comp
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
              {formData.completeness === 'Incomplete' && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Specify missing cables, adapters, brackets, box, etc."
                    value={formData.incompleteNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, incompleteNotes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Charges Assessment */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Charges Assessment (for damage or missing parts)
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {['No charges', 'Charges Applicable'].map((charge) => (
                  <button
                    type="button"
                    key={charge}
                    onClick={() => setFormData({ ...formData, chargesAssessment: charge })}
                    className={`py-2 text-center rounded-lg border font-semibold transition ${
                      formData.chargesAssessment === charge
                        ? charge === 'Charges Applicable'
                          ? 'bg-amber-50 border-amber-400 text-amber-800 ring-1 ring-amber-400'
                          : 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {charge}
                  </button>
                ))}
              </div>

              {formData.chargesAssessment === 'Charges Applicable' && (
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-600">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.chargesAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, chargesAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Notes / Remarks */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Inspection Notes / Remarks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Returned equipment verified working, minimal cosmetic wear."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Inspected By
                </label>
                <input
                  type="text"
                  required
                  value={formData.inspectedBy}
                  onChange={(e) => setFormData({ ...formData, inspectedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Approved By
                </label>
                <input
                  type="text"
                  required
                  value={formData.approvedBy}
                  onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons (Pinned Bottom) */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <div className="text-xs text-slate-500">
              {scopeMode === 'set' ? (
                <span>
                  Returning entire <strong>{selectedSetTag || 'Set'}</strong> ({itemsInSelectedSet.length} items)
                </span>
              ) : scopeMode === 'component' ? (
                <span>
                  Returning <strong>{selectedItemIds.size}</strong> component{selectedItemIds.size !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>
                  Returning all <strong>{activeItems.length}</strong> items in form
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  (scopeMode === 'component' && selectedItemIds.size === 0) ||
                  (scopeMode === 'set' && !selectedSetTag)
                }
                className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Processing...'
                    : scopeMode === 'set'
                    ? `Confirm Return (${selectedSetTag || 'Set'})`
                    : scopeMode === 'component'
                    ? `Confirm Return (${selectedItemIds.size} Component${selectedItemIds.size !== 1 ? 's' : ''})`
                    : `Confirm Return (All ${activeItems.length})`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
