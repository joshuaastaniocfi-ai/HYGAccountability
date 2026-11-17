import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  User,
  History,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquarePlus,
  ShieldCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  Info,
  Tag,
  Wrench,
  Printer,
  Store,
  Layers,
  Check,
  AlertOctagon,
  Boxes,
  Building2,
  RotateCcw,
  RefreshCw,
  BatteryCharging,
  Cpu,
  Trash2,
  Pencil,
} from 'lucide-react';
import { api } from '../services/api';
import ReturnModal from '../components/ReturnModal';
import AddRemarkModal from '../components/AddRemarkModal';
import AssetTagModal from '../components/AssetTagModal';
import MaintenanceModal from '../components/MaintenanceModal';
import ReplacePartModal from '../components/ReplacePartModal';
import ReplaceWholeModal from '../components/ReplaceWholeModal';
import EditItemModal from '../components/EditItemModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('custody'); // 'custody' | 'notes'
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [isAssetTagOpen, setIsAssetTagOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isReplacePartOpen, setIsReplacePartOpen] = useState(false);
  const [selectedPartToReplace, setSelectedPartToReplace] = useState(null);
  const [isReplaceWholeOpen, setIsReplaceWholeOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleConfirmDeleteItem = async (target, force) => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await api.deleteItem(id, force);
      navigate('/items');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete item');
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchItemData = async () => {
    try {
      setLoading(true);
      const res = await api.getItem(id);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemData();
  }, [id]);

  const handleReturnSubmit = async (formData) => {
    const formId = data?.currentAssignment?.accountabilityId || activeOwnership?.recordId;
    if (!formId) return;
    await api.returnItem(formId, id, formData);
    await fetchItemData();
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500">
        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-semibold text-slate-700">Loading equipment history file...</p>
        <p className="text-slate-400 mt-1">Retrieving custody chain, signed forms, and audit notes</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-2xl text-xs flex items-center justify-between shadow-xs">
          <div>
            <p className="font-bold text-sm">Failed to load equipment file</p>
            <p className="text-rose-600 mt-0.5">{error || 'Equipment not found'}</p>
          </div>
          <button
            onClick={() => navigate('/items')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  const { item, currentAssignment, ownershipHistory = [], timelineEvents = [] } = data;

  const isAssigned = item.status === 'Assigned';
  const isAvailable = item.status === 'Available';
  const isMaintenance = item.status === 'Under Maintenance';

  // Active ownership record (if currently assigned)
  const activeOwnership = ownershipHistory.find((h) => h.status === 'Active');

  // Sorted assignments: Active first, then by date descending
  const sortedAssignments = [...ownershipHistory].sort((a, b) => {
    if (a.status === 'Active') return -1;
    if (b.status === 'Active') return 1;
    return new Date(b.dateIssued || 0) - new Date(a.dateIssued || 0);
  });

  // Consolidated notes collections
  const baseRemarks = item.remarks;
  const issuanceNotes = ownershipHistory.filter((h) => h.issuanceRemarks?.trim());
  const returnNotes = ownershipHistory.filter((h) => h.returnDetails?.notes?.trim());
  const auditNotes = (timelineEvents || []).filter(
    (e) => e.action === 'NOTE_ADDED' || e.action === 'MAINTENANCE' || e.action === 'CONDITION_UPDATE'
  );
  const totalNotesCount =
    (baseRemarks?.trim() ? 1 : 0) + issuanceNotes.length + returnNotes.length + auditNotes.length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/items"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Equipment Catalog</span>
        </Link>
      </div>

      {/* Item Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
        {/* 1. Header: Equipment Identity (Full Width) */}
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/15 shrink-0 border border-slate-700/50">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
                {item.assetTag}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold shadow-2xs ${
                  isAvailable
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isAssigned
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {item.status}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Condition: <strong className="text-slate-900 font-bold">{item.currentCondition}</strong>
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                {item.category}
              </span>
              {item.equipmentType && (
                <span className="text-xs px-3 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {item.equipmentType}
                </span>
              )}
            </div>

            {/* Equipment Name / Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug break-words">
              {item.itemDescription}
            </h1>

            {/* Technical Metadata Specs */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium pt-0.5">
              <span>
                Brand / Model: <strong className="text-slate-800 font-semibold">{item.brandModel}</strong>
              </span>
              <span>
                Serial Number:{' '}
                <strong className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {item.serialNumber}
                </strong>
              </span>
              {item.itemNumber && (
                <span>
                  Item ID: <strong className="font-mono text-slate-800 font-semibold">{item.itemNumber}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Full-Width Action Toolbar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline-block">
              Actions:
            </span>

            <button
              onClick={() => {
                setSelectedPartToReplace(null);
                setIsReplacePartOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition shadow-2xs"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>Replace Part / Battery</span>
            </button>

            {isAssigned && (
              <button
                onClick={() => setIsReplaceWholeOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold rounded-xl transition shadow-2xs"
              >
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>Replace Whole Unit</span>
              </button>
            )}

            <Link
              to={`/history/item/${item._id}`}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl transition shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>Full History Trail</span>
            </Link>

            <button
              onClick={() => setIsAssetTagOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Print Sticker</span>
            </button>

            <button
              onClick={() => setIsMaintenanceOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              <span>Maintenance</span>
            </button>

            <button
              onClick={() => setIsRemarkModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Add Note</span>
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl transition shadow-2xs"
              title="Edit equipment details"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => {
                setDeleteError(null);
                setIsDeleteModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl transition shadow-2xs"
              title="Delete this equipment item"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {isAssigned && (
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <span>Process Return</span>
              </button>
            )}

            {isAvailable && (
              <Link
                to={`/forms/new?itemId=${item._id}`}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-600/30 transition"
              >
                <span>Issue Equipment Form &rarr;</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3. Accessories, Specifications & Operating Notes (Full Width) */}
        {item.remarks ? (
          <div className="p-4 sm:p-5 bg-slate-50/90 rounded-2xl text-xs text-slate-700 border border-slate-200/80 space-y-2">
            <div className="font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">Accessories, Specifications & Operating Notes:</span>
              </span>
              <button
                onClick={() => setIsRemarkModalOpen(true)}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold transition hover:underline"
              >
                + Add Note
              </button>
            </div>
            <p className="leading-relaxed text-slate-600 whitespace-pre-line pl-6">
              {item.remarks}
            </p>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setIsRemarkModalOpen(true)}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-700 font-medium py-1.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50/60 transition"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-slate-400" />
              <span>+ Add accessories, specs, or equipment note</span>
            </button>
          </div>
        )}

        {/* 4. Current Custodian Status Banner */}
        <div className="pt-2">
          {isAssigned && (currentAssignment || activeOwnership) ? (
            <div className="bg-gradient-to-r from-indigo-50/80 via-indigo-50/50 to-white border border-indigo-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-indigo-600/30">
                    {(currentAssignment?.accountabilityType || activeOwnership?.accountabilityType) === 'Store' ? (
                      <Store className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                        {(currentAssignment?.accountabilityType || activeOwnership?.accountabilityType) === 'Store'
                          ? 'Store Group Accountability'
                          : (currentAssignment?.accountabilityType || activeOwnership?.accountabilityType) === 'Department'
                          ? 'Department Group Accountability'
                          : (currentAssignment?.accountabilityType || activeOwnership?.accountabilityType) === 'Office'
                          ? 'Office Group Accountability'
                          : 'Current Active Custodian'}
                      </span>
                      {(currentAssignment?.storeName || activeOwnership?.storeName) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {currentAssignment?.storeName || activeOwnership?.storeName}
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {currentAssignment?.employee || activeOwnership?.employee?.id ? (
                        <Link
                          to={`/employees/${currentAssignment?.employee || activeOwnership?.employee?.id}`}
                          className="hover:text-indigo-600 transition inline-flex items-center space-x-1.5"
                        >
                          <span>
                            {currentAssignment?.employeeName || activeOwnership?.employee?.name}
                          </span>
                          {(currentAssignment?.employeeId || activeOwnership?.employee?.employeeId) && (
                            <span className="font-mono text-xs text-slate-500 font-normal">
                              ({currentAssignment?.employeeId || activeOwnership?.employee?.employeeId})
                            </span>
                          )}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      ) : (
                        <span>
                          {currentAssignment?.employeeName ||
                            activeOwnership?.employee?.name ||
                            currentAssignment?.storeName}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5">
                      {currentAssignment?.department || activeOwnership?.employee?.department || 'Operations'}{' '}
                      &bull; Issued on{' '}
                      {new Date(
                        currentAssignment?.dateIssued || activeOwnership?.dateIssued || item.updatedAt
                      ).toLocaleDateString()}{' '}
                      &bull; Condition: <strong>{currentAssignment?.conditionAtIssuance || activeOwnership?.conditionAtIssuance || 'Good'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {(currentAssignment?.accountabilityId || activeOwnership?.recordId) && (
                    <Link
                      to={`/forms/${currentAssignment?.accountabilityId || activeOwnership?.recordId}`}
                      className="px-3.5 py-2 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold transition inline-flex items-center space-x-1.5 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>
                        View Form: {currentAssignment?.formNumber || activeOwnership?.formNumber || 'Official Record'}
                      </span>
                    </Link>
                  )}

                  <button
                    onClick={() => setIsReturnModalOpen(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    Process Return
                  </button>
                </div>
              </div>

              {/* Active Issuance Remarks Callout */}
              {(currentAssignment?.issuanceRemarks || activeOwnership?.issuanceRemarks) && (
                <div className="pt-3 border-t border-indigo-100 flex items-start space-x-2 text-xs text-slate-700">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-indigo-950">Active Handover Notes / Remarks: </span>
                    <span className="text-slate-800 font-medium">
                      "{currentAssignment?.issuanceRemarks || activeOwnership?.issuanceRemarks}"
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-800 block">
                    Currently In Inventory & Available
                  </span>
                  <p className="text-xs text-emerald-600">
                    Ready to be issued to any authorized employee of Chawnah Foods Inc.
                  </p>
                </div>
              </div>

              <Link
                to={`/forms/new?itemId=${item._id}`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs self-start sm:self-auto shrink-0"
              >
                Issue Equipment Form &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Installed Components & Replacement Maintenance Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Installed Components & Parts</h3>
              <p className="text-[11px] text-slate-500">
                Batteries, RAM, and hardware modules installed in this unit
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedPartToReplace(null);
              setIsReplacePartOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replace Component</span>
          </button>
        </div>

        {item.installedComponents?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {item.installedComponents.map((comp, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100/60 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                    {comp.componentType?.toLowerCase().includes('battery') ? (
                      <BatteryCharging className="w-4 h-4" />
                    ) : (
                      <Cpu className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center space-x-2">
                      <span>{comp.itemDescription}</span>
                      {comp.itemNumber && (
                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          {comp.itemNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                      <span>SN: {comp.serialNumber || 'N/A'}</span>
                      <span>&bull;</span>
                      <span>Installed {new Date(comp.installedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPartToReplace(comp);
                    setIsReplacePartOpen(true);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition"
                >
                  Replace
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
            <span>No modular components recorded. Click "Replace Component" to log a battery or part swap.</span>
          </div>
        )}

        {/* Maintenance Replacement History */}
        {item.maintenanceHistory?.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs">Past Component Replacements & Dispositions:</h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden text-xs">
              {item.maintenanceHistory.map((m, idx) => (
                <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{m.componentName || 'Part Replacement'}</span>
                      <span className="text-[11px] text-slate-400">&bull; {new Date(m.date).toLocaleDateString()}</span>
                      {m.oldComponent?.disposition && (
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            m.oldComponent.disposition === 'For Repair'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          Old Part: {m.oldComponent.disposition}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Installed: <strong>{m.newComponent?.itemNumber ? `${m.newComponent.itemNumber} - ` : ''}{m.newComponent?.description}</strong>
                      {m.oldComponent?.description && ` (Replaced: ${m.oldComponent.description})`}
                    </p>
                    {m.notes && <p className="text-[10px] text-slate-500 italic">Notes: "{m.notes}"</p>}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">By: {m.performedBy || 'IT Admin'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Tabs (Custody Chain & Notes Hub) + Right Col (Full Audit Trail Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Tabs between Chain of Custody & Consolidated Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('custody')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'custody'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Chain of Custody & Assignments</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'custody'
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {sortedAssignments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'notes'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Equipment Notes & Remarks Hub</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'notes'
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {totalNotesCount}
              </span>
            </button>
          </div>

          {/* TAB 1: Chain of Custody & Assignments */}
          {activeTab === 'custody' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                    <History className="w-5 h-5 text-emerald-600" />
                    <span>Complete Chain of Custody</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Historical and active record of employee custody, conditions at issuance, and return inspections
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                  {sortedAssignments.length} Record{sortedAssignments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {sortedAssignments.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400 space-y-3 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-700">No Assignment Records Yet</p>
                    <p className="max-w-md mx-auto text-slate-500 mt-1">
                      {isAssigned
                        ? 'This equipment is actively issued, but official form records are synchronizing.'
                        : 'This equipment is unassigned and currently in inventory. When issued via an accountability form, full custody records and handover notes will appear here.'}
                    </p>
                  </div>
                  {isAvailable && (
                    <Link
                      to={`/forms/new?itemId=${item._id}`}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                    >
                      <span>Issue Equipment Now</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedAssignments.map((record, idx) => {
                    const ret = record.returnDetails || {};
                    const isDamaged = ret.conditionUponReturn === 'Damaged';
                    const isActive = record.status === 'Active';

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl p-5 transition space-y-3.5 ${
                          isActive
                            ? 'border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-50/30 via-white to-white shadow-xs'
                            : 'border border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {/* Header: Custodian info + Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isActive
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {record.employee?.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('') || 'CU'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                {record.employee?.id ? (
                                  <Link
                                    to={`/employees/${record.employee?.id}`}
                                    className="font-bold text-slate-900 text-sm hover:text-emerald-700 transition"
                                  >
                                    {record.employee?.name}
                                  </Link>
                                ) : (
                                  <span className="font-bold text-slate-900 text-sm">
                                    {record.employee?.name}
                                  </span>
                                )}
                                {record.employee?.employeeId && (
                                  <span className="font-mono text-xs text-slate-500">
                                    ({record.employee?.employeeId})
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                {record.employee?.jobTitle || 'Staff'} &bull;{' '}
                                {record.employee?.department || 'Operations'}
                                {record.storeName && (
                                  <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {record.storeName}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2.5">
                            {isActive ? (
                              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Active Custody</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Returned & Inspected</span>
                              </span>
                            )}

                            <Link
                              to={`/forms/${record.recordId}`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200 shadow-2xs transition"
                              title="View official signed accountability form"
                            >
                              <span>{record.formNumber}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </Link>
                          </div>
                        </div>

                        {/* Dates & Conditions Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">
                              Date Issued
                            </span>
                            <span className="font-semibold text-slate-800">
                              {new Date(record.dateIssued).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">
                              Condition Issued
                            </span>
                            <span className="font-semibold text-slate-800">
                              {record.conditionAtIssuance}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">
                              {isActive ? 'Current Custody Status' : 'Date Returned'}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {isActive
                                ? 'Actively In Use'
                                : ret.returnDate
                                ? new Date(ret.returnDate).toLocaleDateString()
                                : 'Recorded'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">
                              {isActive ? 'Custodian Status' : 'Condition Upon Return'}
                            </span>
                            <span
                              className={`inline-block font-bold ${
                                isActive
                                  ? 'text-emerald-700'
                                  : isDamaged
                                  ? 'text-rose-600'
                                  : ret.conditionUponReturn === 'Fair'
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {isActive ? 'Active Responsibility' : ret.conditionUponReturn || 'Good'}
                            </span>
                          </div>
                        </div>

                        {/* Return Inspection summary (if returned) */}
                        {!isActive && (
                          <div className="flex flex-wrap items-center justify-between text-xs pt-1 text-slate-600">
                            <div className="flex items-center space-x-4">
                              <span>
                                Completeness: <strong>{ret.completeness || 'Complete'}</strong>
                              </span>
                              {ret.chargesAssessment === 'Charges Applicable' ? (
                                <span className="font-mono font-bold text-rose-600">
                                  Charges: ₱{Number(ret.chargesAmount || 0).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-400">No damage charges</span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500">
                              Inspected by: <strong>{ret.inspectedBy || 'IT Inspector'}</strong>
                            </div>
                          </div>
                        )}

                        {/* Handover & Approvals */}
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4">
                          {record.releasedBy && (
                            <span>
                              Released by: <strong className="text-slate-700">{record.releasedBy}</strong>
                            </span>
                          )}
                          {record.approvedBy && (
                            <span>
                              Approved by: <strong className="text-slate-700">{record.approvedBy}</strong>
                            </span>
                          )}
                        </div>

                        {/* Issuance Remarks Callout */}
                        {record.issuanceRemarks && (
                          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                            <div className="font-bold text-amber-950 flex items-center space-x-1.5">
                              <FileText className="w-3.5 h-3.5 text-amber-600" />
                              <span>Issuance Handover Remarks & Notes:</span>
                            </div>
                            <p className="text-slate-800 leading-relaxed pl-5 whitespace-pre-line italic">
                              "{record.issuanceRemarks}"
                            </p>
                          </div>
                        )}

                        {/* Return Inspection Notes Callout */}
                        {ret.notes && (
                          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1">
                            <div className="font-bold text-blue-950 flex items-center space-x-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Return Inspection Findings:</span>
                            </div>
                            <p className="text-slate-800 leading-relaxed pl-5 whitespace-pre-line">
                              {ret.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Equipment Notes & Remarks Hub */}
          {activeTab === 'notes' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                    <MessageSquarePlus className="w-5 h-5 text-indigo-600" />
                    <span>Consolidated Equipment Notes & Remarks</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Centralized log of base equipment remarks, issuance notes, return inspection findings, and audit observations
                  </p>
                </div>
                <button
                  onClick={() => setIsRemarkModalOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center space-x-1.5"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>+ Add Audit Note</span>
                </button>
              </div>

              {/* 1. Base Equipment Specifications & Accessories Note */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>Base Equipment Specifications & Accessories</span>
                </h3>
                {baseRemarks ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {baseRemarks}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic">
                    No accessories or specifications remarks registered in the catalog for this equipment.
                  </div>
                )}
              </div>

              {/* 2. Issuance Handover Remarks from Forms */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Issuance Handover Remarks ({issuanceNotes.length})</span>
                </h3>
                {issuanceNotes.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic">
                    No special handover remarks recorded during equipment issuance.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {issuanceNotes.map((rec, i) => (
                      <div
                        key={i}
                        className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-slate-600 pb-1.5 border-b border-amber-200/60">
                          <span className="font-semibold text-amber-950">
                            Issued to {rec.employee?.name} ({rec.employee?.employeeId})
                          </span>
                          <Link
                            to={`/forms/${rec.recordId}`}
                            className="font-mono font-bold text-indigo-700 hover:underline"
                          >
                            {rec.formNumber}
                          </Link>
                        </div>
                        <p className="text-slate-800 leading-relaxed italic">
                          "{rec.issuanceRemarks}"
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Date: {new Date(rec.dateIssued).toLocaleDateString()} &bull; Condition:{' '}
                          {rec.conditionAtIssuance}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Return Inspection Findings */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Return Inspection Findings ({returnNotes.length})</span>
                </h3>
                {returnNotes.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic">
                    No return inspection notes recorded on file.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {returnNotes.map((rec, i) => (
                      <div
                        key={i}
                        className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-slate-600 pb-1.5 border-b border-blue-200/60">
                          <span className="font-semibold text-blue-950">
                            Returned by {rec.employee?.name} &bull; Inspected by{' '}
                            {rec.returnDetails?.inspectedBy || 'IT Inspector'}
                          </span>
                          <Link
                            to={`/forms/${rec.recordId}`}
                            className="font-mono font-bold text-indigo-700 hover:underline"
                          >
                            {rec.formNumber}
                          </Link>
                        </div>
                        <p className="text-slate-800 leading-relaxed">
                          {rec.returnDetails?.notes}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Condition upon return:{' '}
                          <strong>{rec.returnDetails?.conditionUponReturn || 'Good'}</strong> &bull;{' '}
                          Completeness: {rec.returnDetails?.completeness || 'Complete'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Administrative Audit & Maintenance Notes */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Wrench className="w-4 h-4 text-purple-600" />
                  <span>Audit Logs & Maintenance Notes ({auditNotes.length})</span>
                </h3>
                {auditNotes.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic">
                    No custom administrative audit notes or maintenance observations recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditNotes.map((evt, i) => (
                      <div
                        key={i}
                        className="p-4 bg-purple-50/50 border border-purple-200/70 rounded-xl text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-bold text-purple-950 uppercase tracking-wider text-[11px]">
                            {evt.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(evt.date || evt.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed">{evt.remarks}</p>
                        {evt.performedBy && (
                          <p className="text-[10px] text-slate-500">
                            Logged by: <strong>{evt.performedBy}</strong>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Chronological Audit Trail & Event Timeline */}
        <div className="space-y-6">
          {/* Inventory Batch Intake Record (if part of a batch) */}
          {item?.batchNumber && (
            <div className="bg-gradient-to-br from-indigo-50/90 to-white rounded-2xl border border-indigo-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Inventory Intake Record
                    </span>
                    <h4 className="font-mono font-black text-indigo-950 text-sm">
                      {item.batchNumber}
                    </h4>
                  </div>
                </div>

                <Link
                  to="/items"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  View Journal &rarr;
                </Link>
              </div>

              <div className="pt-2.5 border-t border-indigo-100 text-xs space-y-1.5 text-slate-600">
                {item.poNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">PO / Delivery Ref:</span>
                    <strong className="font-mono text-slate-800">{item.poNumber}</strong>
                  </div>
                )}
                {item.supplier && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Supplier / Vendor:</span>
                    <strong className="text-slate-800 text-right truncate max-w-[180px]">
                      {item.supplier}
                    </strong>
                  </div>
                )}
                {item.receivedDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Intake Date:</span>
                    <strong className="text-slate-800">
                      {new Date(item.receivedDate).toLocaleDateString()}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Full Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological lifecycle of every action on this item
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                {timelineEvents?.length || 0}
              </span>
            </div>

            {(!timelineEvents || timelineEvents.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                <p>No audit trail events recorded yet.</p>
                <button
                  onClick={() => setIsRemarkModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  + Add First Audit Note
                </button>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 border-l-2 border-slate-100 text-xs">
                {timelineEvents.map((event) => {
                  const isAssignedEvent = event.action === 'ASSIGNED';
                  const isReturnedEvent = event.action === 'RETURNED';
                  const isNoteEvent = event.action === 'NOTE_ADDED';
                  const isRegEvent = event.action === 'REGISTERED';
                  const isUpdateEvent =
                    event.action === 'CONDITION_UPDATE' || event.action === 'MAINTENANCE';

                  return (
                    <div key={event._id} className="relative group">
                      {/* Circle Node */}
                      <div
                        className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white ring-2 ${
                          isAssignedEvent
                            ? 'bg-indigo-600 ring-indigo-200'
                            : isReturnedEvent
                            ? 'bg-emerald-600 ring-emerald-200'
                            : isNoteEvent
                            ? 'bg-amber-500 ring-amber-200'
                            : isUpdateEvent
                            ? 'bg-purple-600 ring-purple-200'
                            : 'bg-slate-700 ring-slate-200'
                        }`}
                      />

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                            {event.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(event.date || event.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-slate-700 mt-1 leading-relaxed text-[11px] font-medium">
                          {event.remarks}
                        </p>

                        <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-slate-500">
                          {event.performedBy && <span>By: {event.performedBy}</span>}
                          {event.condition && <span>Cond: {event.condition}</span>}
                          {event.formNumber && (
                            <Link
                              to={
                                event.accountabilityId
                                  ? `/forms/${event.accountabilityId}`
                                  : '#'
                              }
                              className="font-mono text-emerald-700 font-semibold hover:underline"
                            >
                              {event.formNumber}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Modal */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSubmit={handleReturnSubmit}
        formId={currentAssignment?.accountabilityId || activeOwnership?.recordId}
        item={item}
        isBulk={false}
      />

      {/* Add Remark Modal */}
      <AddRemarkModal
        isOpen={isRemarkModalOpen}
        onClose={() => setIsRemarkModalOpen(false)}
        itemId={item._id}
        onItemUpdated={fetchItemData}
      />

      {/* Print Asset Sticker Modal */}
      <AssetTagModal
        isOpen={isAssetTagOpen}
        onClose={() => setIsAssetTagOpen(false)}
        item={item}
        currentAssignment={currentAssignment || activeOwnership}
      />

      {/* Equipment Maintenance Modal */}
      <MaintenanceModal
        isOpen={isMaintenanceOpen}
        onClose={() => setIsMaintenanceOpen(false)}
        item={item}
        onItemUpdated={fetchItemData}
      />

      {/* Part / Battery Replacement Modal */}
      <ReplacePartModal
        isOpen={isReplacePartOpen}
        onClose={() => setIsReplacePartOpen(false)}
        targetItem={item}
        onSuccess={fetchItemData}
      />

      {/* Whole Unit Replacement Modal */}
      <ReplaceWholeModal
        isOpen={isReplaceWholeOpen}
        onClose={() => setIsReplaceWholeOpen(false)}
        targetItem={item}
        onSuccess={fetchItemData}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={isEditModalOpen}
        item={item}
        onClose={() => setIsEditModalOpen(false)}
        onItemUpdated={() => {
          fetchItemData();
        }}
      />

      {/* Confirm Delete Item Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        targetType="item"
        targetData={item}
        title="Delete Equipment Asset"
        loading={deleteLoading}
        error={deleteError}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDeleteItem}
      />
    </div>
  );
}
