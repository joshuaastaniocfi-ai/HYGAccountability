import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  BatteryCharging,
  HardDrive,
  Monitor,
  Zap,
  RotateCcw,
  Sparkles,
  Plus,
  Trash,
  Check,
  ShieldAlert,
  ArrowRight,
  Layers,
  Box,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Returns standard physical components tailored to the specific equipment type
function getComponentPresetsForEquipment(equipmentType, category, itemDesc = '') {
  const type = (equipmentType || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  const desc = (itemDesc || '').toLowerCase();

  if (type.includes('ups') || desc.includes('ups')) {
    return [
      { type: 'UPS Battery', icon: BatteryCharging, desc: 'Lead-Acid / Li-Ion internal battery' },
      { type: 'AC Power Input Cord', icon: Zap, desc: 'Heavy-duty power cable' },
      { type: 'Circuit Breaker / Fuse', icon: ShieldAlert, desc: 'Overload surge fuse' },
      { type: 'Other', icon: Wrench, desc: 'Custom part or peripheral' },
    ];
  }

  if (type.includes('laptop') || cat.includes('laptop') || desc.includes('laptop')) {
    return [
      { type: 'Laptop Battery', icon: BatteryCharging, desc: 'Internal / modular battery pack' },
      { type: 'RAM / Memory', icon: Cpu, desc: 'DDR4/DDR5 SO-DIMM RAM stick' },
      { type: 'SSD / Storage', icon: HardDrive, desc: 'NVMe M.2 or SATA SSD drive' },
      { type: 'Power Supply / Adapter', icon: Zap, desc: 'USB-C or barrel AC charger' },
      { type: 'Display / Screen', icon: Monitor, desc: 'LCD/OLED display screen panel' },
      { type: 'Keyboard & Trackpad', icon: Wrench, desc: 'Top cover, chiclet keyboard, touchpad' },
      { type: 'Other', icon: Wrench, desc: 'Fans, hinges, Wi-Fi card, or ports' },
    ];
  }

  if (type.includes('desktop') || cat.includes('desktop')) {
    return [
      { type: 'RAM / Memory', icon: Cpu, desc: 'DDR4/DDR5 DIMM memory modules' },
      { type: 'SSD / Storage', icon: HardDrive, desc: 'NVMe M.2 / SATA SSD or HDD' },
      { type: 'Power Supply (PSU)', icon: Zap, desc: 'ATX modular or standard PSU' },
      { type: 'CPU Cooling Fan', icon: Wrench, desc: 'Heatsink & cooling fan' },
      { type: 'Motherboard', icon: Cpu, desc: 'System mainboard' },
      { type: 'Graphics Card (GPU)', icon: Monitor, desc: 'Dedicated video card' },
      { type: 'Other', icon: Wrench, desc: 'Cables, cases, PCIe expansion' },
    ];
  }

  if (type.includes('scanner') || desc.includes('scanner')) {
    return [
      { type: 'Rechargeable Battery Pack', icon: BatteryCharging, desc: 'Wireless scanner battery' },
      { type: 'Scanner Optical Engine', icon: Monitor, desc: '2D Imager or laser optics' },
      { type: 'USB Cradle / Interface Cable', icon: Zap, desc: 'Charging base & host cable' },
      { type: 'Other', icon: Wrench, desc: 'Trigger switch, casing, holster' },
    ];
  }

  if (type.includes('tablet') || desc.includes('tablet') || desc.includes('ipad')) {
    return [
      { type: 'Tablet Battery', icon: BatteryCharging, desc: 'Internal Li-Po battery' },
      { type: 'Touchscreen / LCD Panel', icon: Monitor, desc: 'Digitizer glass & LCD' },
      { type: 'Charging Cable & Adapter', icon: Zap, desc: 'Type-C / Lightning cable & brick' },
      { type: 'Protective Case / Mount', icon: Wrench, desc: 'Impact case or hand strap' },
      { type: 'Other', icon: Wrench, desc: 'Stylus pen, camera, dock' },
    ];
  }

  if (type.includes('printer') || desc.includes('printer') || desc.includes('pos')) {
    return [
      { type: 'Thermal Printhead', icon: Monitor, desc: 'Receipt / barcode printhead' },
      { type: 'Power Supply Adapter', icon: Zap, desc: '24V power adapter' },
      { type: 'Platen / Feed Roller', icon: Wrench, desc: 'Rubber drive roller & cutter' },
      { type: 'Interface Cable (USB/Serial)', icon: Zap, desc: 'Communication cable' },
      { type: 'Other', icon: Wrench, desc: 'Sensors, gear assembly, casing' },
    ];
  }

  return [
    { type: 'Power Supply / Adapter', icon: Zap, desc: 'AC/DC adapter or power cord' },
    { type: 'Rechargeable Battery', icon: BatteryCharging, desc: 'Battery pack or cell' },
    { type: 'Interface Cable / Peripheral', icon: Wrench, desc: 'Connecting cables or dongle' },
    { type: 'Sensor / Probe', icon: Monitor, desc: 'Measurement sensor or reader' },
    { type: 'Other', icon: Wrench, desc: 'Custom component or attachment' },
  ];
}

const commonDefectReasons = [
  'Worn out / battery does not hold charge',
  'Hardware failure / will not power on',
  'Bad sectors / data storage corruption',
  'Physical crack / broken hinges / impact damage',
  'Intermittent disconnect / faulty connection',
  'Liquid spill / corrosion on component',
  'Upgrading component capacity / speed',
];

export default function ReplacePartModal({
  isOpen,
  onClose,
  targetItem,
  initialComponent,
  onSuccess,
}) {
  const { user } = useAuth();

  const [availableItems, setAvailableItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [workNotes, setWorkNotes] = useState('');

  // List of components scheduled for replacement
  const [replacements, setReplacements] = useState([]);

  // Fetch in-stock available items when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableInventory();
    }
  }, [isOpen]);

  const fetchAvailableInventory = async () => {
    setLoadingInventory(true);
    try {
      const items = await api.getItems({ status: 'Available' });
      // Filter out target item itself
      const cleanItems = items.filter((i) => i._id !== targetItem?._id);
      setAvailableItems(cleanItems);
    } catch (err) {
      console.error('Error fetching inventory for replacement:', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Initialize replacements when target item opens
  useEffect(() => {
    if (isOpen && targetItem) {
      setError(null);
      setWorkNotes('');

      if (initialComponent) {
        setReplacements([
          {
            id: `rep-${Date.now()}`,
            componentType: initialComponent.componentType || 'Other',
            customType:
              initialComponent.componentType === 'Other'
                ? initialComponent.itemDescription || ''
                : '',
            oldDescription: initialComponent.itemDescription || '',
            oldSerialNumber: initialComponent.serialNumber || '',
            oldDisposition: 'For Disposal',
            oldReason: 'Defective / worn out component',
            existingItemId: initialComponent.itemId || null,
            sourceType: 'inventory',
            selectedInventoryItemId: '',
            customDescription: '',
            customSerialNumber: '',
            notes: '',
          },
        ]);
        return;
      }

      // Auto-detect initial default component
      const isUps =
        targetItem.equipmentType === 'UPS' ||
        targetItem.itemDescription?.toLowerCase().includes('ups');

      const isLaptop =
        targetItem.equipmentType === 'Laptop' ||
        targetItem.category === 'Laptops & Desktops';

      let initialType = 'Other';
      let initialDesc = '';

      if (isUps) {
        initialType = 'UPS Battery';
        initialDesc = 'Factory 12V 7.2Ah Lead-Acid Battery';
      } else if (isLaptop) {
        initialType = 'RAM / Memory';
        initialDesc = 'Factory 8GB DDR4 RAM Module';
      }

      // Check if target item already has an installed component of that type
      const existing = targetItem.installedComponents?.[0];
      if (existing) {
        initialType = existing.componentType || initialType;
        initialDesc = existing.itemDescription || initialDesc;
      }

      setReplacements([
        {
          id: `rep-${Date.now()}`,
          componentType: initialType,
          customType: '',
          oldDescription: initialDesc,
          oldSerialNumber: existing?.serialNumber || '',
          oldDisposition: 'For Disposal',
          oldReason: 'Worn out / battery does not hold charge',
          existingItemId: existing?.itemId || null,
          sourceType: 'inventory',
          selectedInventoryItemId: '',
          customDescription: '',
          customSerialNumber: '',
          notes: '',
        },
      ]);
    }
  }, [isOpen, targetItem]);

  if (!isOpen || !targetItem) return null;

  const presets = getComponentPresetsForEquipment(
    targetItem.equipmentType,
    targetItem.category,
    targetItem.itemDescription
  );

  const installedOnDevice = targetItem.installedComponents || [];

  // Toggle or add a component preset into the replacement list
  const handleTogglePreset = (presetType) => {
    // Check if this component type is already in replacements
    const existingIndex = replacements.findIndex((r) => r.componentType === presetType);

    if (existingIndex !== -1 && replacements.length > 1) {
      // Remove it if multiple exist
      setReplacements(replacements.filter((_, idx) => idx !== existingIndex));
    } else if (existingIndex !== -1) {
      // If it's the only one, don't remove, just keep it active
      return;
    } else {
      // Add new replacement item for this preset
      const isCustom = presetType === 'Other';
      let oldDesc = '';
      let oldSn = '';
      let existingItemId = null;

      // Check if actual installed component on device matches
      const matchedInstalled = installedOnDevice.find(
        (c) => c.componentType?.toLowerCase() === presetType.toLowerCase()
      );
      if (matchedInstalled) {
        oldDesc = matchedInstalled.itemDescription || '';
        oldSn = matchedInstalled.serialNumber || '';
        existingItemId = matchedInstalled.itemId || null;
      } else if (presetType.includes('Battery')) {
        oldDesc = 'Internal Battery Pack';
      } else if (presetType.includes('RAM')) {
        oldDesc = 'RAM Memory Module';
      } else if (presetType.includes('SSD')) {
        oldDesc = 'Storage SSD Drive';
      } else if (presetType.includes('Power')) {
        oldDesc = 'AC Power Adapter';
      }

      setReplacements([
        ...replacements,
        {
          id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          componentType: presetType,
          customType: isCustom ? '' : '',
          oldDescription: oldDesc,
          oldSerialNumber: oldSn,
          oldDisposition: 'For Disposal',
          oldReason: 'Worn out / defective component',
          existingItemId,
          sourceType: 'inventory',
          selectedInventoryItemId: '',
          customDescription: '',
          customSerialNumber: '',
          notes: '',
        },
      ]);
    }
  };

  // Add an actual installed component from the item
  const handleSelectInstalledComponent = (installedComp) => {
    // Check if already in replacements
    const alreadyAdded = replacements.find(
      (r) =>
        r.existingItemId === installedComp.itemId ||
        (r.componentType === installedComp.componentType &&
          r.oldSerialNumber === installedComp.serialNumber)
    );

    if (alreadyAdded) return;

    setReplacements([
      ...replacements,
      {
        id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        componentType: installedComp.componentType || 'Component',
        customType: '',
        oldDescription: installedComp.itemDescription || '',
        oldSerialNumber: installedComp.serialNumber || '',
        oldDisposition: 'For Disposal',
        oldReason: 'Defective / worn out component',
        existingItemId: installedComp.itemId || null,
        sourceType: 'inventory',
        selectedInventoryItemId: '',
        customDescription: '',
        customSerialNumber: '',
        notes: '',
      },
    ]);
  };

  // Add a blank replacement card
  const handleAddBlankReplacement = () => {
    setReplacements([
      ...replacements,
      {
        id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        componentType: 'Other',
        customType: '',
        oldDescription: '',
        oldSerialNumber: '',
        oldDisposition: 'For Disposal',
        oldReason: '',
        existingItemId: null,
        sourceType: 'inventory',
        selectedInventoryItemId: '',
        customDescription: '',
        customSerialNumber: '',
        notes: '',
      },
    ]);
  };

  // Remove replacement card
  const handleRemoveReplacement = (id) => {
    if (replacements.length === 1) return;
    setReplacements(replacements.filter((r) => r.id !== id));
  };

  // Update specific field in a replacement
  const updateReplacement = (id, field, value) => {
    setReplacements(
      replacements.map((r) => {
        if (r.id !== id) return r;
        return { ...r, [field]: value };
      })
    );
  };

  // Filter inventory items compatible with a component type
  const getCompatibleInventory = (componentType) => {
    const t = (componentType || '').toLowerCase();
    if (t.includes('battery')) {
      const b = availableItems.filter(
        (i) =>
          i.equipmentType === 'UPS Battery' ||
          i.itemDescription?.toLowerCase().includes('battery')
      );
      return b.length > 0 ? b : availableItems;
    }
    if (t.includes('ram') || t.includes('memory')) {
      const r = availableItems.filter((i) => i.itemDescription?.toLowerCase().includes('ram'));
      return r.length > 0 ? r : availableItems;
    }
    if (t.includes('ssd') || t.includes('storage')) {
      const s = availableItems.filter(
        (i) =>
          i.itemDescription?.toLowerCase().includes('ssd') ||
          i.itemDescription?.toLowerCase().includes('drive')
      );
      return s.length > 0 ? s : availableItems;
    }
    if (t.includes('power') || t.includes('adapter') || t.includes('charger')) {
      const p = availableItems.filter(
        (i) =>
          i.itemDescription?.toLowerCase().includes('power') ||
          i.itemDescription?.toLowerCase().includes('adapter') ||
          i.itemDescription?.toLowerCase().includes('charger')
      );
      return p.length > 0 ? p : availableItems;
    }
    return availableItems;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate replacements
    for (let i = 0; i < replacements.length; i++) {
      const rep = replacements[i];
      const finalType =
        rep.componentType === 'Other'
          ? rep.customType?.trim() || 'Custom Component'
          : rep.componentType;

      if (!finalType) {
        setError(`Please specify the component name for item #${i + 1}.`);
        return;
      }

      if (!rep.oldDisposition) {
        setError(`Please select disposition (For Repair or For Disposal) for ${finalType}.`);
        return;
      }

      if (rep.sourceType === 'custom' && !rep.customDescription?.trim()) {
        setError(`Please provide description for new replacement part for ${finalType}.`);
        return;
      }

      if (rep.sourceType === 'inventory' && !rep.selectedInventoryItemId) {
        const matching = getCompatibleInventory(finalType);
        if (matching.length === 0) {
          setError(
            `No available inventory for ${finalType}. Switch to "Manual / New Purchased Part" to specify details.`
          );
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const payloadReplacements = replacements.map((rep) => {
        const finalType =
          rep.componentType === 'Other'
            ? rep.customType?.trim() || 'Custom Component'
            : rep.componentType;

        let newComponentPayload = null;
        if (rep.sourceType === 'inventory') {
          const compatible = getCompatibleInventory(finalType);
          const chosenId = rep.selectedInventoryItemId || compatible[0]?._id;
          const foundItem = availableItems.find((it) => it._id === chosenId);

          if (foundItem) {
            newComponentPayload = {
              itemId: foundItem._id,
              itemNumber: foundItem.itemNumber,
              description: foundItem.itemDescription,
              serialNumber: foundItem.serialNumber,
            };
          }
        } else {
          newComponentPayload = {
            description: rep.customDescription.trim(),
            serialNumber: rep.customSerialNumber.trim() || `SN-REP-${Date.now()}`,
          };
        }

        return {
          componentType: finalType,
          oldComponent: {
            description: rep.oldDescription?.trim() || `Old ${finalType}`,
            serialNumber: rep.oldSerialNumber?.trim() || '',
            disposition: rep.oldDisposition,
            reason: rep.oldReason?.trim() || 'Part replacement',
            existingItemId: rep.existingItemId,
          },
          newComponent: newComponentPayload,
          registerOldAsItem: true,
          notes: rep.notes?.trim() || '',
        };
      });

      const payload = {
        replacements: payloadReplacements,
        performedBy: user?.name || 'IT Department Administrator',
        notes: workNotes.trim(),
      };

      await api.replacePart(targetItem._id, payload);

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Failed to process part replacement:', err);
      setError(err.message || 'Failed to process component replacement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header (Pinned Top) */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Modular Maintenance
                </span>
                <span className="text-xs text-slate-400">
                  {targetItem.equipmentType || 'Equipment'}
                </span>
              </div>
              <h3 className="text-base font-bold tracking-tight text-white mt-0.5">
                Component & Parts Replacement
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Item Reference Banner (Pinned Top) */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
              {targetItem.assetTag || targetItem.itemNumber}
            </span>
            <div>
              <span className="font-bold text-slate-900 block">{targetItem.itemDescription}</span>
              <span className="text-[11px] text-slate-500">
                Model: <strong className="text-slate-700">{targetItem.brandModel}</strong> &bull; SN:{' '}
                <strong className="font-mono text-slate-700">{targetItem.serialNumber}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px]">
              Status: {targetItem.status}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
              Condition: {targetItem.currentCondition}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{error}</div>
            </div>
          )}

          {/* SECTION 1: ACTUAL INSTALLED COMPONENTS ON THIS UNIT (if any exist) */}
          {installedOnDevice.length > 0 && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <Box className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Actual Components Currently Installed on this Device:</span>
                </span>
                <span className="text-[10px] text-emerald-800 font-medium">
                  Click any part below to schedule its replacement
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {installedOnDevice.map((comp, idx) => {
                  const isScheduled = replacements.some(
                    (r) =>
                      r.existingItemId === comp.itemId ||
                      (r.componentType === comp.componentType &&
                        r.oldSerialNumber === comp.serialNumber)
                  );
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectInstalledComponent(comp)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isScheduled
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-emerald-100/50 border-emerald-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs flex items-center space-x-1.5">
                          <span>{comp.componentType}</span>
                          {isScheduled && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 truncate ${
                            isScheduled ? 'text-emerald-100' : 'text-slate-600'
                          }`}
                        >
                          {comp.itemDescription}
                        </div>
                        {comp.serialNumber && (
                          <div
                            className={`text-[10px] font-mono ${
                              isScheduled ? 'text-emerald-200' : 'text-slate-500'
                            }`}
                          >
                            SN: {comp.serialNumber}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isScheduled
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isScheduled ? 'Selected' : '+ Replace'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: SELECT / HIGHLIGHT COMPONENT TYPES */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Select / Highlight Components to Replace:
                </label>
                <p className="text-[11px] text-slate-500">
                  Tailored physical parts for {targetItem.equipmentType || 'this equipment'}. You can
                  highlight multiple components to replace together.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {replacements.length} Part{replacements.length !== 1 ? 's' : ''} Selected
              </span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {presets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = replacements.some((r) => r.componentType === preset.type);
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => handleTogglePreset(preset.type)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs">{preset.type}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {preset.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: REPLACEMENT CONFIGURATION CARDS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Replacement Details ({replacements.length} Component{replacements.length !== 1 ? 's' : ''}):</span>
              </span>

              <button
                type="button"
                onClick={handleAddBlankReplacement}
                className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl font-bold transition text-xs inline-flex items-center space-x-1 border border-slate-200"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Add Another Part</span>
              </button>
            </div>

            {/* Individual Replacement Cards */}
            <div className="space-y-4">
              {replacements.map((rep, index) => {
                const compatibleInventory = getCompatibleInventory(
                  rep.componentType === 'Other' ? rep.customType : rep.componentType
                );
                const isCustomType = rep.componentType === 'Other';

                return (
                  <div
                    key={rep.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 relative shadow-2xs"
                  >
                    {/* Top Row: Component Index & Name & Delete button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            Component {index + 1}:
                          </span>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                            {rep.componentType}
                          </span>
                          {rep.existingItemId && (
                            <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                              Installed Part
                            </span>
                          )}
                        </div>

                        {/* If "Other" is selected, OPEN NEW INPUT immediately */}
                        {isCustomType && (
                          <div className="pt-2 animate-in fade-in duration-150">
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              Specify Custom Component Name: <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              autoFocus
                              placeholder="e.g. Cooling Fan, Touchpad, Charging Port, Wi-Fi Antenna, Casing..."
                              value={rep.customType}
                              onChange={(e) => updateReplacement(rep.id, 'customType', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                            />
                          </div>
                        )}
                      </div>

                      {/* Delete button if multiple replacements */}
                      {replacements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveReplacement(rep.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove this replacement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Step A: Old Component Details & Disposition */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                        <span>A. Dismantled / Old Part Disposition:</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          Routed automatically to database
                        </span>
                      </div>

                      {/* Disposition Radio Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center space-x-2.5 ${
                            rep.oldDisposition === 'For Disposal'
                              ? 'border-rose-500 bg-rose-50/60 ring-1 ring-rose-500/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`disposition-${rep.id}`}
                            value="For Disposal"
                            checked={rep.oldDisposition === 'For Disposal'}
                            onChange={() => updateReplacement(rep.id, 'oldDisposition', 'For Disposal')}
                            className="text-rose-600 focus:ring-rose-500"
                          />
                          <div>
                            <div className="font-bold text-rose-950 text-xs flex items-center space-x-1">
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>For Disposal (E-Waste / Scrap)</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block leading-tight">
                              Worn out, defective or unrepairable
                            </span>
                          </div>
                        </label>

                        <label
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center space-x-2.5 ${
                            rep.oldDisposition === 'For Repair'
                              ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`disposition-${rep.id}`}
                            value="For Repair"
                            checked={rep.oldDisposition === 'For Repair'}
                            onChange={() => updateReplacement(rep.id, 'oldDisposition', 'For Repair')}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <div className="font-bold text-amber-950 text-xs flex items-center space-x-1">
                              <Wrench className="w-3.5 h-3.5 text-amber-600" />
                              <span>For Repair (Service / Bench Queue)</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block leading-tight">
                              Sent for technical servicing / supplier RMA
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* Old Part Description, Serial & Reason */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                            Old Part Description:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Factory 12V 7.2Ah Battery, 8GB DDR4 RAM..."
                            value={rep.oldDescription}
                            onChange={(e) => updateReplacement(rep.id, 'oldDescription', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                            Old Serial # (if visible):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. SN-BAT-8921 or Leave blank"
                            value={rep.oldSerialNumber}
                            onChange={(e) => updateReplacement(rep.id, 'oldSerialNumber', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Failure Reason Quick Presets */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 block">
                          Defect Reason / Failure Cause:
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {commonDefectReasons.slice(0, 4).map((rPreset) => (
                            <button
                              type="button"
                              key={rPreset}
                              onClick={() => updateReplacement(rep.id, 'oldReason', rPreset)}
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition ${
                                rep.oldReason === rPreset
                                  ? 'bg-slate-800 text-white border-slate-800'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              }`}
                            >
                              {rPreset}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Specific defect notes (e.g. Swollen battery casing, memory blue screen)..."
                          value={rep.oldReason}
                          onChange={(e) => updateReplacement(rep.id, 'oldReason', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs mt-1"
                        />
                      </div>
                    </div>

                    {/* Step B: New Replacement Part */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          B. New Replacement Component to Install:
                        </span>

                        {/* Source toggle */}
                        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateReplacement(rep.id, 'sourceType', 'inventory')}
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition ${
                              rep.sourceType === 'inventory'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            From Inventory ({compatibleInventory.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => updateReplacement(rep.id, 'sourceType', 'custom')}
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition ${
                              rep.sourceType === 'custom'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Manual / Direct Part
                          </button>
                        </div>
                      </div>

                      {rep.sourceType === 'inventory' ? (
                        <div className="space-y-1.5">
                          {compatibleInventory.length === 0 ? (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center justify-between">
                              <span>No compatible available items found in inventory stock.</span>
                              <button
                                type="button"
                                onClick={() => updateReplacement(rep.id, 'sourceType', 'custom')}
                                className="underline font-bold ml-2 hover:text-amber-900"
                              >
                                Enter Manually &rarr;
                              </button>
                            </div>
                          ) : (
                            <div>
                              <select
                                value={rep.selectedInventoryItemId || compatibleInventory[0]?._id}
                                onChange={(e) =>
                                  updateReplacement(rep.id, 'selectedInventoryItemId', e.target.value)
                                }
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                {compatibleInventory.map((item) => (
                                  <option key={item._id} value={item._id}>
                                    {item.assetTag || item.itemNumber} - {item.itemDescription} (SN:{' '}
                                    {item.serialNumber})
                                  </option>
                                ))}
                              </select>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Status of selected item will automatically change to Assigned with
                                parent linking.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                              New Part Description / Brand Model: <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Kingston 16GB DDR4 3200MHz RAM"
                              value={rep.customDescription}
                              onChange={(e) =>
                                updateReplacement(rep.id, 'customDescription', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                              New Serial Number:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. SN-KNG-99214 or Auto-gen"
                              value={rep.customSerialNumber}
                              onChange={(e) =>
                                updateReplacement(rep.id, 'customSerialNumber', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: OVERALL WORK ORDER NOTES */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-800 block">
              Overall Work Order Remarks / Technician Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Routine 2-year maintenance overhaul; tested voltage and boot stability..."
              value={workNotes}
              onChange={(e) => setWorkNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Modal Footer (Pinned Bottom) */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Replacing <strong>{replacements.length}</strong> component(s) on{' '}
            <strong className="text-slate-800">{targetItem.itemNumber}</strong>
          </span>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Processing {replacements.length} Part(s)...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Confirm & Replace {replacements.length} Component
                    {replacements.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
);
}
