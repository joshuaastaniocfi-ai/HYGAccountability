import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Calendar,
  ShieldCheck,
  Briefcase,
  Mail,
  Phone,
  Clock,
  ExternalLink,
  Wrench,
  RefreshCw,
  Building2,
  ChevronDown,
  ChevronUp,
  Monitor,
  Video,
  Layers,
  Sparkles,
  Tag,
  Barcode,
  History,
  Pencil,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api';
import ReturnModal from '../components/ReturnModal';
import ReplacePartModal from '../components/ReplacePartModal';
import ReplaceWholeModal from '../components/ReplaceWholeModal';
import AssetTagModal from '../components/AssetTagModal';
import AddEmployeeModal from '../components/AddEmployeeModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'past' | 'forms'

  // Pre-set groups expand/collapse state
  const [expandedSets, setExpandedSets] = useState({});
  const [selectedReturnSetTag, setSelectedReturnSetTag] = useState(null);

  // Return modal state
  const [selectedReturnItem, setSelectedReturnItem] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Replacement modals state
  const [selectedPartItem, setSelectedPartItem] = useState(null);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [selectedWholeItem, setSelectedWholeItem] = useState(null);
  const [isWholeModalOpen, setIsWholeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleConfirmDeleteEmployee = async (target, force) => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await api.deleteEmployee(target._id, force);
      navigate('/employees');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete employee');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Printable Asset Tag Modal state (for Sets and individual items)
  const [tagModalData, setTagModalData] = useState({
    isOpen: false,
    item: null,
    group: null,
  });

  const handleOpenSetTagModal = (grp) => {
    setTagModalData({
      isOpen: true,
      item: null,
      group: grp,
    });
  };

  const handleOpenItemTagModal = (it) => {
    setTagModalData({
      isOpen: true,
      item: it,
      group: null,
    });
  };

  // Set & Component Part History Navigation
  const handleOpenSetHistory = (group, part = null) => {
    if (part) {
      const partId = part.item?._id || part.item || part._id;
      if (partId) {
        navigate(`/history/item/${encodeURIComponent(partId)}`);
        return;
      }
    }
    const tag = group?.setEquipmentTag || group?.setItemNumber || group?.setTag;
    if (tag) {
      navigate(`/history/set/${encodeURIComponent(tag)}`);
    } else if (group?.items?.[0]) {
      const firstId = group.items[0].item?._id || group.items[0].item || group.items[0]._id;
      if (firstId) {
        navigate(`/history/item/${encodeURIComponent(firstId)}`);
      }
    }
  };

  const toggleSetExpanded = (key) => {
    setExpandedSets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getItemSetTag = (item) => {
    if (!item) return null;
    if (item.setTag) return item.setTag;
    if (item.remarks && item.remarks.includes('Desktop Set')) return 'Desktop Set';
    if (item.remarks && item.remarks.includes('CCTV Set')) return 'CCTV Set';
    return null;
  };

  const { presetGroups, standaloneItems } = useMemo(() => {
    const items = data?.activeItems || [];
    const presetMap = new Map();
    const standalone = [];

    items.forEach((item) => {
      const setTag = getItemSetTag(item);
      if (setTag) {
        const groupKey = `${item.recordId || 'rec'}_${setTag}`;
        if (!presetMap.has(groupKey)) {
          const empNum = String(data?.employee?.employeeId || data?.employee?._id || 'EMP').slice(-3);
          presetMap.set(groupKey, {
            setKey: groupKey,
            setTag,
            setEquipmentTag:
              item.setEquipmentTag ||
              item.item?.setEquipmentTag ||
              (setTag.includes('CCTV')
                ? `CFI-EMP-${empNum}-SET-CCTV`
                : `CFI-EMP-${empNum}-SET-DESK`),
            setItemNumber:
              item.setItemNumber ||
              item.item?.setItemNumber ||
              (setTag.includes('CCTV') ? 'SET-EMP-CCTV' : 'SET-EMP-DESK'),
            formNumber: item.formNumber,
            recordId: item.recordId,
            issuanceDate: item.issuanceDate,
            releasedBy: item.releasedBy,
            items: [],
          });
        }
        const grp = presetMap.get(groupKey);
        if (item.setEquipmentTag && !grp.setEquipmentTag) grp.setEquipmentTag = item.setEquipmentTag;
        if (item.setItemNumber && !grp.setItemNumber) grp.setItemNumber = item.setItemNumber;
        grp.items.push(item);
      } else {
        standalone.push(item);
      }
    });

    presetMap.forEach((grp) => {
      grp.items.sort((a, b) => {
        const tagA = a.equipmentTag || a.propertyTag || a.tag || '';
        const tagB = b.equipmentTag || b.propertyTag || b.tag || '';
        return tagA.localeCompare(tagB, undefined, { numeric: true, sensitivity: 'base' });
      });
    });

    return {
      presetGroups: Array.from(presetMap.values()),
      standaloneItems: standalone,
    };
  }, [data]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployee(id);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const handleOpenReturnModal = (item, recordId, setTag = null) => {
    setSelectedReturnItem(item);
    setSelectedRecordId(recordId);
    setSelectedReturnSetTag(setTag);
    setIsReturnModalOpen(true);
  };

  const normalizeItem = (item) => {
    const raw = item.item && typeof item.item === 'object' ? item.item : {};
    const emp = data?.employee;
    return {
      _id: raw._id || item.item || item._id,
      itemNumber: raw.itemNumber || item.itemNumber,
      assetTag: raw.assetTag || item.assetTag,
      itemDescription: raw.itemDescription || item.itemDescription,
      brandModel: raw.brandModel || item.brandModel,
      serialNumber: raw.serialNumber || item.serialNumber,
      equipmentType: raw.equipmentType || item.equipmentType,
      category: raw.category || item.category,
      currentCondition: raw.currentCondition || item.conditionAtIssuance || 'Good',
      currentAssignment: {
        accountabilityType: 'Individual',
        employee: emp?._id,
        employeeName: emp?.name,
        employeeId: emp?.employeeId,
        department: emp?.department,
        formNumber: item.formNumber,
        accountabilityId: item.recordId,
      },
    };
  };

  const handleOpenPartModal = (item) => {
    setSelectedPartItem(normalizeItem(item));
    setIsPartModalOpen(true);
  };

  const handleOpenWholeModal = (item) => {
    setSelectedWholeItem(normalizeItem(item));
    setIsWholeModalOpen(true);
  };

  const handleReturnSubmit = async (formData) => {
    if (!selectedRecordId) return;
    await api.returnItems(selectedRecordId, formData);
    await fetchEmployeeData();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading employee accountability file...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-center justify-between">
          <span>Failed to load employee records: {error || 'Not found'}</span>
          <button
            onClick={() => navigate('/employees')}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold"
          >
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

  const { employee, activeItems, returnedItems, activeRecords, pastRecords, summary } = data;

  const renderItemCard = (item, isInsidePreset = false) => (
    <div
      key={item._id}
      className={`bg-white rounded-xl border p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between ${
        isInsidePreset ? 'border-slate-200/90 bg-white' : 'border-slate-200'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {item.assetTag || item.itemNumber || 'TAG-N/A'}
              </span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                ACTIVE
              </span>
              {isInsidePreset && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {item.setTag || 'Pre-Set'}
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-1.5">
              {item.itemDescription && item.itemDescription !== 'N/A'
                ? item.itemDescription
                : item.equipmentType || 'Equipment'}
            </h3>
            {item.brandModel && item.brandModel !== 'N/A' && (
              <p className="text-xs text-slate-500">{item.brandModel}</p>
            )}
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Condition Issued:</span>
            <span className="inline-block font-semibold text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5">
              {item.conditionAtIssuance || 'Good'}
            </span>
          </div>
        </div>

        {/* Metadata details */}
        <div className="mt-4 bg-slate-50 p-3 rounded-lg text-xs space-y-1.5 border border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Serial Number:</span>
            <span className="font-mono font-bold text-slate-800">{item.serialNumber || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Form Number:</span>
            <Link
              to={`/forms/${item.recordId}`}
              className="font-mono text-emerald-700 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>{item.formNumber}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Date Issued:</span>
            <span className="text-slate-800">
              {item.issuanceDate
                ? new Date(item.issuanceDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Released By:</span>
            <span className="text-slate-800">{item.releasedBy || 'N/A'}</span>
          </div>
          {item.remarks && (
            <div className="pt-1.5 border-t border-slate-200/60 text-slate-600 text-[11px]">
              <strong>Issuance Remarks:</strong> {item.remarks}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <Link
          to={`/items/${item.item?._id || item.item || item._id}`}
          className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center space-x-1"
        >
          <span>Item History</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenSetHistory(null, item)}
            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg shadow-2xs transition inline-flex items-center space-x-1"
            title="View Part History & Audit Trail"
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-bold">History</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenItemTagModal(item)}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition inline-flex items-center space-x-1 shadow-2xs"
            title="Print Barcode Equipment Tag for this Unit"
          >
            <Barcode className="w-3 h-3 text-slate-600" />
            <span>Tag</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPartModal(item)}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg transition inline-flex items-center space-x-1"
            title="Replace Part / Battery on this unit"
          >
            <Wrench className="w-3 h-3 text-emerald-600" />
            <span>Replace Part</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenWholeModal(item)}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition inline-flex items-center space-x-1 shadow-2xs"
            title="Swap out whole defective unit with an available unit"
          >
            <RefreshCw className="w-3 h-3 text-indigo-600" />
            <span>Replace Whole</span>
          </button>

          <Link
            to={`/forms/${item.recordId}`}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            View Form
          </Link>

          <button
            type="button"
            onClick={() => handleOpenReturnModal(item, item.recordId)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Process Return
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/employees"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employees List</span>
        </Link>
      </div>

      {/* Employee Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-lg sm:text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              {employee.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {employee.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300">
                  {employee.employeeId}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    employee.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {employee.status}
                </span>
              </div>

              <div className="text-sm font-semibold text-emerald-700 mt-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center space-x-1.5">
                  <Briefcase className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{employee.jobTitle} &bull; {employee.department}</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{employee.company || 'Chawnah Foods Inc.'}</span>
                </span>
              </div>

              {(employee.firstName || employee.lastName) && (
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  First: <strong className="text-slate-700">{employee.firstName}</strong>
                  {employee.middleName && <> &bull; Middle: <strong className="text-slate-700">{employee.middleName}</strong></>}
                  {employee.lastName && <> &bull; Last: <strong className="text-slate-700">{employee.lastName}</strong></>}
                  {employee.suffix && <> &bull; Suffix: <strong className="text-slate-700">{employee.suffix}</strong></>}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                {employee.email && (
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{employee.email}</span>
                  </span>
                )}
                {employee.phone && (
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{employee.phone}</span>
                  </span>
                )}
                {employee.notes && (
                  <span className="text-slate-400 italic">
                    Note: {employee.notes}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition"
              title="Edit employee profile details"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setIsDeleteModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 shadow-2xs transition"
              title="Delete this employee record"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete</span>
            </button>

            <Link
              to={`/forms/new?employeeId=${employee._id}`}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-600/30 transition"
            >
              <span>+ Issue Equipment</span>
            </Link>
          </div>
        </div>

        {/* Accountability Summary Counters */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Active Accountabilities
            </span>
            <div className="text-xl font-extrabold text-emerald-800 mt-1">
              {summary.activeItemsCount} Item{summary.activeItemsCount !== 1 ? 's' : ''}
            </div>
            <p className="text-[10px] text-emerald-600 mt-0.5">Currently in employee possession</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Past / Returned
            </span>
            <div className="text-xl font-extrabold text-slate-800 mt-1">
              {summary.returnedItemsCount} Item{summary.returnedItemsCount !== 1 ? 's' : ''}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Returned & inspected</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Total Forms Signed
            </span>
            <div className="text-xl font-extrabold text-slate-800 mt-1">
              {summary.totalForms} Form{summary.totalForms !== 1 ? 's' : ''}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Chawnah Foods accountability docs</p>
          </div>
        </div>
      </div>

      {/* Tabs: Active Accountabilities vs Non-Active Accountabilities vs All Forms */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'active'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Active Accountabilities ({summary.activeItemsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'past'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Non-Active / Past Accountabilities ({summary.returnedItemsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('forms')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'forms'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Official Forms ({summary.totalForms})</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE ACCOUNTABILITIES */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">
                No active equipment accountability for this employee.
              </p>
              <p className="text-slate-500 max-w-md mx-auto">
                All previous items have been returned and cleared, or no equipment has been issued yet.
              </p>
              <Link
                to={`/forms/new?employeeId=${employee._id}`}
                className="inline-block mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Issue Equipment Form
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. Pre-Set Packages (Desktop Set, CCTV Set, etc.) */}
              {presetGroups.map((group) => {
                const isExpanded = Boolean(expandedSets[group.setKey]);
                const isCctv = group.setTag.toLowerCase().includes('cctv');

                return (
                  <div
                    key={group.setKey}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
                  >
                    {/* Pre-set Main Card Banner (Clickable to Expand / Collapse) */}
                    <div
                      onClick={() => toggleSetExpanded(group.setKey)}
                      className="p-5 cursor-pointer hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                    >
                      <div className="flex items-start space-x-3.5 min-w-0">
                        {/* Pre-set Icon Container */}
                        <div
                          className={`p-3 rounded-2xl border shrink-0 shadow-2xs ${
                            isCctv
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {isCctv ? (
                            <Video className="w-6 h-6" />
                          ) : (
                            <Monitor className="w-6 h-6" />
                          )}
                        </div>

                        {/* Set Title & Details */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-base">
                              {group.setTag}
                            </span>
                            {group.setItemNumber && (
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                                {group.setItemNumber}
                              </span>
                            )}
                            {group.setEquipmentTag && (
                              <span className="inline-flex items-center space-x-1 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Tag: {group.setEquipmentTag}</span>
                              </span>
                            )}
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ACTIVE PRE-SET
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {group.items.length} Component{group.items.length !== 1 ? 's' : ''} Active
                            </span>
                          </div>

                          {/* Tag Range & Metadata row */}
                          <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                            {group.items.length > 0 && (
                              <>
                                <span className="inline-flex items-center text-[11px] font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  Range: {group.items[0]?.equipmentTag || group.items[0]?.propertyTag || group.items[0]?.tag || '—'} &rarr; {group.items[group.items.length - 1]?.equipmentTag || group.items[group.items.length - 1]?.propertyTag || group.items[group.items.length - 1]?.tag || '—'}
                                </span>
                                <span className="text-slate-300">&bull;</span>
                              </>
                            )}
                            <span className="flex items-center space-x-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>Form:</span>
                              <span className="font-mono font-bold text-slate-800">
                                {group.formNumber}
                              </span>
                            </span>
                            <span className="text-slate-300">&bull;</span>
                            <span>
                              Issued:{' '}
                              <strong className="text-slate-700 font-medium">
                                {group.issuanceDate
                                  ? new Date(group.issuanceDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : '—'}
                              </strong>
                            </span>
                            {group.releasedBy && (
                              <>
                                <span className="text-slate-300">&bull;</span>
                                <span>
                                  Released By: <strong className="text-slate-700 font-medium">{group.releasedBy}</strong>
                                </span>
                              </>
                            )}
                          </div>

                          {/* Inclusions summary preview */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {group.items.map((item, idx) => (
                              <span
                                key={item._id || idx}
                                className="inline-flex items-center text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/80"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0" />
                                {item.itemDescription && item.itemDescription !== 'N/A'
                                  ? item.itemDescription
                                  : item.equipmentType || 'Component'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Set Actions & View Components Toggle */}
                      <div
                        className="flex items-center space-x-2 shrink-0 self-end md:self-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* View Set History & Part Audit Trail */}
                        <button
                          type="button"
                          onClick={() => handleOpenSetHistory(group)}
                          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 shadow-2xs transition"
                          title="View Set History & Part Audit Trail"
                        >
                          <History className="w-4 h-4 text-indigo-600" />
                        </button>

                        {/* Print Set Tag */}
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenSetTagModal({
                              ...group,
                              employeeName: data?.employee?.name,
                              custodian: data?.employee?.name,
                              department: data?.employee?.department,
                            })
                          }
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 shadow-2xs transition"
                          title="Print Barcode Equipment Tag for this Set Group"
                        >
                          <Barcode className="w-4 h-4 text-emerald-700" />
                        </button>

                        {/* Return Entire Set */}
                        <button
                          type="button"
                          onClick={() => handleOpenReturnModal(null, group.recordId, group.setTag)}
                          className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-2xs transition"
                          title="Return this entire pre-set package"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* View Form Link */}
                        <Link
                          to={`/forms/${group.recordId}`}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition inline-flex items-center justify-center"
                          title="View official accountability form document"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>

                        {/* Expand / Collapse Button */}
                        <button
                          type="button"
                          onClick={() => toggleSetExpanded(group.setKey)}
                          title={isExpanded ? 'Collapse components' : `View ${group.items.length} components`}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 border shadow-2xs ${
                            isExpanded
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span className="font-mono text-[10px]">({group.items.length})</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Unfolded Components Drawer */}
                    {isExpanded && (
                      <div className="p-5 pt-3 bg-slate-50/50 border-t border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                            Individual Components in this {group.setTag}:
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Inspect, replace parts, or return components individually below
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {group.items.map((item) => renderItemCard(item, true))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 2. Standalone Equipment (Items not part of any preset) */}
              {standaloneItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  {presetGroups.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-slate-600 px-1 border-b border-slate-200/80 pb-2">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Individual Equipment & Devices ({standaloneItems.length})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Hardware issued standalone without a pre-set bundle
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {standaloneItems.map((item) => renderItemCard(item, false))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NON-ACTIVE / PAST ACCOUNTABILITIES */}
      {activeTab === 'past' && (
        <div className="space-y-4">
          {returnedItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">No historical return records.</p>
              <p className="text-slate-400">
                Returned equipment will appear here with condition inspection reports.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-5">Equipment Details</th>
                      <th className="py-3 px-5">Issuance & Return Date</th>
                      <th className="py-3 px-5">Condition Upon Return</th>
                      <th className="py-3 px-5">Completeness & Charges</th>
                      <th className="py-3 px-5">Inspection Notes</th>
                      <th className="py-3 px-5 text-right">Form Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returnedItems.map((item) => {
                      const ret = item.returnDetails || {};
                      const isDamaged = ret.conditionUponReturn === 'Damaged';

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 px-5">
                            <div className="font-bold text-slate-900">
                              {item.itemDescription && item.itemDescription !== 'N/A'
                                ? item.itemDescription
                                : item.equipmentType || 'Equipment'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.brandModel} &bull; <span className="font-mono">{item.serialNumber}</span>
                            </div>
                            <Link
                              to={`/items/${item.item?._id || item.item}`}
                              className="text-[10px] text-emerald-600 hover:underline font-semibold mt-0.5 inline-block"
                            >
                              View Item History &rarr;
                            </Link>
                          </td>

                          <td className="py-4 px-5">
                            <div className="text-slate-700">
                              <span className="text-slate-400">Issued:</span>{' '}
                              {new Date(item.issuanceDate).toLocaleDateString()}
                            </div>
                            <div className="text-slate-900 font-semibold mt-0.5">
                              <span className="text-emerald-700 font-bold">Returned:</span>{' '}
                              {ret.returnDate ? new Date(ret.returnDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isDamaged
                                  ? 'bg-rose-100 text-rose-800'
                                  : ret.conditionUponReturn === 'Fair'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {ret.conditionUponReturn || 'Good'}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Issued as: {item.conditionAtIssuance}
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <div className="font-semibold text-slate-800">
                              {ret.completeness || 'Complete'}
                            </div>
                            {ret.completeness === 'Incomplete' && ret.incompleteNotes && (
                              <div className="text-[10px] text-rose-600 italic">
                                Missing: {ret.incompleteNotes}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {ret.chargesAssessment === 'Charges Applicable' ? (
                                <span className="font-mono font-bold text-rose-600">
                                  Fee: ₱{Number(ret.chargesAmount || 0).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-500">No charges</span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-5 max-w-xs">
                            <p className="text-slate-700 text-[11px] leading-relaxed">
                              {ret.notes || 'None noted'}
                            </p>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Inspected by: {ret.inspectedBy || 'IT'}
                            </div>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <Link
                              to={`/forms/${item.recordId}`}
                              className="font-mono text-emerald-700 hover:text-emerald-800 font-semibold"
                            >
                              {item.formNumber}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL SIGNED FORMS */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            {activeRecords.concat(pastRecords).map((rec) => (
              <div
                key={rec._id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {rec.formNumber}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        rec.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'Partially Returned'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    Issued on {new Date(rec.issuance.date).toLocaleDateString()} &bull; Released by{' '}
                    {rec.issuance.releasedBy}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rec.items.map((i, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium"
                      >
                        {(i.itemDescription && i.itemDescription !== 'N/A'
                          ? i.itemDescription
                          : i.equipmentType || 'Equipment')}
                        {i.serialNumber && i.serialNumber !== 'N/A' ? ` (${i.serialNumber})` : ''}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <Link
                    to={`/forms/${rec._id}`}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View / Print Form</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return Modal */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedReturnItem(null);
          setSelectedReturnSetTag(null);
        }}
        onSubmit={handleReturnSubmit}
        formId={selectedRecordId}
        item={selectedReturnItem}
        initialMode={selectedReturnSetTag ? 'set' : selectedReturnItem ? 'component' : 'all'}
      />

      {/* Part Replacement Modal */}
      <ReplacePartModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        targetItem={selectedPartItem}
        onSuccess={fetchEmployeeData}
      />

      {/* Whole Unit Replacement Modal */}
      <ReplaceWholeModal
        isOpen={isWholeModalOpen}
        onClose={() => setIsWholeModalOpen(false)}
        targetItem={selectedWholeItem}
        onSuccess={fetchEmployeeData}
      />

      {/* Printable Barcode Asset Tag Modal (Sets & Items) */}
      <AssetTagModal
        isOpen={tagModalData.isOpen}
        onClose={() => setTagModalData({ isOpen: false, item: null, group: null })}
        item={tagModalData.item}
        group={tagModalData.group}
      />

      {/* Edit Employee Modal */}
      <AddEmployeeModal
        isOpen={isEditModalOpen}
        employeeToEdit={employee}
        onClose={() => setIsEditModalOpen(false)}
        onEmployeeUpdated={() => {
          fetchEmployeeData();
        }}
      />

      {/* Confirm Delete Employee Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        targetType="employee"
        targetData={employee}
        title="Delete Employee Record"
        loading={deleteLoading}
        error={deleteError}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDeleteEmployee}
      />
    </div>
  );
}

