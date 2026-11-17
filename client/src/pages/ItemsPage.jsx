import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  PackagePlus,
  ChevronRight,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertTriangle,
  History,
  Download,
  ChevronDown,
  X,
  Boxes,
  Calendar,
  Building2,
  Tag,
  Hash,
  Eye,
  Layers,
  Video,
  Sparkles,
  ExternalLink,
  Wrench,
  RefreshCw,
  Barcode,
  Printer,
  Pencil,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api';
import AddItemModal from '../components/AddItemModal';
import EditItemModal from '../components/EditItemModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import BatchIntakeModal from '../components/BatchIntakeModal';
import ReplacePartModal from '../components/ReplacePartModal';
import ReplaceWholeModal from '../components/ReplaceWholeModal';
import AssetTagModal from '../components/AssetTagModal';
import { exportToCsv } from '../utils/exportCsv';

export default function ItemsPage() {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'batches'
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [expandedBatchItems, setExpandedBatchItems] = useState({});

  // Part & Whole replacement modals state
  const [selectedPartItem, setSelectedPartItem] = useState(null);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [selectedWholeItem, setSelectedWholeItem] = useState(null);
  const [isWholeModalOpen, setIsWholeModalOpen] = useState(false);

  // Pre-set groups & components expansion state
  const [expandedSets, setExpandedSets] = useState({});

  // Printable Asset Tag Modal state (for Sets and individual items)
  const [tagModalData, setTagModalData] = useState({
    isOpen: false,
    item: null,
    group: null,
  });

  // Edit & Delete modal states
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);
  const [isDeleteSetModalOpen, setIsDeleteSetModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleConfirmDeleteItem = async (target, force) => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await api.deleteItem(target._id, force);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchItems();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete item');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmDeleteSet = async (targetGroup, force) => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      if (targetGroup?.items) {
        for (const it of targetGroup.items) {
          await api.deleteItem(it._id, force);
        }
      }
      setIsDeleteSetModalOpen(false);
      setSetToDelete(null);
      fetchItems();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete set');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Set & Component Part History Navigation
  const handleOpenSetHistory = (group, part = null) => {
    if (part?._id) {
      navigate(`/history/item/${encodeURIComponent(part._id)}`);
      return;
    }
    const tag = group?.setEquipmentTag || group?.setItemNumber || group?.setTag;
    if (tag) {
      navigate(`/history/set/${encodeURIComponent(tag)}`);
    } else if (group?.items?.[0]?._id) {
      navigate(`/history/item/${encodeURIComponent(group.items[0]._id)}`);
    }
  };

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
    const presetMap = new Map();
    const standalone = [];

    (items || []).forEach((item) => {
      const setTag = getItemSetTag(item);
      if (setTag) {
        const accId = item.currentAssignment?.accountabilityId
          ? String(item.currentAssignment.accountabilityId)
          : null;
        const custName =
          item.currentAssignment?.employeeName ||
          item.currentAssignment?.storeName ||
          'In Storage';
        const storeCode =
          item.currentAssignment?.storeCode ||
          (item.itemNumber && item.itemNumber.startsWith('ITM-S')
            ? item.itemNumber.split('-')[1]
            : null);

        const groupKey = accId
          ? `${accId}_${setTag}`
          : storeCode
          ? `store_${storeCode}_${setTag}`
          : `${custName}_${setTag}`;

        if (!presetMap.has(groupKey)) {
          const isCctv = setTag.toLowerCase().includes('cctv');
          const setCodeSuffix = isCctv ? 'CCTV' : 'DESK';
          const fallbackTag = storeCode
            ? `CFI-STR-${storeCode}-SET-${setCodeSuffix}`
            : `CFI-SET-${setCodeSuffix}`;
          const fallbackItemNum = storeCode
            ? `SET-S${storeCode}-${setCodeSuffix}`
            : `SET-${setCodeSuffix}`;

          presetMap.set(groupKey, {
            setKey: groupKey,
            setTag,
            setEquipmentTag:
              item.setEquipmentTag ||
              item.currentAssignment?.setEquipmentTag ||
              fallbackTag,
            setItemNumber:
              item.setItemNumber ||
              item.currentAssignment?.setItemNumber ||
              fallbackItemNum,
            custodian: custName,
            department: item.currentAssignment?.department || 'Store Operations / Retail',
            accountabilityId: accId,
            status: item.status || 'Assigned',
            condition: item.currentCondition || 'Good',
            brand: item.brand || 'Goldilocks',
            legalOwner: item.legalOwner || 'Chawnah Foods Inc.',
            items: [],
          });
        }
        presetMap.get(groupKey).items.push(item);
      } else {
        standalone.push(item);
      }
    });

    // Ensure components inside every preset group are sorted sequentially
    presetMap.forEach((grp) => {
      grp.items.sort((a, b) =>
        (a.itemNumber || a.assetTag || '').localeCompare(
          b.itemNumber || b.assetTag || '',
          undefined,
          { numeric: true, sensitivity: 'base' }
        )
      );
    });

    return {
      presetGroups: Array.from(presetMap.values()),
      standaloneItems: standalone,
    };
  }, [items]);

  const allExpanded =
    presetGroups.length > 0 && presetGroups.every((g) => expandedSets[g.setKey]);

  const toggleAllSets = () => {
    if (allExpanded) {
      setExpandedSets({});
    } else {
      const next = {};
      presetGroups.forEach((g) => {
        next[g.setKey] = true;
      });
      setExpandedSets(next);
    }
  };

  const handleOpenPartModal = (item) => {
    setSelectedPartItem(item);
    setIsPartModalOpen(true);
  };

  const handleOpenWholeModal = (item) => {
    setSelectedWholeItem(item);
    setIsWholeModalOpen(true);
  };

  const navigate = useNavigate();

  const categories = [
    'All',
    'Laptops & Desktops',
    'Mobile & Tablets',
    'Warehouse & Barcode Scanners',
    'Laboratory & QA Equipment',
    'Production & Machinery',
    'Printers & Peripherals',
    'Office Equipment',
  ];

  const statuses = ['All', 'Available', 'Assigned', 'Under Maintenance'];

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.getItems({
        search,
        category: selectedCategory,
        status: selectedStatus,
      });
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const data = await api.getInventoryBatches();
      setBatches(data);
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchBatches();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const toggleExpandBatch = async (batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId(null);
      return;
    }
    setExpandedBatchId(batchId);
    if (!expandedBatchItems[batchId]) {
      try {
        const detail = await api.getInventoryBatch(batchId);
        setExpandedBatchItems((prev) => ({
          ...prev,
          [batchId]: detail.items || [],
        }));
      } catch (err) {
        console.error('Error fetching batch item details:', err);
      }
    }
  };

  const handleExportCsv = () => {
    const exportData = items.map((i) => ({
      'Item #': i.itemNumber || '',
      'Asset Tag': i.assetTag || '',
      'Batch #': i.batchNumber || '',
      'Description': i.itemDescription || '',
      'Brand & Model': i.brandModel || '',
      'Serial Number': i.serialNumber || '',
      'Category': i.category || '',
      'Status': i.status || '',
      'Condition': i.currentCondition || '',
      'Assigned To': i.currentAssignment?.employeeName || (i.currentAssignment?.storeName ? `Store: ${i.currentAssignment?.storeName}` : 'Unassigned / In Storage'),
      'Assigned Department': i.currentAssignment?.department || '',
      'PO Number': i.poNumber || '',
      'Supplier': i.supplier || '',
    }));
    exportToCsv(`Chawnah_Equipment_Catalog_${new Date().toISOString().split('T')[0]}.csv`, exportData);
  };

  const handleExportBatchCsv = (batch) => {
    const batchItems = expandedBatchItems[batch._id] || [];
    const exportData = batchItems.map((it) => ({
      'Batch #': batch.batchNumber,
      'Item #': it.itemNumber || '',
      'Asset Tag': it.assetTag || '',
      'Description': it.itemDescription || '',
      'Brand & Model': it.brandModel || '',
      'Serial Number': it.serialNumber || '',
      'Status': it.status || '',
      'Condition': it.currentCondition || '',
      'Received Date': new Date(batch.receivedDate).toLocaleDateString(),
      'PO Number': batch.poNumber || '',
      'Supplier': batch.supplier || '',
      'Received By': batch.receivedBy || '',
    }));
    exportToCsv(`Batch_${batch.batchNumber}_Inventory_Receiving.csv`, exportData);
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top View Selector Tabs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Equipment Fleet Catalog</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'catalog'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {items.length}
            </span>
            {presetGroups.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {presetGroups.length} Pre-Sets
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batches')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'batches'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-indigo-600" />
            <span>Inventory Intake Records (Batches)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'batches'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {batches.length}
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="inline-flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-600/20 transition flex-1 sm:flex-initial"
          >
            <Boxes className="w-4 h-4" />
            <span>+ Batch Intake</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center space-x-1.5 px-3 sm:px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex-1 sm:flex-initial"
          >
            <PackagePlus className="w-4 h-4 text-emerald-400" />
            <span>+ Add Equipment</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INDIVIDUAL ASSETS CATALOG TABLE                   */}
      {/* ======================================================== */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Input */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by description, serial number, tag, batch, or owner..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium"
                >
                  Search
                </button>
              </form>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Category Filter Dropdown */}
                <div className="relative inline-flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`pl-8 pr-8 py-2 rounded-lg text-xs font-semibold cursor-pointer transition appearance-none border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      selectedCategory !== 'All'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <option value="All">All Categories</option>
                    {categories
                      .filter((c) => c !== 'All')
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Status Filter Dropdown */}
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={`pl-3 pr-8 py-2 rounded-lg text-xs font-semibold cursor-pointer transition appearance-none border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      selectedStatus !== 'All'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <option value="All">All Statuses</option>
                    {statuses
                      .filter((s) => s !== 'All')
                      .map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                  </select>
                  <div
                    className={`absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none ${
                      selectedStatus !== 'All' ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Expand / Collapse All Pre-Sets Toggle */}
                {presetGroups.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllSets}
                    className={`inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition border ${
                      allExpanded
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title="Toggle expand / collapse on all pre-set equipment"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>{allExpanded ? 'Collapse All Sets' : 'Expand All Sets'}</span>
                  </button>
                )}

                {/* Export CSV button */}
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  title="Export Catalog to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Active Filter Badges */}
            {(selectedCategory !== 'All' || selectedStatus !== 'All') && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Active Filters:</span>
                {selectedCategory !== 'All' && (
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-semibold"
                  >
                    <span>Category: {selectedCategory}</span>
                    <X className="w-3 h-3 text-emerald-600" />
                  </button>
                )}
                {selectedStatus !== 'All' && (
                  <button
                    onClick={() => setSelectedStatus('All')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 font-semibold"
                  >
                    <span>Status: {selectedStatus}</span>
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedStatus('All');
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-600 underline font-medium ml-1"
                >
                  Reset all
                </button>
              </div>
            )}
          </div>

          {/* Items Table List */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading equipment catalog...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-xs text-rose-600">{error}</div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No items match your criteria.</p>
                <p className="text-slate-400">Try changing your search terms or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-xs table-fixed">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[14%]" />
                    <col className="w-[10%]" />
                    <col className="w-[13%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[23%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Equipment &amp; Tag</th>
                      <th className="py-2.5 px-2.5">Category &amp; Model</th>
                      <th className="py-2.5 px-2 whitespace-nowrap">Serial #</th>
                      <th className="py-2.5 px-2.5">Custodian</th>
                      <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Condition</th>
                      <th className="py-2.5 px-1.5 text-center whitespace-nowrap">Status</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* 1. PRE-SET EQUIPMENT GROUPS */}
                    {presetGroups.map((group) => {
                      const isExpanded = !!expandedSets[group.setKey];
                      const sortedTags = (group.items || [])
                        .map((i) => i.assetTag)
                        .filter(Boolean)
                        .sort((a, b) =>
                          a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
                        );
                      const firstTag = sortedTags[0];
                      const lastTag = sortedTags[sortedTags.length - 1];
                      const tagRange =
                        firstTag && lastTag && firstTag !== lastTag
                          ? `${firstTag} → ${lastTag}`
                          : firstTag || 'TAG-SET';
                      const isCctv = group.setTag?.toLowerCase().includes('cctv');

                      return (
                        <React.Fragment key={group.setKey}>
                          {/* Pre-set Main Summary Row */}
                          <tr
                            onClick={() => toggleSetExpanded(group.setKey)}
                            className={`${
                              isCctv
                                ? 'bg-amber-50/40 hover:bg-amber-50/80 border-b border-amber-100/90'
                                : 'bg-blue-50/40 hover:bg-blue-50/80 border-b border-blue-100/90'
                            } cursor-pointer transition group`}
                          >
                            {/* Equipment & Tag */}
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSetExpanded(group.setKey);
                                  }}
                                  className={`w-6 h-6 rounded-md ${
                                    isCctv
                                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                  } flex items-center justify-center transition shadow-2xs shrink-0 cursor-pointer`}
                                  aria-label={isExpanded ? 'Collapse components' : 'Expand components'}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <span
                                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs inline-flex items-center space-x-1 shrink-0 text-white ${
                                    isCctv ? 'bg-amber-600' : 'bg-blue-600'
                                  }`}
                                >
                                  {isCctv ? (
                                    <Video className="w-3 h-3" />
                                  ) : (
                                    <Layers className="w-3 h-3" />
                                  )}
                                  <span>{group.setTag}</span>
                                </span>

                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isCctv
                                      ? 'text-amber-800 bg-amber-100/80 border-amber-200'
                                      : 'text-blue-700 bg-blue-100/80 border-blue-200'
                                  }`}
                                >
                                  {group.items.length} Components
                                </span>
                              </div>

                              {/* Official Set Equipment Tag & Item Code */}
                              <div className="mt-1 ml-6 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                  {group.setItemNumber && (
                                    <span
                                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold border shadow-2xs ${
                                        isCctv
                                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                                          : 'bg-blue-50 text-blue-900 border-blue-300'
                                      }`}
                                    >
                                      {group.setItemNumber}
                                    </span>
                                  )}

                                  <span className="font-mono text-[11px] font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs inline-flex items-center space-x-1">
                                    <Tag className="w-3 h-3 text-slate-500" />
                                    <span>Tag: {group.setEquipmentTag}</span>
                                  </span>
                                </div>

                                <div>
                                  <span
                                    className="font-mono text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                                    title={`Component Tags: ${tagRange}`}
                                  >
                                    Range: {tagRange}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-1 ml-6 text-[11px] text-slate-400 truncate max-w-[260px]">
                                Includes:{' '}
                                {group.items
                                  .map((i) => i.itemDescription || i.equipmentType)
                                  .join(', ')}
                              </div>
                            </td>

                            {/* Category & Model */}
                            <td className="py-2.5 px-2.5">
                              <div className="font-semibold text-slate-800">
                                {isCctv ? 'Store CCTV Surveillance' : 'Desktop Hardware'}
                              </div>
                              <span className="inline-block text-[10px] text-slate-500">
                                {group.brand} • {group.items.length} units
                              </span>
                            </td>

                            {/* Serial Number */}
                            <td className="py-2.5 px-2 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold shadow-2xs">
                                {group.items.length} Serials
                              </span>
                            </td>

                            {/* Custodian */}
                            <td className="py-2.5 px-2.5">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 leading-tight">
                                    {group.custodian}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {group.department}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Condition */}
                            <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {group.condition || 'Good'}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                                <span>{group.status}</span>
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenSetHistory(group);
                                  }}
                                  title="View Set History & Part Audit Trail"
                                  className="w-7 h-7 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition border border-indigo-200 shadow-2xs"
                                >
                                  <History className="w-3.5 h-3.5 text-indigo-600" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenSetTagModal(group);
                                  }}
                                  title="Print Barcode Equipment Tag for this Set Group"
                                  className="w-7 h-7 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition border border-emerald-300 shadow-2xs"
                                >
                                  <Barcode className="w-3.5 h-3.5 text-emerald-700" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSetToDelete(group);
                                    setDeleteError(null);
                                    setIsDeleteSetModalOpen(true);
                                  }}
                                  title="Delete entire Equipment Set"
                                  className="w-7 h-7 flex items-center justify-center bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-lg transition border border-slate-200 hover:border-rose-300 shadow-2xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSetExpanded(group.setKey);
                                  }}
                                  title={isExpanded ? 'Hide Components' : `View ${group.items.length} Components`}
                                  className={`px-2 py-1 bg-white ${
                                    isCctv
                                      ? 'hover:bg-amber-50 text-amber-800 border-amber-200'
                                      : 'hover:bg-blue-50 text-blue-700 border-blue-200'
                                  } rounded-lg transition inline-flex items-center space-x-1 border shadow-2xs`}
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                  <span className="font-mono text-[10px] font-bold">
                                    {group.items.length}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Individual Component Rows */}
                          {isExpanded &&
                            group.items.map((it) => {
                              const isAssigned = it.status === 'Assigned';
                              const isMaintenance =
                                it.status === 'Under Maintenance' ||
                                it.status === 'Decommissioned';
                              const isAvailable = it.status === 'Available';

                              return (
                                <tr
                                  key={it._id}
                                  onClick={() => navigate(`/items/${it._id}`)}
                                  className="bg-slate-50/70 hover:bg-slate-100/90 cursor-pointer transition border-b border-slate-100/80 group"
                                >
                                  {/* Indented Component Description & Tag */}
                                  <td className="py-2 px-3 pl-8">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-blue-400 font-mono text-xs">↳</span>
                                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate max-w-[150px]">
                                        {it.itemDescription && it.itemDescription !== 'N/A'
                                          ? it.itemDescription
                                          : it.equipmentType && it.equipmentType !== 'Other'
                                          ? it.equipmentType
                                          : it.category || 'Component'}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-0.5 ml-4">
                                      {it.itemNumber && (
                                        <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                                          {it.itemNumber}
                                        </span>
                                      )}
                                      <span className="font-mono text-[10px] text-slate-500 font-semibold">
                                        Tag: {it.assetTag}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Category & Model */}
                                  <td className="py-2 px-2.5">
                                    {it.brandModel && it.brandModel !== 'N/A' ? (
                                      <div className="font-medium text-slate-800 truncate max-w-[130px]">{it.brandModel}</div>
                                    ) : null}
                                    <span className="inline-block text-[10px] text-slate-500">
                                      {it.category}
                                    </span>
                                  </td>

                                  {/* Serial Number */}
                                  <td className="py-2 px-2 font-mono text-slate-700 text-[11px] font-semibold truncate max-w-[110px]" title={it.serialNumber}>
                                    {it.serialNumber}
                                  </td>

                                  {/* Custodian */}
                                  <td className="py-2 px-2.5">
                                    <span className="text-slate-600 text-xs font-medium truncate block max-w-[120px]" title={group.custodian}>
                                      {group.custodian}
                                    </span>
                                  </td>

                                  {/* Condition */}
                                  <td className="py-2 px-1.5 text-center">
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                      {it.currentCondition}
                                    </span>
                                  </td>

                                  {/* Status */}
                                  <td className="py-2 px-1.5 text-center">
                                    <span
                                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        isAvailable
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : isAssigned
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      <span>{it.status}</span>
                                    </span>
                                  </td>

                                  {/* Action */}
                                  <td className="py-2 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end space-x-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenItemTagModal(it);
                                        }}
                                        title="Print Asset Tag Barcode"
                                        className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 shadow-2xs transition"
                                      >
                                        <Barcode className="w-3.5 h-3.5 text-slate-600" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setItemToEdit(it);
                                          setIsEditModalOpen(true);
                                        }}
                                        title="Edit Equipment Details"
                                        className="w-6 h-6 flex items-center justify-center bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-700 rounded-md border border-slate-200 hover:border-blue-300 shadow-2xs transition"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                      </button>

                                      <Link
                                        to={`/items/${it._id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        title="View Item Details"
                                        className="w-6 h-6 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md border border-blue-200 shadow-2xs transition"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                                      </Link>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenSetHistory(group, it);
                                        }}
                                        title="View Component Part History & Specifications"
                                        className="w-6 h-6 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200 shadow-2xs transition"
                                      >
                                        <History className="w-3.5 h-3.5 text-indigo-600" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenPartModal(it);
                                        }}
                                        title="Replace Part / Battery on this unit"
                                        className="w-6 h-6 flex items-center justify-center bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-md border border-slate-200 hover:border-emerald-300 shadow-2xs transition"
                                      >
                                        <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                                      </button>

                                      {isAssigned && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenWholeModal(it);
                                          }}
                                          title="Replace whole defective unit"
                                          className="w-6 h-6 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200 shadow-2xs transition"
                                        >
                                          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setItemToDelete(it);
                                          setDeleteError(null);
                                          setIsDeleteModalOpen(true);
                                        }}
                                        title="Delete Equipment"
                                        className="w-6 h-6 flex items-center justify-center bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-md border border-slate-200 hover:border-rose-300 shadow-2xs transition"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}

                    {/* 2. STANDALONE ITEMS */}
                    {standaloneItems.map((it) => {
                      const isAssigned = it.status === 'Assigned';
                      const isMaintenance =
                        it.status === 'Under Maintenance' || it.status === 'Decommissioned';
                      const isAvailable = it.status === 'Available';

                      return (
                        <tr
                          key={it._id}
                          onClick={() => navigate(`/items/${it._id}`)}
                          className="hover:bg-slate-50/80 cursor-pointer transition group"
                        >
                          {/* Description & Asset Tag */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition truncate max-w-xs">
                              {it.itemDescription && it.itemDescription !== 'N/A'
                                ? it.itemDescription
                                : it.equipmentType && it.equipmentType !== 'Other'
                                ? it.equipmentType
                                : it.category || 'Equipment'}
                            </div>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              {it.itemNumber && (
                                <span className="font-mono text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 rounded font-bold">
                                  {it.itemNumber}
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-slate-500 font-semibold">
                                Tag: {it.assetTag}
                              </span>
                              {it.batchNumber && (
                                <span className="text-[9px] font-mono px-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                                  {it.batchNumber}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Category & Model */}
                          <td className="py-2.5 px-2.5">
                            {it.brandModel && it.brandModel !== 'N/A' ? (
                              <div className="font-medium text-slate-800 truncate max-w-[130px]">{it.brandModel}</div>
                            ) : null}
                            <span className="inline-block text-[10px] text-slate-500">
                              {it.category}
                            </span>
                          </td>

                          {/* Serial Number */}
                          <td className="py-2.5 px-2 font-mono text-slate-700 text-[11px] font-semibold truncate max-w-[120px]" title={it.serialNumber}>
                            {it.serialNumber}
                          </td>

                          {/* Custodian */}
                          <td className="py-2.5 px-2.5">
                            {isAssigned && it.currentAssignment ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 leading-tight">
                                    {it.currentAssignment.employeeName || it.currentAssignment.storeName}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {it.currentAssignment.department || 'Store Accountability'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                {isAvailable ? 'In Storage / Available' : 'Under Repair'}
                              </span>
                            )}
                          </td>

                          {/* Condition */}
                          <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {it.currentCondition}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                isAvailable
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isAssigned
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <span>{it.status}</span>
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenItemTagModal(it);
                                }}
                                title="Print Asset Tag Barcode"
                                className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 shadow-2xs transition"
                              >
                                <Barcode className="w-3.5 h-3.5 text-slate-600" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToEdit(it);
                                  setIsEditModalOpen(true);
                                }}
                                title="Edit Equipment Details"
                                className="w-6 h-6 flex items-center justify-center bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-700 rounded-md border border-slate-200 hover:border-blue-300 shadow-2xs transition"
                              >
                                <Pencil className="w-3.5 h-3.5 text-blue-600" />
                              </button>

                              <Link
                                to={`/items/${it._id}`}
                                onClick={(e) => e.stopPropagation()}
                                title="View Item Details"
                                className="w-6 h-6 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 shadow-2xs transition"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                              </Link>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPartModal(it);
                                }}
                                title="Replace Part / Battery on this unit"
                                className="w-6 h-6 flex items-center justify-center bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-md border border-slate-200 hover:border-emerald-300 shadow-2xs transition"
                              >
                                <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                              </button>

                              {isAssigned && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenWholeModal(it);
                                  }}
                                  title="Replace whole defective unit"
                                  className="w-6 h-6 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200 shadow-2xs transition"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToDelete(it);
                                  setDeleteError(null);
                                  setIsDeleteModalOpen(true);
                                }}
                                title="Delete Equipment"
                                className="w-6 h-6 flex items-center justify-center bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-md border border-slate-200 hover:border-rose-300 shadow-2xs transition"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: INVENTORY INTAKE RECORDS (BATCHES)               */}
      {/* ======================================================== */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold mb-2 border border-indigo-500/30">
                <Boxes className="w-3.5 h-3.5" />
                <span>Bulk Goods Intake & Receiving Journal</span>
              </div>
              <h2 className="text-xl font-black tracking-tight">
                Official Inventory Intake Records
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Audited records of procured batches received into inventory. Each batch tracks the parent purchase order and every individual asset unit created.
              </p>
            </div>

            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition self-start sm:self-auto shrink-0 flex items-center space-x-2"
            >
              <Boxes className="w-4 h-4" />
              <span>+ New Batch Intake</span>
            </button>
          </div>

          {loadingBatches ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading inventory intake records...
            </div>
          ) : batches.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-3">
              <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">No Batch Intake Records Found</p>
              <p className="text-slate-400 max-w-sm mx-auto">
                Use the "+ Batch Intake" button to register bulk equipment shipments (e.g. 10 UPS Batteries, 20 Scanners) with unique item numbers.
              </p>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition"
              >
                Create First Batch Intake
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => {
                const isExpanded = expandedBatchId === batch._id;
                const batchItemsList = expandedBatchItems[batch._id] || [];
                const summary = batch.statusSummary || {
                  total: batch.quantity,
                  available: batch.quantity,
                  assigned: 0,
                  maintenance: 0,
                };

                return (
                  <div
                    key={batch._id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition overflow-hidden"
                  >
                    {/* Main Batch Card Header */}
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                            <Boxes className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm font-black text-indigo-950">
                                {batch.batchNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {batch.category}
                              </span>
                              {batch.poNumber && (
                                <span className="font-mono text-[10px] text-slate-500 font-bold">
                                  Ref: {batch.poNumber}
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-base mt-0.5">
                              {batch.itemDescription}
                            </h3>
                          </div>
                        </div>

                        {/* Top Badges & Actions */}
                        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                          <span className="font-mono text-xs font-black px-3 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200">
                            {batch.quantity} Units Total
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleExpandBatch(batch._id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                              isExpanded
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{isExpanded ? 'Hide Units' : 'Inspect All Units'}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Metadata Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Brand & Model
                          </span>
                          <span className="font-semibold text-slate-800">
                            {batch.brandModel}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Supplier / Vendor
                          </span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {batch.supplier || 'Standard Procurement'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Date Received & Receiver
                          </span>
                          <span className="font-semibold text-slate-800">
                            {new Date(batch.receivedDate).toLocaleDateString()} &bull;{' '}
                            {batch.receivedBy || 'Admin'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Current Stock Status
                          </span>
                          <div className="flex items-center space-x-2 mt-0.5 font-bold text-[11px]">
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {summary.available} Ready
                            </span>
                            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {summary.assigned} Issued
                            </span>
                          </div>
                        </div>
                      </div>

                      {batch.remarks && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                          Intake Note: "{batch.remarks}"
                        </p>
                      )}
                    </div>

                    {/* Expandable Individual Units Table */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/70 p-5 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>
                              Individual Unique Assets Created Under {batch.batchNumber} ({batchItemsList.length} Units)
                            </span>
                          </h4>

                          <button
                            onClick={() => handleExportBatchCsv(batch)}
                            className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Batch CSV</span>
                          </button>
                        </div>

                        {batchItemsList.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            Loading items for this batch...
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-xs">
                            <table className="w-full min-w-[650px] text-left text-xs">
                              <thead>
                                <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                                  <th className="py-2.5 px-4">Item Number</th>
                                  <th className="py-2.5 px-4">Asset Tag</th>
                                  <th className="py-2.5 px-4">Serial Number</th>
                                  <th className="py-2.5 px-4">Condition</th>
                                  <th className="py-2.5 px-4">Current Status</th>
                                  <th className="py-2.5 px-4 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {batchItemsList.map((unit) => (
                                  <tr
                                    key={unit._id}
                                    className="hover:bg-indigo-50/40 transition"
                                  >
                                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-800">
                                      {unit.itemNumber}
                                    </td>
                                    <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">
                                      {unit.assetTag}
                                    </td>
                                    <td className="py-2.5 px-4 font-mono text-slate-700">
                                      {unit.serialNumber}
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                        {unit.currentCondition}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <span
                                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          unit.status === 'Available'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : unit.status === 'Assigned'
                                            ? 'bg-indigo-100 text-indigo-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        <span>{unit.status}</span>
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-right">
                                      <Link
                                        to={`/items/${unit._id}`}
                                        className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center space-x-1"
                                      >
                                        <span>Details</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Single Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={(newItem) => {
          fetchItems();
          fetchBatches();
          if (newItem?._id) {
            navigate(`/items/${newItem._id}`);
          }
        }}
      />

      {/* Batch Intake Modal */}
      <BatchIntakeModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchCreated={(res) => {
          fetchItems();
          fetchBatches();
          setActiveTab('batches');
        }}
      />

      {/* Part Replacement Modal */}
      <ReplacePartModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        targetItem={selectedPartItem}
        onSuccess={() => {
          fetchItems();
          fetchBatches();
        }}
      />

      {/* Whole Unit Replacement Modal */}
      <ReplaceWholeModal
        isOpen={isWholeModalOpen}
        onClose={() => setIsWholeModalOpen(false)}
        targetItem={selectedWholeItem}
        onSuccess={() => {
          fetchItems();
          fetchBatches();
        }}
      />

      {/* Printable Barcode Asset Tag Modal (Sets & Items) */}
      <AssetTagModal
        isOpen={tagModalData.isOpen}
        onClose={() => setTagModalData({ isOpen: false, item: null, group: null })}
        item={tagModalData.item}
        group={tagModalData.group}
      />

      {/* Edit Item / Equipment Modal */}
      <EditItemModal
        isOpen={isEditModalOpen}
        item={itemToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setItemToEdit(null);
        }}
        onItemUpdated={() => {
          fetchItems();
        }}
      />

      {/* Confirm Delete Single Item Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        targetType="item"
        targetData={itemToDelete}
        title="Delete Equipment Asset"
        loading={deleteLoading}
        error={deleteError}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDeleteItem}
      />

      {/* Confirm Delete Entire Set Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteSetModalOpen}
        targetType="item"
        targetData={
          setToDelete
            ? {
                itemDescription: setToDelete.setName || setToDelete.setTag || 'Equipment Pre-Set Package',
                assetTag: setToDelete.setEquipmentTag || setToDelete.setItemNumber || 'SET',
                serialNumber: `${setToDelete.items?.length || 0} Components`,
                status: setToDelete.status || 'Active',
              }
            : null
        }
        title="Delete Entire Equipment Set"
        loading={deleteLoading}
        error={deleteError}
        onClose={() => {
          setIsDeleteSetModalOpen(false);
          setSetToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={() => handleConfirmDeleteSet(setToDelete, true)}
      />
    </div>
  );
}
