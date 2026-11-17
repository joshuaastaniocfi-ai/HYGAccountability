import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, AlertOctagon, Loader2 } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  targetType = 'item', // 'item' | 'employee'
  targetData = null,
  loading = false,
  error = null,
}) {
  const [force, setForce] = useState(false);

  if (!isOpen || !targetData) return null;

  const isAssigned =
    targetType === 'employee'
      ? Boolean(targetData.activeItemsCount > 0 || targetData.activeAccountabilitiesCount > 0)
      : targetType === 'equipmentGroup'
      ? Boolean((targetData.assigned || 0) > 0)
      : targetData.status === 'Assigned';

  const name =
    targetType === 'employee'
      ? targetData.name || targetData.employeeId
      : targetType === 'equipmentGroup'
      ? `${targetData.equipmentType} Equipment Group`
      : targetData.itemDescription || targetData.equipmentType || targetData.assetTag;

  const subInfo =
    targetType === 'employee'
      ? `${targetData.employeeId || ''} • ${targetData.department || ''} (${targetData.company || 'CFI'})`
      : targetType === 'equipmentGroup'
      ? `Total Fleet: ${targetData.total || 0} unit(s) • Assigned: ${targetData.assigned || 0} • In-Stock: ${targetData.available || 0}`
      : `Tag: ${targetData.assetTag || targetData.propertyTag || targetData.itemNumber || 'N/A'} • S/N: ${targetData.serialNumber || 'N/A'}`;

  const handleConfirm = () => {
    onConfirm(targetData, force);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                Permanent action &bull; This cannot be undone
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

        {/* Target Details Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {targetType === 'employee'
              ? 'Employee Record'
              : targetType === 'equipmentGroup'
              ? 'Equipment Type Group'
              : 'Equipment Asset'}
          </span>
          <div className="font-bold text-slate-900 text-sm">{name}</div>
          <div className="text-xs text-slate-500 font-mono truncate">{subInfo}</div>
        </div>

        {/* Assigned Warning / Force Option */}
        {isAssigned && (
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-xs text-amber-900">
            <div className="flex items-center space-x-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Warning: Active Assignment Detected</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {targetType === 'employee'
                ? `This employee currently has ${targetData.activeItemsCount || 'active'} assigned item(s). Deleting will remove their record from active custody tracking.`
                : targetType === 'equipmentGroup'
                ? `This equipment group currently has ${targetData.assigned || 0} unit(s) actively assigned. Confirming force deletion will delete all ${targetData.total || 0} unit(s) of this equipment type permanently.`
                : `This equipment is currently marked as "Assigned" to a custodian. Deleting will permanently remove it from inventory.`}
            </p>
            <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-800">
                Confirm force deletion
              </span>
            </label>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (isAssigned && !force)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-sm transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete {targetType === 'employee' ? 'Employee' : 'Equipment'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

