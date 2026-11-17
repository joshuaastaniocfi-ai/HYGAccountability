import React, { useState, useEffect } from 'react';
import {
  X,
  Boxes,
  Plus,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Barcode,
  Layers,
  FileText,
  Building2,
  ChevronRight,
  Hash,
  Tag,
  UserCheck,
  ShieldCheck,
  Check,
  PackageCheck,
} from 'lucide-react';
import { api } from '../services/api';

const BRAND_OPTIONS = [
  { brand: 'Goldilocks', legalOwner: 'Chawnah Foods Inc.', defaultTagPrefix: 'CFI-AST-' },
  { brand: 'DU99', legalOwner: 'DU99 Commercial Corp.', defaultTagPrefix: 'DU-AST-' },
  { brand: 'Taters', legalOwner: 'Pop and Chips Specialist Inc.', defaultTagPrefix: 'TAT-AST-' },
  { brand: 'Icebergs', legalOwner: 'Cool Ice Food Desserts', defaultTagPrefix: 'ICE-AST-' },
  { brand: 'Savore', legalOwner: 'Savore Kitchen Corp', defaultTagPrefix: 'SAV-AST-' },
  { brand: 'Chatime', legalOwner: 'Salu-salong Saya Food Inc.', defaultTagPrefix: 'CHA-AST-' },
];

