import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  Wrench,
  Trash2,
  Search,
  Filter,
  ArrowRight,
  Laptop,
  Mouse,
  Zap,
  BatteryCharging,
  QrCode,
  Tablet,
  Printer,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Eye,
  RefreshCw,
  ExternalLink,
  Store,
  User,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../services/api';
import ReplacePartModal from '../components/ReplacePartModal';
import BatchIntakeModal from '../components/BatchIntakeModal';
import EditEquipmentTypeModal from '../components/EditEquipmentTypeModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

// Helper icon picker by equipment type
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

const BRAND_CONFIGS = [
  { brand: 'Goldilocks', logo: '/logos/goldilocks.png', legalOwner: 'Chawnah Foods Inc.' },
  { brand: 'DU99', logo: '/logos/du99.png', legalOwner: 'DU99 Commercial Corp.' },
  { brand: 'Taters', logo: '/logos/taters.png', legalOwner: 'Pop and Chips Specialist Inc.' },
  { brand: 'Icebergs', logo: '/logos/icebergs.png', legalOwner: 'Cool Ice Food Desserts' },
  { brand: 'Savore', logo: '/logos/savore.png', legalOwner: 'Savore Kitchen Corp' },
  { brand: 'Chatime', logo: '/logos/chatime.png', legalOwner: 'Salu-salong Saya Food Inc.' },
];

