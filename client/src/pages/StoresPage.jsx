import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Search,
  Package,
  FilePlus,
  Printer,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Users,
  Download,
  Info,
  X,
  FileText,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Check,
  Wrench,
  RefreshCw,
  Layers,
  Video,
  Tag,
  Barcode,
  Eye,
  History,
} from 'lucide-react';
import { CHAWNAH_STORES } from '../data/stores';
import { api } from '../services/api';
import ReturnModal from '../components/ReturnModal';
import ReplacePartModal from '../components/ReplacePartModal';
import ReplaceWholeModal from '../components/ReplaceWholeModal';
import AssetTagModal from '../components/AssetTagModal';
import { exportToCsv } from '../utils/exportCsv';

export default function StoresPage() {
  const navigate = useNavigate();
  const [selectedStore, setSelectedStore] = useState('ROBINSON MARASBARAS');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('all'); // 'all' | 'with-items' | 'empty'
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'forms' | 'returns'
  const [forms, setForms] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const storeDropdownRef = useRef(null);

  // Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnItem, setSelectedReturnItem] = useState(null);
  const [selectedFormId, setSelectedFormId] = useState(null);

  // Replacement modals state
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
    if (part?._id) {
      navigate(`/history/item/${encodeURIComponent(part._id)}?storeName=${encodeURIComponent(selectedStore || '')}`);
      return;
    }
    const tag = group?.setEquipmentTag || group?.setItemNumber || group?.setTag;
    if (tag) {
      navigate(`/history/set/${encodeURIComponent(tag)}?storeName=${encodeURIComponent(selectedStore || '')}`);
    } else if (group?.items?.[0]?._id) {
      navigate(`/history/item/${encodeURIComponent(group.items[0]._id)}?storeName=${encodeURIComponent(selectedStore || '')}`);
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

  const handleOpenPartModal = (item) => {
    setSelectedPartItem(item);
    setIsPartModalOpen(true);
  };

  const handleOpenWholeModal = (item) => {
    setSelectedWholeItem(item);
    setIsWholeModalOpen(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [formsData, itemsData] = await Promise.all([
        api.getAccountabilities({ status: 'All' }),
        api.getItems({ status: 'All' }),
      ]);
      setForms(formsData);
      setItems(itemsData);
    } catch (err) {
      console.error('Error fetching store equipment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target)) {
        setIsStoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizeStore = (str) => (str || '').trim().toLowerCase();

  // Compute item count per store
  const storeItemCounts = useMemo(() => {
    const counts = {};
    CHAWNAH_STORES.forEach((s) => {
      counts[s] = 0;
    });
    items.forEach((it) => {
      if (
        it.status === 'Assigned' &&
        it.currentAssignment?.accountabilityType === 'Store' &&
        it.currentAssignment?.storeName
      ) {
        const match = CHAWNAH_STORES.find(
          (s) => normalizeStore(s) === normalizeStore(it.currentAssignment.storeName)
        );
        if (match) {
          counts[match] = (counts[match] || 0) + 1;
        }
      }
    });
    return counts;
  }, [items]);

  // Stores with equipment vs empty
  const storesWithEquipment = useMemo(
    () => CHAWNAH_STORES.filter((s) => storeItemCounts[s] > 0),
    [storeItemCounts]
  );
  const emptyStores = useMemo(
    () => CHAWNAH_STORES.filter((s) => !storeItemCounts[s]),
    [storeItemCounts]
  );

  // Filtered store list for the dropdown
  const displayedStores = useMemo(() => {
    let list = CHAWNAH_STORES;
    if (storeFilter === 'with-items') {
      list = storesWithEquipment;
    } else if (storeFilter === 'empty') {
      list = emptyStores;
    }

    if (storeSearch.trim()) {
      const q = storeSearch.trim().toLowerCase();
      list = list.filter((s) => s.toLowerCase().includes(q));
    }
    return list;
  }, [storeFilter, storeSearch, storesWithEquipment, emptyStores]);

  // Items currently assigned to the selected store
  const storeItems = useMemo(
    () =>
      items.filter(
        (it) =>
          it.status === 'Assigned' &&
          it.currentAssignment?.accountabilityType === 'Store' &&
          normalizeStore(it.currentAssignment?.storeName) === normalizeStore(selectedStore)
      ),
    [items, selectedStore]
  );

  // Forms for the selected store
  const storeForms = useMemo(
    () =>
      forms.filter(
        (f) =>
          f.accountabilityType === 'Store' &&
          normalizeStore(f.storeName) === normalizeStore(selectedStore)
      ),
    [forms, selectedStore]
  );

  // Group active store items by their release batch (accountability form)
  const itemsByBatch = useMemo(() => {
    if (!storeItems.length) return [];

    const batchesMap = new Map();

    storeItems.forEach((item) => {
      const accId = item.currentAssignment?.accountabilityId || 'standalone';
      if (!batchesMap.has(accId)) {
        const matchingForm = forms.find(
          (f) => String(f._id) === String(accId) || String(f.id) === String(accId)
        );
        batchesMap.set(accId, {
          batchId: accId !== 'standalone' ? accId : null,
          formNumber:
            matchingForm?.formNumber ||
            item.currentAssignment?.formNumber ||
            (accId !== 'standalone' ? 'Form on Record' : 'Direct Assignment'),
          dateIssued:
            matchingForm?.issuance?.date || item.currentAssignment?.dateIssued,
          custodian:
            matchingForm?.employeeInfo?.name ||
            item.currentAssignment?.employeeName ||
            'Store Supervisor / Custodian',
          releasedBy: matchingForm?.issuance?.releasedBy,
          items: [],
        });
      }
      batchesMap.get(accId).items.push(item);
    });

    const result = Array.from(batchesMap.values());

    return result.map((batch) => {
      const presetMap = new Map();
      const standalone = [];

      batch.items.forEach((item) => {
        const setTag = getItemSetTag(item);
        if (setTag) {
          const groupKey = `${batch.batchId || 'batch'}_${setTag}`;
          if (!presetMap.has(groupKey)) {
            const isCctv = setTag.toLowerCase().includes('cctv');
            const setCodeSuffix = isCctv ? 'CCTV' : 'DESK';
            const storeNum =
              (item.itemNumber?.match(/ITM-S(\d+)-/i) || [])[1] ||
              (storeItems[0]?.itemNumber?.match(/ITM-S(\d+)-/i) || [])[1] ||
              '';
            const fallbackTag = storeNum
              ? `CFI-STR-${storeNum}-SET-${setCodeSuffix}`
              : `CFI-SET-${setCodeSuffix}`;
            const fallbackItemNum = storeNum
              ? `SET-S${storeNum}-${setCodeSuffix}`
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
              batchId: batch.batchId,
              formNumber: batch.formNumber,
              condition: item.currentCondition || 'Good',
              items: [],
            });
          }
          presetMap.get(groupKey).items.push(item);
        } else {
          standalone.push(item);
        }
      });

      // Sort items sequentially in natural order
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
        ...batch,
        presetGroups: Array.from(presetMap.values()),
        standaloneItems: standalone,
      };
    });
  }, [storeItems, forms]);

  const allBatchPresets = useMemo(() => {
    return itemsByBatch.flatMap((b) => b.presetGroups || []);
  }, [itemsByBatch]);

  const allExpanded =
    allBatchPresets.length > 0 &&
    allBatchPresets.every((g) => expandedSets[g.setKey]);

  const toggleAllSets = () => {
    if (allExpanded) {
      setExpandedSets({});
    } else {
      const next = {};
      allBatchPresets.forEach((g) => {
        next[g.setKey] = true;
      });
      setExpandedSets(next);
    }
  };

  // Historical returned items for this store
  const returnedItems = useMemo(() => {
    const list = [];
    storeForms.forEach((form) => {
      form.items?.forEach((item) => {
        if (item.status === 'Returned') {
          list.push({
            ...item,
            formNumber: form.formNumber,
            recordId: form._id,
            issuanceDate: form.issuance?.date,
            custodian: form.employeeInfo?.name,
          });
        }
      });
    });
    return list;
  }, [storeForms]);

  // Branch Supervisor / OIC
  const primaryOic = useMemo(() => {
    if (storeItems[0]?.currentAssignment?.employeeName) {
      return storeItems[0].currentAssignment.employeeName;
    }
    if (storeForms[0]?.employeeInfo?.name) {
      return storeForms[0].employeeInfo.name;
    }
    return null;
  }, [storeItems, storeForms]);

  const currentStoreItemCount = storeItemCounts[selectedStore] || storeItems.length;

  const handleSelectStore = (store) => {
    setSelectedStore(store);
    setIsStoreDropdownOpen(false);
    setStoreSearch('');
  };

  const handleOpenReturnModal = (item) => {
    setSelectedReturnItem(item);
    setSelectedFormId(item.currentAssignment?.accountabilityId);
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (formData) => {
    if (!selectedFormId) return;
    await api.returnItems(selectedFormId, formData);
    await fetchData();
  };

  const handleExportStoreCsv = () => {
    const exportData = storeItems.map((entry) => ({
      'Store Branch': selectedStore,
      'Asset Tag': entry.assetTag || '',
      'Item #': entry.itemNumber || '',
      'Equipment Description': entry.itemDescription || '',
      'Brand & Model': entry.brandModel || '',
      'Serial Number': entry.serialNumber || '',
      'Category': entry.category || '',
      'Current Condition': entry.currentCondition || 'Good',
      'Status': 'Assigned (Store Custody)',
      'Store In-Charge': entry.currentAssignment?.employeeName || 'Store Team',
      'Date Issued': entry.currentAssignment?.dateIssued
        ? new Date(entry.currentAssignment.dateIssued).toLocaleDateString()
        : '',
      'Remarks': entry.remarks || '',
    }));
    exportToCsv(
      `Chawnah_${selectedStore.replace(/[^a-zA-Z0-9]/g, '_')}_Equipment_${
        new Date().toISOString().split('T')[0]
      }.csv`,
      exportData
    );
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Bar: Dropdown Combobox Selector & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Dropdown Combobox Store Selector */}
        <div ref={storeDropdownRef} className="relative flex-1 sm:max-w-md">
          <button
            type="button"
            onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
            className={`w-full px-4 py-2.5 bg-white hover:bg-slate-50 border rounded-xl flex items-center justify-between text-xs transition shadow-2xs ${
              isStoreDropdownOpen
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="text-left truncate">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">
                  Select Store Branch
                </div>
                <div className="font-extrabold text-slate-900 text-sm truncate mt-0.5">
                  {selectedStore}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 ml-2">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                  currentStoreItemCount > 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {currentStoreItemCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
                <span>
                  {currentStoreItemCount} item{currentStoreItemCount !== 1 ? 's' : ''}
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isStoreDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                }`}
              />
            </div>
          </button>

          {/* Combobox Dropdown Menu */}
          {isStoreDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 w-full min-w-0 sm:min-w-[340px]">
              {/* Search & Filter Header */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/90 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search 46 branches (e.g. Savemore, Ormoc, Burgos)..."
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {storeSearch && (
                    <button
                      onClick={() => setStoreSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter segments */}
                <div className="flex items-center space-x-1 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setStoreFilter('all')}
                    className={`flex-1 py-1 rounded-md text-center transition ${
                      storeFilter === 'all'
                        ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                    }`}
                  >
                    All ({CHAWNAH_STORES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreFilter('with-items')}
                    className={`flex-1 py-1 rounded-md text-center transition flex items-center justify-center space-x-1 ${
                      storeFilter === 'with-items'
                        ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Active ({storesWithEquipment.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreFilter('empty')}
                    className={`flex-1 py-1 rounded-md text-center transition ${
                      storeFilter === 'empty'
                        ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                    }`}
                  >
                    Empty ({emptyStores.length})
                  </button>
                </div>
              </div>

              {/* Stores List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 py-1">
                {displayedStores.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                    <Store className="w-6 h-6 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No branches match</p>
                    <p className="text-[11px]">Try clearing search or changing filters</p>
                  </div>
                ) : (
                  displayedStores.map((store) => {
                    const isSelected = selectedStore === store;
                    const count = storeItemCounts[store] || 0;
                    const originalIndex = CHAWNAH_STORES.indexOf(store) + 1;

                    return (
                      <div
                        key={store}
                        onClick={() => handleSelectStore(store)}
                        className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition text-xs ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <span className="font-mono text-[10px] text-slate-400 w-5 text-center shrink-0">
                            {String(originalIndex).padStart(2, '0')}.
                          </span>
                          <span className="truncate">{store}</span>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                              isSelected
                                ? 'bg-emerald-200 text-emerald-900'
                                : count > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {count > 0 && !isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            )}
                            <span>
                              {count} item{count !== 1 ? 's' : ''}
                            </span>
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
                Showing {displayedStores.length} of {CHAWNAH_STORES.length} branches
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            to={`/forms/new?type=Store&storeName=${encodeURIComponent(selectedStore)}&package=store_default`}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition"
            title="Deploy default store package: Desktop Set + CCTV Set"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deploy Store Package</span>
          </Link>

          <button
            onClick={handleExportStoreCsv}
            disabled={storeItems.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export Store Equipment to CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <Link
            to={`/forms/new?type=Store&storeName=${encodeURIComponent(selectedStore)}`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-600/30 transition"
          >
            <FilePlus className="w-4 h-4" />
            <span>Issue Form</span>
          </Link>
        </div>
      </div>

      {/* Store Profile Hero Banner (Full Width) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-600/20 shrink-0">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center space-x-1 uppercase tracking-wider">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>Official CFI Branch</span>
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center space-x-1">
                  <Users className="w-3 h-3 text-amber-600" />
                  <span>Group Accountable</span>
                </span>
                {storeItems.length > 0 ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{storeItems.length} Deployed Units</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    No Assets Deployed
                  </span>
                )}
              </div>

              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
                {selectedStore}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Equipment assigned under store group custody. Store team & supervisor maintain collective responsibility.
              </p>

              {primaryOic && (
                <div className="mt-2.5 inline-flex items-center space-x-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    Branch In-Charge:{' '}
                    <strong className="text-slate-900">{primaryOic}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Metric Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-gradient-to-br from-emerald-50/70 via-emerald-50/20 to-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-emerald-950">Active Gear</span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{storeItems.length}</div>
            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
              {storeItems.length > 0 ? 'Operational in store' : 'No items assigned'}
            </span>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/70 via-indigo-50/20 to-white p-4 rounded-xl border border-indigo-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-indigo-950">Store Forms</span>
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{storeForms.length}</div>
            <span className="text-[10px] text-indigo-600 font-medium block mt-0.5">
              Signed records on file
            </span>
          </div>

          <div className="bg-gradient-to-br from-amber-50/70 via-amber-50/20 to-white p-4 rounded-xl border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-amber-950">Past Returns</span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{returnedItems.length}</div>
            <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
              Returned & inspected
            </span>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-slate-800">Primary In-Charge</span>
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-xs font-bold text-slate-900 mt-2 truncate">
              {primaryOic || 'Store Supervisor'}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate">
              Joint team liability
            </span>
          </div>
        </div>
      </div>

      {/* Full Width Content Area with View Tabs */}
      <div className="space-y-4">
        {/* View Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('items')}
            className={`inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'items'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Active Equipment</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'items'
                  ? 'bg-emerald-700 text-emerald-100'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {storeItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'forms'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Signed Store Forms</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'forms'
                  ? 'bg-emerald-700 text-emerald-100'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {storeForms.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'returns'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Past Returns History</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'returns'
                  ? 'bg-emerald-700 text-emerald-100'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {returnedItems.length}
            </span>
          </button>
        </div>

        {/* TAB 1: Active Equipment (Full Width) */}
        {activeTab === 'items' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Active Equipment at {selectedStore}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hardware and tools currently deployed and operational at this retail location
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {allBatchPresets.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllSets}
                    className={`font-semibold text-xs px-3 py-1 rounded-lg border transition inline-flex items-center space-x-1.5 shadow-2xs ${
                      allExpanded
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                    title="Toggle expand / collapse on all pre-set bundles"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>{allExpanded ? 'Collapse All Sets' : 'Expand All Sets'}</span>
                  </button>
                )}
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {storeItems.length} Unit{storeItems.length !== 1 ? 's' : ''} Active
                </span>
              </div>
            </div>

            {storeItems.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-3 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Store className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-700">
                    No Active Equipment Assigned to {selectedStore}
                  </p>
                  <p className="max-w-md mx-auto text-slate-500 mt-1">
                    This store branch does not currently have any assigned barcode scanners, POS printers, or terminals.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    to={`/forms/new?type=Store&storeName=${encodeURIComponent(selectedStore)}&package=store_default`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Deploy Default Store Package (Desktop Set)</span>
                  </Link>

                  <Link
                    to={`/forms/new?type=Store&storeName=${encodeURIComponent(selectedStore)}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>Custom Equipment Issuance</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {itemsByBatch.map((batch, bIdx) => (
                  <div
                    key={batch.batchId || bIdx}
                    className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs space-y-0"
                  >
                    {/* Batch Release Header with SINGLE View Form Button */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100/80 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              Release Batch:
                            </span>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                              {batch.formNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {batch.items.length} Unit{batch.items.length !== 1 ? 's' : ''} Active
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            {batch.dateIssued && (
                              <span>
                                Issued:{' '}
                                <strong className="text-slate-700 font-medium">
                                  {new Date(batch.dateIssued).toLocaleDateString()}
                                </strong>
                              </span>
                            )}
                            {batch.custodian && (
                              <span>
                                Store In-Charge:{' '}
                                <strong className="text-slate-700 font-medium">
                                  {batch.custodian}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons for this Release Batch */}
                      <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                        {batch.batchId && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFormId(batch.batchId);
                              setSelectedReturnItem(null);
                              setIsReturnModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition"
                            title="Process return by set or component for this batch"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                            <span>Return Set / Items</span>
                          </button>
                        )}
                        {batch.batchId && (
                          <Link
                            to={`/forms/${batch.batchId}`}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition hover:shadow-sm"
                            title={`View official signed accountability form ${batch.formNumber}`}
                          >
                            <FileText className="w-4 h-4" />
                            <span>View Form</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Equipment Table List */}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[780px] text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                            <th className="py-2.5 px-2.5 w-8 text-center">#</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Tag & Item #</th>
                            <th className="py-2.5 px-3">Item Name / Description</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Serial #</th>
                            <th className="py-2.5 px-2 text-center whitespace-nowrap">Condition</th>
                            <th className="py-2.5 px-3">Inclusions / Remarks</th>
                            <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {/* 1. PRE-SET GROUPS */}
                          {batch.presetGroups?.map((group) => {
                            const isExpanded = !!expandedSets[group.setKey];
                            const isCctv = group.setTag?.toLowerCase().includes('cctv');
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

                            return (
                              <React.Fragment key={group.setKey}>
                                {/* Pre-set Summary Row */}
                                <tr
                                  onClick={() => toggleSetExpanded(group.setKey)}
                                  className={`${
                                    isCctv
                                      ? 'bg-amber-50/40 hover:bg-amber-50/80 border-b border-amber-100/90'
                                      : 'bg-blue-50/40 hover:bg-blue-50/80 border-b border-blue-100/90'
                                  } cursor-pointer transition group`}
                                >
                                  <td className="py-3.5 px-3.5 text-center">
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
                                      } inline-flex items-center justify-center transition shadow-2xs`}
                                      aria-label={isExpanded ? 'Collapse components' : 'Expand components'}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </td>

                                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                                    <div className="flex items-center space-x-1.5">
                                      <span
                                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                                          isCctv ? 'bg-amber-600' : 'bg-blue-600'
                                        } text-white shadow-2xs inline-flex items-center space-x-1`}
                                      >
                                        {isCctv ? (
                                          <Video className="w-3 h-3" />
                                        ) : (
                                          <Layers className="w-3 h-3" />
                                        )}
                                        <span>{group.setTag}</span>
                                      </span>

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
                                    </div>

                                    <div className="font-mono text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-2xs mt-1 w-fit flex items-center space-x-1">
                                      <Tag className="w-3 h-3 text-slate-500" />
                                      <span>
                                        Tag:{' '}
                                        <strong className="text-slate-900">
                                          {group.setEquipmentTag}
                                        </strong>
                                      </span>
                                    </div>

                                    <div
                                      className="font-mono text-[9px] text-slate-400 mt-0.5"
                                      title={`Component Tags: ${tagRange}`}
                                    >
                                      Range: {tagRange}
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-900 leading-snug flex items-center space-x-2">
                                      <span>{group.setTag}</span>
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                          isCctv
                                            ? 'text-amber-800 bg-amber-100 border-amber-200'
                                            : 'text-blue-700 bg-blue-100 border-blue-200'
                                        }`}
                                      >
                                        {group.items.length} Components
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                      Includes: {group.items.map((i) => i.itemDescription || i.equipmentType).join(', ')}
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-3.5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700 shadow-2xs">
                                      {group.items.length} Serials
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-3 whitespace-nowrap">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      {group.condition}
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-4 text-[11px] text-slate-600">
                                    <span className="font-medium">
                                      {isCctv
                                        ? `Store CCTV Surveillance Package (${group.items.length} units deployed)`
                                        : `Full Store Hardware Package (${group.items.length} units deployed)`}
                                    </span>
                                  </td>

                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end space-x-1.5">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenSetHistory(group);
                                        }}
                                        title="View Set History & Part Audit Trail"
                                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition border border-indigo-200 shadow-2xs"
                                      >
                                        <History className="w-4 h-4 text-indigo-600" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenSetTagModal(group);
                                        }}
                                        title="Print Barcode Equipment Tag for this Set Group"
                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition border border-emerald-300 shadow-2xs"
                                      >
                                        <Barcode className="w-4 h-4 text-emerald-700" />
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
                                        } border rounded-lg transition inline-flex items-center space-x-1 shadow-2xs`}
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

                                      {group.items[0] && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenWholeModal(group.items[0]);
                                          }}
                                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg shadow-2xs transition"
                                          title="Replace whole defective set"
                                        >
                                          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                                        </button>
                                      )}

                                      {batch.batchId && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFormId(batch.batchId);
                                            setSelectedReturnItem(null);
                                            setIsReturnModalOpen(true);
                                          }}
                                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg shadow-2xs transition"
                                          title="Return this pre-set package"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Component Rows */}
                                {isExpanded &&
                                  group.items.map((item, idx) => {
                                    const isGood =
                                      item.currentCondition === 'Good' ||
                                      item.currentCondition === 'New';
                                    const isFair = item.currentCondition === 'Fair';

                                    return (
                                      <tr
                                        key={item._id}
                                        className="bg-slate-50/70 hover:bg-slate-100/90 transition group border-b border-slate-100/80"
                                      >
                                        <td className="py-3 px-3.5 text-center font-mono text-blue-500 font-bold text-[11px]">
                                          ↳ {idx + 1}
                                        </td>
                                        <td className="py-3 px-3.5 whitespace-nowrap pl-6">
                                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white text-slate-800 border border-slate-200">
                                            {item.itemNumber || item.assetTag}
                                          </span>
                                          {item.itemNumber &&
                                            item.assetTag &&
                                            item.itemNumber !== item.assetTag && (
                                              <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                                                {item.assetTag}
                                              </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                          <div className="font-bold text-slate-900 leading-snug">
                                            {item.itemDescription}
                                          </div>
                                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                                            <span>
                                              Brand:{' '}
                                              <strong className="text-slate-700 font-medium">
                                                {item.brandModel}
                                              </strong>
                                            </span>
                                            {item.category && (
                                              <>
                                                <span className="text-slate-300">&bull;</span>
                                                <span className="text-slate-400">
                                                  {item.category}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-3 px-3.5 font-mono text-slate-800 font-medium whitespace-nowrap">
                                          {item.serialNumber || '—'}
                                        </td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                          <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                              isGood
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : isFair
                                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                                            }`}
                                          >
                                            {item.currentCondition || 'Good'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-[11px] text-slate-500">
                                          <span
                                            className="line-clamp-2"
                                            title={item.remarks}
                                          >
                                            {item.remarks && item.remarks !== 'N/A'
                                              ? item.remarks
                                              : `${group.setTag} Component`}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-right whitespace-nowrap">
                                          <div className="flex items-center justify-end space-x-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenItemTagModal(item)}
                                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition"
                                              title="Print Equipment Tag Barcode"
                                            >
                                              <Barcode className="w-3.5 h-3.5 text-slate-600" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleOpenPartModal(item)}
                                              className="p-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg shadow-2xs transition"
                                              title="Replace Part / Battery on this unit"
                                            >
                                              <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleOpenWholeModal(item)}
                                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg shadow-2xs transition"
                                              title="Replace whole defective unit"
                                            >
                                              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleOpenSetHistory(group, item)}
                                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg shadow-2xs transition"
                                              title="View Component Part History & Specifications"
                                            >
                                              <History className="w-3.5 h-3.5 text-indigo-600" />
                                            </button>

                                            <Link
                                              to={`/items/${item._id}`}
                                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg shadow-2xs transition inline-flex items-center justify-center"
                                              title="View Item Details"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </Link>

                                            <button
                                              type="button"
                                              onClick={() => handleOpenReturnModal(item)}
                                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg shadow-2xs transition"
                                              title="Return Item to Warehouse"
                                            >
                                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
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
                          {batch.standaloneItems?.map((item, idx) => {
                            const isGood =
                              item.currentCondition === 'Good' ||
                              item.currentCondition === 'New';
                            const isFair = item.currentCondition === 'Fair';

                            return (
                              <tr
                                key={item._id}
                                className="hover:bg-slate-50/80 transition group"
                              >
                                <td className="py-3 px-3.5 text-center font-mono text-slate-400 font-bold text-[11px]">
                                  {(batch.presetGroups?.length || 0) + idx + 1}
                                </td>
                                <td className="py-3 px-3.5 whitespace-nowrap">
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                    {item.itemNumber || item.assetTag}
                                  </span>
                                  {item.itemNumber &&
                                    item.assetTag &&
                                    item.itemNumber !== item.assetTag && (
                                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                                        {item.assetTag}
                                      </div>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900 leading-snug">
                                    {item.itemDescription}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                                    <span>
                                      Brand:{' '}
                                      <strong className="text-slate-700 font-medium">
                                        {item.brandModel}
                                      </strong>
                                    </span>
                                    {item.category && (
                                      <>
                                        <span className="text-slate-300">&bull;</span>
                                        <span className="text-slate-400">
                                          {item.category}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3.5 font-mono text-slate-800 font-medium whitespace-nowrap">
                                  {item.serialNumber || '—'}
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      isGood
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : isFair
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                                    }`}
                                  >
                                    {item.currentCondition || 'Good'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[11px] text-slate-500">
                                  <span
                                    className="line-clamp-2"
                                    title={item.remarks}
                                  >
                                    {item.remarks || '—'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenItemTagModal(item)}
                                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition"
                                      title="Print Equipment Tag Barcode"
                                    >
                                      <Barcode className="w-3.5 h-3.5 text-slate-600" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenPartModal(item)}
                                      className="p-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg shadow-2xs transition"
                                      title="Replace Part / Battery on this unit"
                                    >
                                      <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenWholeModal(item)}
                                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg shadow-2xs transition"
                                      title="Replace whole defective unit"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                                    </button>

                                    <Link
                                      to={`/items/${item._id}`}
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg shadow-2xs transition inline-flex items-center justify-center"
                                      title="View Item Details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </Link>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenReturnModal(item)}
                                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg shadow-2xs transition"
                                      title="Return Item to Warehouse"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Signed Store Forms (Full Width) */}
        {activeTab === 'forms' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Accountability Forms for {selectedStore}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official signed accountability forms authorizing store group custody
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                {storeForms.length} Form{storeForms.length !== 1 ? 's' : ''}
              </span>
            </div>

            {storeForms.length === 0 ? (
              <div className="py-14 text-center text-xs text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No forms on record for this store</p>
                <p>Issue an equipment accountability form to establish official custody.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {storeForms.map((form) => (
                  <div
                    key={form._id}
                    className="p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shadow-2xs"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-indigo-900">
                            {form.formNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {form.status || 'Active'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Custodian In-Charge:{' '}
                          <strong>{form.employeeInfo?.name || 'Store Supervisor'}</strong>{' '}
                          &bull; Released on{' '}
                          {new Date(form.issuance?.date || form.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {form.items?.length || 0} equipment item
                          {form.items?.length !== 1 ? 's' : ''} assigned
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <Link
                        to={`/forms/${form._id}`}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                      >
                        View & Print Form
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Past Returns History (Full Width) */}
        {activeTab === 'returns' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Returned Equipment Archive from {selectedStore}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Equipment previously returned, repaired, or upgraded from this store branch
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                {returnedItems.length} Returned
              </span>
            </div>

            {returnedItems.length === 0 ? (
              <div className="py-14 text-center text-xs text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No return records on file</p>
                <p>All items issued to this store are currently active or no items have been returned.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {returnedItems.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 text-xs">
                          {item.itemDescription}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          ({item.serialNumber})
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1">
                        Returned on{' '}
                        {item.returnDetails?.returnDate
                          ? new Date(item.returnDetails.returnDate).toLocaleDateString()
                          : 'Recorded'}{' '}
                        &bull; Condition:{' '}
                        <strong className="text-slate-700">
                          {item.returnDetails?.conditionUponReturn || 'Good'}
                        </strong>{' '}
                        &bull; Completeness:{' '}
                        <strong>{item.returnDetails?.completeness || 'Complete'}</strong>
                      </p>
                      {item.returnDetails?.notes && (
                        <p className="text-slate-600 text-[11px] italic mt-1">
                          "{item.returnDetails.notes}"
                        </p>
                      )}
                    </div>

                    <Link
                      to={`/forms/${item.recordId}`}
                      className="font-mono text-xs text-indigo-700 font-semibold hover:underline px-2.5 py-1 bg-slate-50 rounded border border-slate-200"
                    >
                      {item.formNumber}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Return Modal */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSubmit={handleReturnSubmit}
        formId={selectedFormId}
        item={selectedReturnItem}
        isBulk={false}
      />

      {/* Part Replacement Modal */}
      <ReplacePartModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        targetItem={selectedPartItem}
        onSuccess={fetchData}
      />

      {/* Whole Unit Replacement Modal */}
      <ReplaceWholeModal
        isOpen={isWholeModalOpen}
        onClose={() => setIsWholeModalOpen(false)}
        targetItem={selectedWholeItem}
        onSuccess={fetchData}
      />

      {/* Printable Barcode Asset Tag Modal (Sets & Items) */}
      <AssetTagModal
        isOpen={tagModalData.isOpen}
        onClose={() => setTagModalData({ isOpen: false, item: null, group: null })}
        item={tagModalData.item}
        group={tagModalData.group}
      />
    </div>
  );
}