export default function BatchIntakeModal({
  isOpen,
  onClose,
  onBatchCreated,
  onSuccess,
  initialEquipmentType = '',
  initialBrand = 'Goldilocks',
}) {
  const brandMatch = BRAND_OPTIONS.find((b) => b.brand === initialBrand) || BRAND_OPTIONS[0];

  const [formData, setFormData] = useState({
    itemDescription: '',
    brandModel: '',
    brand: initialBrand || 'Goldilocks',
    legalOwner: brandMatch.legalOwner,
    category: 'Office Equipment',
    equipmentType: initialEquipmentType || '',
    currentCondition: 'New',
    quantity: '',
    tagPrefix: brandMatch.defaultTagPrefix || 'CFI-AST-',
    startTagNumber: '',
    serialMode: 'sequential', // 'sequential' | 'manual'
    serialPrefix: '',
    manualSerials: '',
    receivedBy: '',
  });

  const [batchInfo, setBatchInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdResult, setCreatedResult] = useState(null);

  const categories = [
    'Office Equipment',
    'Laptops & Desktops',
    'Mobile & Tablets',
    'Warehouse & Barcode Scanners',
    'Laboratory & QA Equipment',
    'Production & Machinery',
    'Printers & Peripherals',
    'Other',
  ];

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
      setCreatedResult(null);

      const currentBrandMatch =
        BRAND_OPTIONS.find((b) => b.brand === initialBrand) || BRAND_OPTIONS[0];

      let cat = 'Office Equipment';
      if (initialEquipmentType) {
        const t = initialEquipmentType.toLowerCase();
        if (
          t.includes('mouse') ||
          t.includes('keyboard') ||
          t.includes('monitor') ||
          t.includes('printer')
        ) {
          cat = 'Printers & Peripherals';
        } else if (
          t.includes('desktop') ||
          t.includes('laptop') ||
          t.includes('system unit')
        ) {
          cat = 'Laptops & Desktops';
        } else if (t.includes('scanner') || t.includes('barcode')) {
          cat = 'Warehouse & Barcode Scanners';
        }
      }

      setFormData({
        itemDescription: initialEquipmentType || '',
        brandModel: '',
        brand: initialBrand || 'Goldilocks',
        legalOwner: currentBrandMatch.legalOwner,
        category: cat,
        equipmentType: initialEquipmentType || '',
        currentCondition: 'New',
        quantity: '',
        tagPrefix: currentBrandMatch.defaultTagPrefix || 'CFI-AST-',
        startTagNumber: '',
        serialMode: 'sequential',
        serialPrefix: '',
        manualSerials: '',
        receivedBy: '',
      });

      // Fetch next batch and item number preview
      api
        .getNextBatchInfo()
        .then((info) => setBatchInfo(info))
        .catch((err) => console.error('Error fetching batch preview info:', err));
    }
  }, [isOpen, initialEquipmentType, initialBrand]);

  if (!isOpen) return null;

  const rawQty = parseInt(formData.quantity, 10);
  const qty = !isNaN(rawQty) && rawQty > 0 ? rawQty : 0;

  // Compute live preview of item numbers
  const startingItemNum = batchInfo?.nextItemNumber || 'ITM-0016';
  const startMatch = startingItemNum.match(/\d+/);
  const startSeq = startMatch ? parseInt(startMatch[0], 10) : 16;
  const endSeq = startSeq + (qty > 0 ? qty - 1 : 0);
  const itemNumbersPreview =
    qty > 0
      ? `ITM-${String(startSeq).padStart(4, '0')} → ITM-${String(endSeq).padStart(4, '0')}`
      : `ITM-${String(startSeq).padStart(4, '0')}`;

  // Compute live preview of asset tags
  const cleanPrefix = (formData.tagPrefix || 'CFI-AST-').trim().toUpperCase();
  const startTag = parseInt(formData.startTagNumber, 10) || 1;
  const endTag = startTag + (qty > 0 ? qty - 1 : 0);
  const assetTagsPreview =
    qty > 0
      ? `${cleanPrefix}${String(startTag).padStart(3, '0')} → ${cleanPrefix}${String(endTag).padStart(3, '0')}`
      : `${cleanPrefix}${String(startTag).padStart(3, '0')}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (qty <= 0) {
        throw new Error('Please enter a valid intake quantity (at least 1 unit).');
      }

      if (!formData.itemDescription.trim()) {
        throw new Error('Please enter an item name / description.');
      }

      if (!formData.brandModel.trim()) {
        throw new Error('Please enter Brand & Model.');
      }

      let serialNumbers = undefined;
      if (formData.serialMode === 'manual' && formData.manualSerials.trim()) {
        const lines = formData.manualSerials
          .split(/[\r\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (lines.length !== qty) {
          throw new Error(
            `You entered ${lines.length} serial numbers, but quantity is ${qty}. Please provide exactly ${qty} serials or choose sequential generation.`
          );
        }
        serialNumbers = lines;
      }

      const payload = {
        itemDescription: formData.itemDescription.trim(),
        brandModel: formData.brandModel.trim(),
        brand: formData.brand,
        legalOwner: formData.legalOwner,
        category: formData.category,
        equipmentType: formData.equipmentType || undefined,
        currentCondition: formData.currentCondition,
        quantity: qty,
        tagPrefix: formData.tagPrefix.trim().toUpperCase(),
        startTagNumber: formData.startTagNumber ? parseInt(formData.startTagNumber, 10) : undefined,
        serialPrefix:
          formData.serialMode === 'sequential'
            ? formData.serialPrefix.trim() || undefined
            : undefined,
        serialNumbers,
        receivedBy: formData.receivedBy.trim() || 'IT Custodian',
        receivedDate: new Date().toISOString().split('T')[0],
      };

      const result = await api.createBatchItems(payload);
      setCreatedResult(result);
      if (onBatchCreated) {
        onBatchCreated(result);
      }
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to create batch intake');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top Decorative Brand Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-amber-500 shrink-0" />

        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Batch Inventory Intake
                </h3>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                  {batchInfo?.nextBatchNumber || 'BATCH-2026-0001'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Receive bulk equipment into stock with automatic sequential tags & serials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2.5 shrink-0 shadow-2xs">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {createdResult ? (
            /* Success confirmation card */
            <div className="py-8 space-y-5 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Batch Successfully Received!
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Successfully registered{' '}
                  <strong className="text-emerald-700 font-bold">
                    {createdResult.batch?.quantity || qty} units
                  </strong>{' '}
                  into inventory under batch reference{' '}
                  <span className="font-mono font-bold text-slate-800">
                    {createdResult.batch?.batchNumber}
                  </span>
                </p>
              </div>

              <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2.5 max-w-md mx-auto shadow-2xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Brand / Pool:</span>
                  <strong className="text-slate-900 font-bold">{createdResult.batch?.brand}</strong>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Legal Owner:</span>
                  <strong className="text-slate-900 font-bold">{createdResult.batch?.legalOwner}</strong>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Equipment Name:</span>
                  <strong className="text-slate-900 font-bold">
                    {createdResult.batch?.itemDescription}
                  </strong>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Custodian / Receiver:</span>
                  <strong className="text-slate-900 font-bold">
                    {createdResult.batch?.receivedBy || 'IT Custodian'}
                  </strong>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Item Numbers:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {createdResult.itemsSummary?.firstItemNumber} → {createdResult.itemsSummary?.lastItemNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Asset Tag Range:</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {createdResult.itemsSummary?.firstAssetTag} → {createdResult.itemsSummary?.lastAssetTag}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  Done & View Inventory
                </button>
              </div>
            </div>
          ) : (
            <form id="batchForm" onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Row 0: Retail Brand & Inventory Pool */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Retail Brand & Inventory Pool *</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Partitioned by company store chain
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {BRAND_OPTIONS.map((opt) => {
                    const isSel = formData.brand === opt.brand;
                    return (
                      <button
                        key={opt.brand}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            brand: opt.brand,
                            legalOwner: opt.legalOwner,
                            tagPrefix: opt.defaultTagPrefix,
                          });
                        }}
                        className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1 border ${
                          isSel
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/10'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSel && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                        <span className="whitespace-nowrap">{opt.brand}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Auto-resolved legal property owner */}
                <div className="text-[11px] text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Legal Property Owner:{' '}
                      <strong className="font-bold text-slate-900">{formData.legalOwner}</strong>
                    </span>
                  </div>
                  {formData.brand === 'Goldilocks' && (
                    <span className="text-[10px] text-slate-400 italic hidden sm:inline">
                      (Franchisee gear under Chawnah Foods Inc.)
                    </span>
                  )}
                </div>
              </div>

              {/* Row 1: Intake Quantity & Sequential Numbers */}
              <div className="bg-gradient-to-br from-blue-50/40 via-sky-50/20 to-slate-50 p-4 rounded-2xl border border-blue-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Boxes className="w-3.5 h-3.5 text-blue-600" />
                    <span>Intake Quantity (Units to Register) *</span>
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Quick Pick:</span>
                    {[5, 10, 20, 50].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setFormData({ ...formData, quantity: preset })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                          qty === preset
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3.5">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    placeholder="e.g. 10"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-28 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none shadow-2xs text-center"
                  />
                  <div className="text-xs text-slate-600 leading-snug">
                    {qty > 0 ? (
                      <>
                        Will register <strong className="text-blue-700 font-bold">{qty}</strong> sequential records:
                        <span className="ml-1 font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block shadow-2xs">
                          {itemNumbersPreview}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400">
                        Type intake quantity or select a quick-pick preset (+5, +10, +20, +50).
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 1: Equipment Specifications */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Equipment Specifications
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Item Name / Description *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UPS Battery, Dell Optical Mouse, Monitor, APC UPS"
                      value={formData.itemDescription}
                      onChange={handleDescriptionChange}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition shadow-2xs font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Equipment Group / Type *
                    </label>
                    <select
                      value={formData.equipmentType}
                      onChange={(e) =>
                        setFormData({ ...formData, equipmentType: e.target.value })
                      }
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white font-semibold text-slate-800 shadow-2xs"
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Brand & Model *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dongjin, Dell MS116, HP, APC"
                      value={formData.brandModel}
                      onChange={(e) =>
                        setFormData({ ...formData, brandModel: e.target.value })
                      }
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white font-medium shadow-2xs"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Initial Condition *
                    </label>
                    <select
                      value={formData.currentCondition}
                      onChange={(e) =>
                        setFormData({ ...formData, currentCondition: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white font-semibold text-slate-800 shadow-2xs"
                    >
                      <option value="New">New (Factory Sealed)</option>
                      <option value="Good">Good (Tested Working)</option>
                      <option value="Fair">Fair (Spare / Buffer)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Asset Tags & Serials */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Asset Tags & Serial Numbers
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Asset Tag Prefix *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CFI-AST-, DU-AST-"
                      value={formData.tagPrefix}
                      onChange={(e) =>
                        setFormData({ ...formData, tagPrefix: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none uppercase font-mono shadow-2xs font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Preview: <span className="font-mono text-slate-600">{assetTagsPreview}</span>
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Serial Number Generation
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, serialMode: 'sequential' })}
                        className={`py-2 px-2.5 text-center rounded-xl border font-bold transition text-xs flex items-center justify-center space-x-1.5 ${
                          formData.serialMode === 'sequential'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Hash className="w-3.5 h-3.5" />
                        <span>Auto Sequential</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, serialMode: 'manual' })}
                        className={`py-2 px-2.5 text-center rounded-xl border font-bold transition text-xs flex items-center justify-center space-x-1.5 ${
                          formData.serialMode === 'manual'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Barcode className="w-3.5 h-3.5" />
                        <span>Scan / Paste</span>
                      </button>
                    </div>
                  </div>
                </div>

                {formData.serialMode === 'sequential' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Serial Number Prefix (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SN- or leave blank for automatic format"
                      value={formData.serialPrefix}
                      onChange={(e) => setFormData({ ...formData, serialPrefix: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-mono shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {qty > 0 ? (
                        <>
                          Sequence: <span className="font-mono text-slate-600">{formData.serialPrefix || 'SN-'}0001 → {formData.serialPrefix || 'SN-'}{String(qty).padStart(4, '0')}</span>
                        </>
                      ) : (
                        'Enter quantity to preview serial sequence'
                      )}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">
                        Scan or Paste Serials
                      </label>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {qty > 0 ? `${qty} line${qty > 1 ? 's' : ''} needed` : 'Specify quantity first'}
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      placeholder={
                        qty > 0
                          ? `Paste or scan ${qty} serial numbers, one per line...`
                          : 'Enter intake quantity first to paste exact serial numbers...'
                      }
                      value={formData.manualSerials}
                      onChange={(e) => setFormData({ ...formData, manualSerials: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-mono text-[11px] shadow-2xs"
                    />
                  </div>
                )}
              </div>

              {/* Section 3: Custodian / Receiver (Kept clean & beautiful) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                    3
                  </span>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Intake Custodian
                  </h4>
                </div>

                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <label className="block font-semibold text-slate-700">
                    Received By / IT Custodian
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. IT Custodian Name (or N/A)"
                      value={formData.receivedBy}
                      onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition shadow-2xs font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <span>All units in this batch will be held in storage under this custodian until formally issued.</span>
                  </p>
                </div>
              </div>

              {/* Live Intake Summary Card */}
              <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">
                    Intake Summary
                  </span>
                  <div className="text-slate-900 font-extrabold text-xs">
                    {qty > 0 ? `${qty}x ` : ''}
                    {formData.brandModel ? `${formData.brandModel} ` : ''}
                    {formData.itemDescription || 'New Equipment Batch'}
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold">
                      {itemNumbersPreview}
                    </span>
                    <span>•</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold">
                      {assetTagsPreview}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-medium block">Holding Custodian</span>
                  <span className="font-bold text-slate-800 text-xs inline-flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formData.receivedBy.trim() || 'IT Custodian (In Storage)'}</span>
                  </span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        {!createdResult && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">
              Chawnah Foods Inc. • Bulk Intake
            </span>
            <div className="flex items-center space-x-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="batchForm"
                disabled={
                  loading ||
                  qty <= 0 ||
                  !formData.itemDescription.trim() ||
                  !formData.brandModel.trim()
                }
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/25 transition disabled:opacity-50 disabled:shadow-none flex items-center space-x-2 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registering {qty} Items...</span>
                  </>
                ) : (
                  <>
                    <Boxes className="w-4 h-4" />
                    <span>
                      {qty > 0
                        ? `Receive ${qty} Unit${qty > 1 ? 's' : ''} into Inventory`
                        : 'Receive Units into Inventory'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
