import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Boxes,
  Package,
  CheckCircle2,
  Clock,
  Wrench,
  Trash2,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Store,
  User,
  Tag,
  Laptop,
  Mouse,
  Zap,
  BatteryCharging,
  QrCode,
  Tablet,
  Printer,
  ChevronRight,
  RotateCcw,
  Plus,
  Pencil,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { api } from '../services/api';
import ReplacePartModal from '../components/ReplacePartModal';
import ReplaceWholeModal from '../components/ReplaceWholeModal';
import BatchIntakeModal from '../components/BatchIntakeModal';
import EditItemModal from '../components/EditItemModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const BRAND_CONFIGS = [
  { brand: 'Goldilocks', logo: '/logos/goldilocks.png', legalOwner: 'Chawnah Foods Inc.' },
  { brand: 'DU99', logo: '/logos/du99.png', legalOwner: 'DU99 Commercial Corp.' },
  { brand: 'Taters', logo: '/logos/taters.png', legalOwner: 'Pop and Chips Specialist Inc.' },
  { brand: 'Icebergs', logo: '/logos/icebergs.png', legalOwner: 'Cool Ice Food Desserts' },
  { brand: 'Savore', logo: '/logos/savore.png', legalOwner: 'Savore Kitchen Corp' },
  { brand: 'Chatime', logo: '/logos/chatime.png', legalOwner: 'Salu-salong Saya Food Inc.' },
];

function getEquipmentIcon(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('battery')) return BatteryCharging;
  if (t.includes('ups') || t.includes('power')) return Zap;
  if (t.includes('laptop') || t.includes('computer')) return Laptop;
  if (t.includes('mouse')) return Mouse;
  if (t.includes('scanner') || t.includes('barcode')) return QrCode;
  if (t.includes('tablet') || t.includes('ipad')) return Tablet;
  if (t.includes('printer')) return Printer;
  return Package;
}

export default function EquipmentTypeUnitsPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const decodedType = decodeURIComponent(type || '');

  const brandFromUrl = searchParams.get('brand') || 'All';
  const [selectedBrand, setSelectedBrand] = useState(brandFromUrl);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Available' | 'Assigned' | 'For Repair' | 'For Disposal'

  // Modals state
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [selectedTargetItem, setSelectedTargetItem] = useState(null);
  const [replaceWholeModalOpen, setReplaceWholeModalOpen] = useState(false);
  const [selectedWholeTargetItem, setSelectedWholeTargetItem] = useState(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  // Edit & Delete modal state
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleOpenEdit = (e, item) => {
    e.stopPropagation();
    setItemToEdit(item);
    setEditItemModalOpen(true);
  };

  const handleOpenDelete = (e, item) => {
    e.stopPropagation();
    setItemToDelete(item);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (item, force) => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.deleteItem(item._id, force);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchUnits();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete item');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBrandSelect = (brandName) => {
    setSelectedBrand(brandName);
    if (brandName === 'All') {
      searchParams.delete('brand');
    } else {
      searchParams.set('brand', brandName);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const fetchUnits = async () => {
    setLoading(true);
    try {
      let url = `/api/items?equipmentType=${encodeURIComponent(decodedType)}`;
      if (selectedBrand && selectedBrand !== 'All') {
        url += `&brand=${encodeURIComponent(selectedBrand)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching units for equipment type:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [decodedType, selectedBrand]);

  const handleOpenReplace = (e, item) => {
    e.stopPropagation(); // Prevent opening detail page
    setSelectedTargetItem(item);
    setReplaceModalOpen(true);
  };

  const handleOpenReplaceWhole = (e, item) => {
    e.stopPropagation(); // Prevent opening detail page
    setSelectedWholeTargetItem(item);
    setReplaceWholeModalOpen(true);
  };

  // Aggregated counts for this type
  const totalCount = items.length;
  const assignedCount = items.filter((i) => i.status === 'Assigned').length;
  const availableCount = items.filter((i) => i.status === 'Available').length;
  const repairCount = items.filter((i) => i.status === 'For Repair').length;
  const disposalCount = items.filter((i) => i.status === 'For Disposal').length;

  // Filter items
  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.itemNumber?.toLowerCase().includes(q) ||
      item.assetTag?.toLowerCase().includes(q) ||
      item.itemDescription?.toLowerCase().includes(q) ||
      item.brandModel?.toLowerCase().includes(q) ||
      item.serialNumber?.toLowerCase().includes(q) ||
      item.currentAssignment?.employeeName?.toLowerCase().includes(q) ||
      item.currentAssignment?.storeName?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const Icon = getEquipmentIcon(decodedType);

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Back Navigation Breadcrumb */}
      <div>
        <Link
          to="/inventory"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-700 font-bold transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Inventory by Type</span>
        </Link>
      </div>

      {/* Equipment Type Hero Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
          <div className="flex items-start sm:items-center space-x-3.5 sm:space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-700 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0 shadow-inner">
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {decodedType} Units
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                  {totalCount} Total Units
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Individual asset records, serial numbers, active custodians, and maintenance status
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={() => setBatchModalOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-emerald-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock Batch</span>
            </button>

            <button
              onClick={fetchUnits}
              title="Refresh Units"
              className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Breakdown Metric Badges Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Fleet
              </span>
              <span className="text-xl font-black text-slate-900">{totalCount}</span>
            </div>
            <Package className="w-5 h-5 text-slate-400" />
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Assigned / In Use
              </span>
              <span className="text-xl font-black text-emerald-900">{assignedCount}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                Available in Stock
              </span>
              <span className="text-xl font-black text-teal-900">{availableCount}</span>
            </div>
            <Boxes className="w-5 h-5 text-teal-600" />
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                Repair & Disposal
              </span>
              <span className="text-xl font-black text-rose-900">
                {repairCount + disposalCount}
              </span>
            </div>
            <Wrench className="w-5 h-5 text-rose-600" />
          </div>
        </div>
      </div>

      {/* Brand Availability Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Filter by Brand Pool:
            </span>
            {selectedBrand !== 'All' && (
              <span className="text-[11px] text-slate-500">
                Viewing <strong className="text-slate-900">{selectedBrand}</strong> units &bull; Legal Owner: <strong className="text-emerald-700">{BRAND_CONFIGS.find(b => b.brand === selectedBrand)?.legalOwner}</strong>
              </span>
            )}
          </div>
          {selectedBrand !== 'All' && (
            <button
              onClick={() => handleBrandSelect('All')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 self-start sm:self-auto bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
            >
              Show All Brands
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => handleBrandSelect('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 border ${
              selectedBrand === 'All'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>All Brands</span>
          </button>

          {BRAND_CONFIGS.map((b) => {
            const isSel = selectedBrand === b.brand;
            return (
              <button
                key={b.brand}
                onClick={() => handleBrandSelect(b.brand)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 border ${
                  isSel
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title={`Legal Property Owner: ${b.legalOwner}`}
              >
                <img
                  src={b.logo}
                  alt={b.brand}
                  className="w-4 h-4 object-contain rounded-xs shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span>{b.brand}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={`Search ${decodedType} by item #, serial, model, or custodian...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Units ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter('Available')}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFilter === 'Available'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Available ({availableCount})
          </button>
          <button
            onClick={() => setStatusFilter('Assigned')}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFilter === 'Assigned'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Assigned ({assignedCount})
          </button>
          {(repairCount > 0 || disposalCount > 0) && (
            <button
              onClick={() => setStatusFilter('For Repair')}
              className={`px-3 py-1.5 rounded-xl transition ${
                statusFilter === 'For Repair'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              For Repair ({repairCount})
            </button>
          )}
          {disposalCount > 0 && (
            <button
              onClick={() => setStatusFilter('For Disposal')}
              className={`px-3 py-1.5 rounded-xl transition ${
                statusFilter === 'For Disposal'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              For Disposal ({disposalCount})
            </button>
          )}
        </div>
      </div>

      {/* Units List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Loading {decodedType} inventory units...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <Package className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-700 text-sm">No units found</h3>
          <p className="text-xs text-slate-500">
            No {decodedType} units match your search or status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600">
              Showing {filteredItems.length} of {totalCount} {decodedType} Units
            </span>
            <span className="text-[11px] text-slate-400">
              Click any unit card to open its complete detail and audit log
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-2 w-10 text-center">#</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">Item # & Tag</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">Brand & Pool</th>
                    <th className="py-2.5 px-2.5">Item Name / Model</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">Serial Number</th>
                    <th className="py-2.5 px-2.5">Location / Custodian</th>
                    <th className="py-2.5 px-1.5 whitespace-nowrap text-center">Condition</th>
                    <th className="py-2.5 px-1.5 whitespace-nowrap text-center">Status</th>
                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.map((item, idx) => {
                    const isAssigned = item.status === 'Assigned';
                    const isAvailable = item.status === 'Available';
                    const isRepair = item.status === 'For Repair';
                    const isDisposal = item.status === 'For Disposal';

                    return (
                      <tr
                        key={item._id}
                        onClick={() => navigate(`/items/${item._id}`)}
                        className="hover:bg-slate-50/80 transition cursor-pointer group"
                      >
                        {/* Index */}
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Item # & Asset Tag */}
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 text-xs">
                            {item.itemNumber || item.assetTag}
                          </span>
                          {item.itemNumber && item.assetTag && item.itemNumber !== item.assetTag && (
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                              {item.assetTag}
                            </div>
                          )}
                        </td>

                        {/* Brand & Pool */}
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-xs text-slate-900">
                              {item.brand || 'Goldilocks'}
                            </span>
                          </div>
                          <div
                            className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]"
                            title={`Legal Property Owner: ${item.legalOwner || 'Chawnah Foods Inc.'}`}
                          >
                            {item.legalOwner || 'Chawnah Foods Inc.'}
                          </div>
                        </td>

                        {/* Description & Category */}
                        <td className="py-2.5 px-2.5 max-w-[180px]">
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition truncate">
                            {item.itemDescription && item.itemDescription !== 'N/A'
                              ? item.itemDescription
                              : item.equipmentType || decodedType}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {item.brandModel && item.brandModel !== 'N/A'
                              ? `Model: ${item.brandModel}`
                              : item.category || 'Office Equipment'}
                          </div>
                        </td>

                        {/* Serial Number */}
                        <td className="py-2.5 px-2 font-mono text-slate-700 text-[11px] whitespace-nowrap">
                          {item.serialNumber || '—'}
                        </td>

                        {/* Location / Custodian */}
                        <td className="py-2.5 px-2.5 max-w-[180px]">
                          {isAssigned ? (
                            <div className="flex items-center space-x-1.5 text-xs text-slate-800 font-semibold truncate">
                              {item.currentAssignment?.accountabilityType === 'Store' ? (
                                <>
                                  <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">
                                    {item.currentAssignment?.storeName || 'Branch Store'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">
                                    {item.currentAssignment?.employeeName || 'Staff Custodian'}
                                  </span>
                                </>
                              )}
                            </div>
                          ) : isAvailable ? (
                            <div className="text-xs text-teal-700 font-medium flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>Ready in Stock</span>
                            </div>
                          ) : isRepair ? (
                            <div className="text-xs text-amber-700 font-medium flex items-center space-x-1">
                              <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Under Repair</span>
                            </div>
                          ) : (
                            <div className="text-xs text-rose-700 font-medium flex items-center space-x-1">
                              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>For Disposal</span>
                            </div>
                          )}
                        </td>

                        {/* Condition */}
                        <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.currentCondition || 'Good'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isAssigned
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isAvailable
                                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                : isRepair
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Replace Part */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenReplace(e, item)}
                              title="Replace Part / Battery on this unit"
                              className="w-6 h-6 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md transition shadow-2xs"
                            >
                              <Wrench className="w-3 h-3 text-emerald-600" />
                            </button>

                            {/* Replace Whole */}
                            {isAssigned && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenReplaceWhole(e, item)}
                                title="Swap out this defective unit for an available unit in inventory"
                                className="w-6 h-6 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md transition shadow-2xs"
                              >
                                <RefreshCw className="w-3 h-3 text-indigo-600" />
                              </button>
                            )}

                            {/* Edit Equipment */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenEdit(e, item)}
                              title="Edit Equipment Details"
                              className="w-6 h-6 flex items-center justify-center bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-700 rounded-md border border-slate-200 hover:border-blue-300 shadow-2xs transition"
                            >
                              <Pencil className="w-3 h-3 text-blue-600" />
                            </button>

                            {/* Delete Equipment */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenDelete(e, item)}
                              title="Delete Equipment"
                              className="w-6 h-6 flex items-center justify-center bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-md border border-slate-200 hover:border-rose-300 shadow-2xs transition"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                            </button>

                            <span className="p-0.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Part Replacement Modal */}
      <ReplacePartModal
        isOpen={replaceModalOpen}
        onClose={() => setReplaceModalOpen(false)}
        targetItem={selectedTargetItem}
        onSuccess={fetchUnits}
      />

      {/* Whole Unit Replacement Modal */}
      <ReplaceWholeModal
        isOpen={replaceWholeModalOpen}
        onClose={() => setReplaceWholeModalOpen(false)}
        targetItem={selectedWholeTargetItem}
        onSuccess={fetchUnits}
      />

      {/* Batch Intake Modal */}
      <BatchIntakeModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        initialBrand={selectedBrand !== 'All' ? selectedBrand : 'Goldilocks'}
        initialEquipmentType={decodedType}
        onBatchCreated={fetchUnits}
        onSuccess={fetchUnits}
      />

      {/* Edit Equipment Modal */}
      <EditItemModal
        isOpen={editItemModalOpen}
        onClose={() => setEditItemModalOpen(false)}
        item={itemToEdit}
        onItemUpdated={fetchUnits}
      />

      {/* Delete Equipment Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Equipment"
        targetType="item"
        targetData={itemToDelete}
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
}