export default function InventoryGroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [brandStats, setBrandStats] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'AVAILABLE_ONLY' | 'REPAIR_DISPOSAL'

  // Expandable group state
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Modals state
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [replaceTargetItem, setReplaceTargetItem] = useState(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedBatchType, setSelectedBatchType] = useState('');

  // Edit & Delete equipment group state
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState(null);

  const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleOpenAddStock = (equipmentType = '') => {
    setSelectedBatchType(equipmentType);
    setBatchModalOpen(true);
  };

  const handleOpenEditGroup = (group) => {
    setGroupToEdit(group);
    setEditGroupModalOpen(true);
  };

  const handleOpenDeleteGroup = (group) => {
    setGroupToDelete(group);
    setDeleteError(null);
    setDeleteGroupModalOpen(true);
  };

  const handleConfirmDeleteGroup = async (group, force) => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.deleteEquipmentType(group.equipmentType, force);
      setDeleteGroupModalOpen(false);
      setGroupToDelete(null);
      fetchBrandStats();
      fetchInventoryGroups();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete equipment type');
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchBrandStats = async () => {
    try {
      const res = await fetch('/api/items/meta/brands');
      if (res.ok) {
        const data = await res.json();
        setBrandStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch brand stats:', err);
    }
  };

  const fetchInventoryGroups = async () => {
    setLoading(true);
    try {
      const url =
        selectedBrand && selectedBrand !== 'All'
          ? `/api/items/inventory-groups?brand=${encodeURIComponent(selectedBrand)}`
          : '/api/items/inventory-groups';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length > 0 && !expandedGroup) {
          const upsOrBattery = data.find(
            (g) => g.equipmentType === 'UPS' || g.equipmentType === 'UPS Battery'
          );
          setExpandedGroup(upsOrBattery ? upsOrBattery.equipmentType : data[0].equipmentType);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandStats();
  }, []);

  useEffect(() => {
    fetchInventoryGroups();
  }, [selectedBrand]);

  const handleOpenReplace = (item) => {
    setReplaceTargetItem(item);
    setReplaceModalOpen(true);
  };

  // Compute overall KPI aggregates
  const totalFleet = groups.reduce((acc, g) => acc + g.total, 0);
  const totalAssigned = groups.reduce((acc, g) => acc + g.assigned, 0);
  const totalAvailable = groups.reduce((acc, g) => acc + g.available, 0);
  const totalForRepair = groups.reduce((acc, g) => acc + (g.forRepair || 0), 0);
  const totalForDisposal = groups.reduce((acc, g) => acc + (g.forDisposal || 0), 0);
  const totalAllBrands = brandStats.reduce((acc, b) => acc + (b.total || 0), 0);

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.equipmentType.toLowerCase().includes(search.toLowerCase()) ||
      g.category?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'AVAILABLE_ONLY') {
      return g.available > 0;
    }
    if (filterMode === 'REPAIR_DISPOSAL') {
      return (g.forRepair || 0) > 0 || (g.forDisposal || 0) > 0;
    }
    return true;
  });

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1 border border-emerald-300">
            <Boxes className="w-3.5 h-3.5" />
            <span>Equipment Stock & Inventory Distribution</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventory by Equipment Type
          </h1>
          <p className="text-xs text-slate-500">
            Grouped inventory view showing currently assigned vs available units for each equipment type
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => handleOpenAddStock()}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-600/30 transition"
            title="Add stock / intake new units"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stocks</span>
          </button>

          <button
            onClick={() => setBatchModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Boxes className="w-4 h-4" />
            <span>Batch Intake</span>
          </button>

          <button
            onClick={() => {
              fetchBrandStats();
              fetchInventoryGroups();
            }}
            title="Refresh Inventory"
            className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Brand Availability Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Inventory Availability by Brand
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                Partitioned Pool
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select a brand to view stock availability, assigned units, and intake new hardware for its retail pool
            </p>
          </div>

          {selectedBrand !== 'All' && (
            <button
              onClick={() => setSelectedBrand('All')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 self-start sm:self-auto bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
            >
              Reset to All Brands
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* All Brands Tab */}
          <button
            onClick={() => setSelectedBrand('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 border ${
              selectedBrand === 'All'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>All Brands</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                selectedBrand === 'All'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-200 text-slate-700 font-semibold'
              }`}
            >
              {totalAllBrands}
            </span>
          </button>

          {/* Individual Brands */}
          {BRAND_CONFIGS.map((b) => {
            const stats = brandStats.find((s) => s.brand === b.brand);
            const count = stats?.total || 0;
            const isSel = selectedBrand === b.brand;

            return (
              <button
                key={b.brand}
                onClick={() => setSelectedBrand(b.brand)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 border ${
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
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isSel
                      ? 'bg-emerald-700 text-emerald-100'
                      : count > 0
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : 'bg-slate-100 text-slate-400 font-normal'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {selectedBrand !== 'All' && (
          <div className="text-[11px] bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 flex items-center space-x-2 text-slate-600">
            <span className="font-semibold text-slate-700">Selected Pool:</span>
            <span className="font-bold text-slate-900">{selectedBrand}</span>
            <span>&bull;</span>
            <span>Legal Owner:</span>
            <span className="font-bold text-emerald-800">
              {BRAND_CONFIGS.find((b) => b.brand === selectedBrand)?.legalOwner}
            </span>
            {selectedBrand === 'Goldilocks' && (
              <span className="text-slate-400 italic">
                (All franchisee stores operate equipment under Chawnah Foods Inc.)
              </span>
            )}
          </div>
        )}
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Equipment Types</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{groups.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Categorized groups</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Inventory</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalFleet}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Tracked equipment units</div>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/30 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assigned / In Use</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{totalAssigned}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Active with staff & stores
          </div>
        </div>

        <div className="bg-white border border-teal-200 bg-teal-50/30 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-teal-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Available in Stock</span>
            <Boxes className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-900">{totalAvailable}</div>
          <div className="text-[11px] text-teal-700 font-medium mt-0.5">Ready for issuance</div>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Repair & Disposal</span>
            <Wrench className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900">
            {totalForRepair + totalForDisposal}
          </div>
          <div className="text-[11px] text-rose-700 font-medium mt-0.5">
            {totalForRepair} repair &bull; {totalForDisposal} disposal
          </div>
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
            placeholder="Search equipment type (e.g. UPS, laptop, mouse, battery)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterMode === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Types ({groups.length})
          </button>
          <button
            onClick={() => setFilterMode('AVAILABLE_ONLY')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterMode === 'AVAILABLE_ONLY'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            In-Stock Stock Only
          </button>
          <button
            onClick={() => setFilterMode('REPAIR_DISPOSAL')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterMode === 'REPAIR_DISPOSAL'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Has Repair / Disposal
          </button>
        </div>
      </div>

      {/* Equipment Groups Table List (No Bar Graphs) */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Aggregating equipment inventory groups...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <Boxes className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-700 text-sm">No equipment types found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-5">Equipment Type</th>
                  <th className="py-3.5 px-4 text-center">Total Fleet</th>
                  <th className="py-3.5 px-4 text-center">Assigned / In Use</th>
                  <th className="py-3.5 px-4 text-center">Available Stock</th>
                  <th className="py-3.5 px-4 text-center">Under Maintenance</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredGroups.map((group, idx) => {
                  const Icon = getEquipmentIcon(group.equipmentType);
                  const repairOrDisposal = (group.forRepair || 0) + (group.forDisposal || 0);

                  return (
                    <tr
                      key={group.equipmentType}
                      onClick={() =>
                        navigate(
                          `/inventory/${encodeURIComponent(group.equipmentType)}${
                            selectedBrand !== 'All' ? `?brand=${encodeURIComponent(selectedBrand)}` : ''
                          }`
                        )
                      }
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      {/* Index */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Equipment Type & Category */}
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition text-sm">
                              {group.equipmentType}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {group.category || 'Office & Operations Equipment'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total Fleet */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          {group.total} {group.total === 1 ? 'unit' : 'units'}
                        </span>
                      </td>

                      {/* Assigned / In Use */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{group.assigned}</span>
                          <span className="text-[10px] text-emerald-600 font-normal">Active</span>
                        </span>
                      </td>

                      {/* Available Stock */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold text-xs ${
                            group.available > 0
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              group.available > 0 ? 'bg-teal-500' : 'bg-slate-300'
                            }`}
                          />
                          <span>{group.available}</span>
                          <span className="text-[10px] font-normal">
                            {group.available > 0 ? 'Ready' : 'In Stock'}
                          </span>
                        </span>
                      </td>

                      {/* Maintenance / Disposal */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {repairOrDisposal > 0 ? (
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs">
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                            <span>{repairOrDisposal}</span>
                            <span className="text-[10px] font-normal">Issues</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Add Stock / Units Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddStock(group.equipmentType);
                            }}
                            title={`Add Stock / Intake Units for ${group.equipmentType}`}
                            className="w-7 h-7 flex items-center justify-center bg-white hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-lg border border-slate-200 hover:border-emerald-300 shadow-2xs transition"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          {/* Edit Equipment Type Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditGroup(group);
                            }}
                            title={`Edit ${group.equipmentType} Equipment Group`}
                            className="w-7 h-7 flex items-center justify-center bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-700 rounded-lg border border-slate-200 hover:border-blue-300 shadow-2xs transition"
                          >
                            <Pencil className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {/* Delete Equipment Type Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteGroup(group);
                            }}
                            title={`Delete ${group.equipmentType} Equipment Group`}
                            className="w-7 h-7 flex items-center justify-center bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-lg border border-slate-200 hover:border-rose-300 shadow-2xs transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>

                          {/* View Units Action Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/inventory/${encodeURIComponent(group.equipmentType)}${
                                  selectedBrand !== 'All' ? `?brand=${encodeURIComponent(selectedBrand)}` : ''
                                }`
                              );
                            }}
                            title={`View and manage individual ${group.equipmentType} units`}
                            className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 shadow-2xs transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Part Replacement Modal */}
      <ReplacePartModal
        isOpen={replaceModalOpen}
        onClose={() => setReplaceModalOpen(false)}
        targetItem={replaceTargetItem}
        onSuccess={() => {
          fetchInventoryGroups();
          fetchBrandStats();
        }}
      />

      {/* Batch Stock Intake Modal */}
      <BatchIntakeModal
        isOpen={batchModalOpen}
        onClose={() => {
          setBatchModalOpen(false);
          setSelectedBatchType('');
        }}
        initialEquipmentType={selectedBatchType}
        initialBrand={selectedBrand !== 'All' ? selectedBrand : 'Goldilocks'}
        onBatchCreated={() => {
          fetchInventoryGroups();
          fetchBrandStats();
        }}
        onSuccess={() => {
          fetchInventoryGroups();
          fetchBrandStats();
        }}
      />

      {/* Edit Equipment Type Modal */}
      <EditEquipmentTypeModal
        isOpen={editGroupModalOpen}
        onClose={() => setEditGroupModalOpen(false)}
        group={groupToEdit}
        onSuccess={() => {
          fetchInventoryGroups();
          fetchBrandStats();
        }}
      />

      {/* Delete Equipment Type Modal */}
      <ConfirmDeleteModal
        isOpen={deleteGroupModalOpen}
        onClose={() => setDeleteGroupModalOpen(false)}
        onConfirm={handleConfirmDeleteGroup}
        title="Delete Equipment Type"
        targetType="equipmentGroup"
        targetData={groupToDelete}
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
}

