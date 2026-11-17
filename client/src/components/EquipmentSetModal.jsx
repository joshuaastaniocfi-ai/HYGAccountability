import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Laptop,
  Video,
  Store,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Boxes,
  Calendar,
  Layers,
  HardDrive,
  Cpu,
  Monitor,
  Zap,
  Cable,
  Info,
} from 'lucide-react';

// Unique random serial generator helper
const generateUniqueSerial = (prefix) => {
  const timestamp = Date.now().toString().slice(-4);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}${randomPart}`;
};

export default function EquipmentSetModal({
  isOpen,
  onClose,
  onAddItems,
  availableInventory = [],
  initialSetType = 'store_bundle',
  defaultDateIssued,
}) {
  // activeSetKey: 'store_bundle' | 'desktop' | 'cctv'
  const [activeSetKey, setActiveSetKey] = useState(initialSetType || 'store_bundle');

  // Desktop Set options: Hard drive or SSD, HDMI or VGA
  const [desktopStorage, setDesktopStorage] = useState('SSD'); // 'SSD' | 'HDD'
  const [desktopCable, setDesktopCable] = useState('HDMI'); // 'HDMI' | 'VGA'

  // CCTV Set options: 4 or 8 cameras, brand selection ('none' for blank, 'Hikvision', or 'Dahua')
  const [cctvCameraCount, setCctvCameraCount] = useState(4); // 4 | 8
  const [cctvCable, setCctvCable] = useState('HDMI'); // 'HDMI' | 'VGA'
  const [cctvBrand, setCctvBrand] = useState('none'); // 'none' | 'Hikvision' | 'Dahua'
  const cctvTemplate = cctvBrand;

  // Common options
  const [globalCondition, setGlobalCondition] = useState('Good');
  const [dateIssued, setDateIssued] = useState(
    defaultDateIssued || new Date().toISOString().split('T')[0]
  );

  // Inclusions state
  const [itemsList, setItemsList] = useState([]);

  useEffect(() => {
    if (initialSetType) {
      setActiveSetKey(initialSetType);
    }
  }, [initialSetType]);

  // Build items when active set or options change
  useEffect(() => {
    if (!isOpen) return;

    // Desktop Set inclusions: Item name and description are the same (clean, straightforward equipment name)
    const buildDesktopInclusions = () => [
      {
        id: `desk-mon-${Date.now()}-1`,
        group: 'Desktop Set',
        key: 'desktop_monitor',
        name: 'Monitor',
        equipmentType: 'Monitor',
        category: 'Printers & Peripherals',
        description: 'Monitor',
        brandModel: '',
        serialNumber: '',
        condition: globalCondition,
        remark: 'Desktop Set — Monitor',
        selected: true,
        requiresSerial: true,
      },
      {
        id: `desk-mou-${Date.now()}-2`,
        group: 'Desktop Set',
        key: 'desktop_mouse',
        name: 'Mouse',
        equipmentType: 'Mouse',
        category: 'Printers & Peripherals',
        description: 'Mouse',
        brandModel: '',
        serialNumber: '',
        condition: globalCondition,
        remark: 'Desktop Set — Mouse',
        selected: true,
        requiresSerial: true,
      },
      {
        id: `desk-kbd-${Date.now()}-3`,
        group: 'Desktop Set',
        key: 'desktop_keyboard',
        name: 'Keyboard',
        equipmentType: 'Keyboard',
        category: 'Printers & Peripherals',
        description: 'Keyboard',
        brandModel: '',
        serialNumber: '',
        condition: globalCondition,
        remark: 'Desktop Set — Keyboard',
        selected: true,
        requiresSerial: true,
      },
      {
        id: `desk-sys-${Date.now()}-4`,
        group: 'Desktop Set',
        key: 'desktop_system_unit',
        name: 'System Unit',
        equipmentType: 'Desktop',
        category: 'Laptops & Desktops',
        description: 'System Unit',
        brandModel: '',
        serialNumber: '',
        condition: globalCondition,
        remark: `Desktop Set — System Unit (${desktopStorage === 'SSD' ? 'SSD' : 'HDD'})`,
        selected: true,
        requiresSerial: true,
      },
      {
        id: `desk-ups-${Date.now()}-5`,
        group: 'Desktop Set',
        key: 'desktop_ups',
        name: 'UPS',
        equipmentType: 'UPS',
        category: 'Office Equipment',
        description: 'UPS',
        brandModel: '',
        serialNumber: '',
        condition: globalCondition,
        remark: 'Desktop Set — UPS Battery Backup',
        selected: true,
        requiresSerial: true,
      },
      {
        id: `desk-cab-${Date.now()}-6`,
        group: 'Desktop Set',
        key: 'desktop_cable',
        name: `${desktopCable} Cable`,
        equipmentType: 'Cables & Accessories',
        category: 'Office Equipment',
        description: `${desktopCable} Cable`,
        brandModel: '',
        serialNumber: '',
        condition: globalCondition,
        remark: `Desktop Set — ${desktopCable} Display Cable`,
        selected: true,
        requiresSerial: false,
      },
      {
        id: `desk-lan-${Date.now()}-7`,
        group: 'Desktop Set',
        key: 'desktop_lan',
        name: 'LAN Cable',
        equipmentType: 'Cables & Accessories',
        category: 'Office Equipment',
        description: 'LAN Cable',
        brandModel: '',
        serialNumber: '',
        condition: globalCondition,
        remark: 'Desktop Set — LAN Cable',
        selected: true,
        requiresSerial: false,
      },
    ];

    // CCTV Set inclusions: default description AND serial numbers are blank (removed default values)
    const buildCctvInclusions = () => {
      const cams = [];
      const camCount = cctvCameraCount || 4;
      const isHik = cctvTemplate === 'Hikvision';
      const isDahua = cctvTemplate === 'Dahua';
      const hasTemplate = isHik || isDahua;
      const brandName = isDahua ? 'Dahua' : isHik ? 'Hikvision' : '';
      const camModel = isDahua ? 'Dahua DH-HAC-B1A21N' : isHik ? 'Hikvision DS-2CE16D0T' : '';
      const dvrModel = isDahua
        ? camCount === 8
          ? 'Dahua DH-XVR5108HS'
          : 'Dahua DH-XVR5104HS'
        : isHik
        ? camCount === 8
          ? 'Hikvision DS-7208HQHI'
          : 'Hikvision DS-7204HQHI'
        : '';
      const monitorModel = isDahua ? 'Dahua DHI-LM22-B200' : isHik ? 'Hikvision DS-D5022FN-C' : '';

      for (let i = 1; i <= camCount; i++) {
        cams.push({
          id: `cctv-cam-${Date.now()}-${i}`,
          group: 'CCTV Set',
          key: `cctv_camera_${i}`,
          name: hasTemplate ? `${brandName} Camera #${i}` : `Camera #${i}`,
          equipmentType: 'CCTV Camera',
          category: 'Office Equipment',
          description: hasTemplate
            ? `${brandName} 1080p HD CCTV Security Camera (Camera #${i})`
            : `Camera #${i}`,
          brandModel: camModel,
          serialNumber: '', // removed default serial number
          condition: globalCondition,
          remark: `CCTV Set — Camera Unit #${i} of ${camCount}`,
          selected: true,
          requiresSerial: true,
        });
      }

      return [
        {
          id: `cctv-dvr-${Date.now()}-1`,
          group: 'CCTV Set',
          key: 'cctv_dvr',
          name: hasTemplate ? `DVR (${brandName})` : 'DVR',
          equipmentType: 'DVR',
          category: 'Office Equipment',
          description: hasTemplate
            ? `${brandName} ${camCount}-Channel ${isHik ? 'Turbo ' : ''}HD DVR (with ${camCount === 8 ? '2TB' : '1TB'} Surveillance Hard Drive)`
            : 'DVR',
          brandModel: dvrModel,
          serialNumber: '', // removed default serial number
          condition: globalCondition,
          remark: `CCTV Set — ${camCount}-Channel DVR with Surveillance Hard Drive`,
          selected: true,
          requiresSerial: true,
        },
        {
          id: `cctv-psu-${Date.now()}-2`,
          group: 'CCTV Set',
          key: 'cctv_psu',
          name: 'Power Supply',
          equipmentType: 'Power Supplies & Adapters',
          category: 'Office Equipment',
          description: hasTemplate
            ? `Centralized 12V ${camCount === 8 ? '10A' : '5A'} DC CCTV Power Supply Metal Box`
            : 'Power Supply',
          brandModel: hasTemplate ? 'Standard CCTV Central PSU' : '',
          serialNumber: '', // removed default serial number
          condition: globalCondition,
          remark: `CCTV Set — 12V DC Centralized Power Box for ${camCount} cameras`,
          selected: true,
          requiresSerial: false,
        },
        {
          id: `cctv-spl-${Date.now()}-3`,
          group: 'CCTV Set',
          key: 'cctv_splitter',
          name: 'Power Splitter',
          equipmentType: 'Power Supplies & Adapters',
          category: 'Office Equipment',
          description: hasTemplate
            ? `1-to-${camCount} Channel DC Power Splitter Cable for Cameras`
            : 'Power Splitter',
          brandModel: hasTemplate ? `Standard ${camCount}-Way DC Splitter` : '',
          serialNumber: '', // removed default serial number
          condition: globalCondition,
          remark: `CCTV Set — ${camCount}-Way DC Power Splitter`,
          selected: true,
          requiresSerial: false,
        },
        ...cams,
        {
          id: `cctv-ups-${Date.now()}-ups`,
          group: 'CCTV Set',
          key: 'cctv_ups',
          name: 'UPS (CCTV Backup)',
          equipmentType: 'UPS',
          category: 'Office Equipment',
          description: hasTemplate
            ? 'Uninterruptible Power Supply for CCTV System (UPS 650VA / 360W)'
            : 'UPS (CCTV Backup)',
          brandModel: hasTemplate ? 'APC Back-UPS 650VA' : '',
          serialNumber: '', // removed default serial number
          condition: globalCondition,
          remark: 'CCTV Set — Dedicated UPS to maintain 24/7 recording during power cuts',
          selected: true,
          requiresSerial: true,
        },
        {
          id: `cctv-mon-${Date.now()}-mon`,
          group: 'CCTV Set',
          key: 'cctv_monitor',
          name: hasTemplate ? `Monitor (${brandName})` : 'Surveillance Monitor',
          equipmentType: 'Monitor',
          category: 'Printers & Peripherals',
          description: hasTemplate
            ? `${brandName} CCTV Surveillance LED Monitor Display (21.5")`
            : 'Surveillance Monitor',
          brandModel: monitorModel,
          serialNumber: '', // removed default serial number
          condition: globalCondition,
          remark: 'CCTV Set — Dedicated Surveillance Monitor',
          selected: true,
          requiresSerial: true,
        },
        {
          id: `cctv-hdmi-${Date.now()}-hdmi`,
          group: 'CCTV Set',
          key: 'cctv_hdmi',
          name: 'HDMI Cable',
          equipmentType: 'Cables & Accessories',
          category: 'Office Equipment',
          description: hasTemplate
            ? 'High-Speed HDMI Video Cable (DVR to Surveillance Monitor)'
            : 'HDMI Cable',
          brandModel: hasTemplate ? 'Standard HDMI 2.0' : '',
          serialNumber: '', // removed default serial number
          condition: globalCondition,
          remark: 'CCTV Set — HDMI Video Output Cable',
          selected: true,
          requiresSerial: false,
        },
        {
          id: `cctv-wir-${Date.now()}-wir`,
          group: 'CCTV Set',
          key: 'cctv_wires',
          name: 'RG59 Siamese Wires',
          equipmentType: 'Cables & Accessories',
          category: 'Office Equipment',
          description: hasTemplate
            ? 'CCTV Siamese Coaxial RG59 Video & DC Power Wires Roll'
            : 'RG59 Siamese Wires',
          brandModel: hasTemplate ? 'Standard RG59 Siamese' : '',
          serialNumber: '', // removed default serial number
          condition: globalCondition,
          remark: 'CCTV Set — Coaxial and Power Wires',
          selected: true,
          requiresSerial: false,
        },
        {
          id: `cctv-lan-${Date.now()}-lan`,
          group: 'CCTV Set',
          key: 'cctv_lan',
          name: 'LAN Cable (DVR)',
          equipmentType: 'Cables & Accessories',
          category: 'Office Equipment',
          description: hasTemplate
            ? 'Cat6 Network Cable for DVR Online Remote View'
            : 'LAN Cable',
          brandModel: hasTemplate ? 'Standard Cat6 UTP' : '',
          serialNumber: '', // removed default serial number
          condition: globalCondition,
          remark: 'CCTV Set — Network Cable for Remote Surveillance',
          selected: true,
          requiresSerial: false,
        },
      ];
    };

    let list = [];
    if (activeSetKey === 'store_bundle') {
      list = [...buildDesktopInclusions(), ...buildCctvInclusions()];
    } else if (activeSetKey === 'desktop') {
      list = buildDesktopInclusions();
    } else {
      list = buildCctvInclusions();
    }

    // Attach inventory matches if available
    const withStock = list.map((item) => {
      const matchingStock = availableInventory.filter((inv) => {
        const descMatch = inv.itemDescription?.toLowerCase().includes(item.name.toLowerCase());
        const typeMatch = inv.equipmentType?.toLowerCase() === item.equipmentType.toLowerCase();
        return descMatch || typeMatch;
      });
      return {
        ...item,
        availableStockMatches: matchingStock,
        linkedItemId: null,
      };
    });

    setItemsList(withStock);
  }, [
    activeSetKey,
    isOpen,
    desktopStorage,
    desktopCable,
    cctvCameraCount,
    cctvBrand,
    globalCondition,
    availableInventory,
  ]);

  if (!isOpen) return null;

  const selectedCount = itemsList.filter((i) => i.selected).length;

  const handleToggleItem = (id) => {
    setItemsList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleSelectAll = (select) => {
    setItemsList((prev) => prev.map((it) => ({ ...it, selected: select })));
  };

  const handleItemChange = (id, field, value) => {
    setItemsList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleLinkToInventory = (id, invItemId) => {
    if (!invItemId) {
      setItemsList((prev) =>
        prev.map((it) => (it.id === id ? { ...it, linkedItemId: null } : it))
      );
      return;
    }

    const stockItem = availableInventory.find((i) => i._id === invItemId);
    if (!stockItem) return;

    setItemsList((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              linkedItemId: stockItem._id,
              description: stockItem.itemDescription,
              brandModel: stockItem.brandModel,
              serialNumber: stockItem.serialNumber,
              condition: stockItem.currentCondition || 'Good',
            }
          : it
      )
    );
  };

  const handleConfirmAdd = () => {
    const selected = itemsList.filter((i) => i.selected);
    if (selected.length === 0) return;

    const formattedRows = selected.map((item) => ({
      equipment: item.description || item.name || '',
      brand: item.brandModel || '',
      serialNumber: item.serialNumber,
      conditionAtIssuance: item.condition,
      remark: item.remark,
      dateIssued: dateIssued,
      equipmentType: item.equipmentType,
      category: item.category,
      itemId: item.linkedItemId || null,
      setTag: item.group || (activeSetKey === 'desktop' ? 'Desktop Set' : 'CCTV Set'),
    }));

    onAddItems(formattedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Pinned Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-900/10 shrink-0 border border-slate-700/50">
              {activeSetKey === 'store_bundle' ? (
                <Store className="w-6 h-6 text-amber-400" />
              ) : activeSetKey === 'desktop' ? (
                <Laptop className="w-6 h-6 text-emerald-400" />
              ) : (
                <Video className="w-6 h-6 text-indigo-400" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900">
                  Equipment Set & Branch Deployment
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-300">
                  Standard Chawnah Branch Gear
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every store by default has a <strong>Desktop Set</strong> (Monitor, Mouse, Keyboard, System Unit, UPS, HDMI/VGA) and a <strong>CCTV Set</strong> (DVR with HDD, Power Supply, Splitter, 4 or 8 Cameras, UPS, Monitor, HDMI).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Preset Tabs */}
        <div className="p-3.5 bg-slate-100/70 border-b border-slate-200/80 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSetKey('store_bundle')}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                activeSetKey === 'store_bundle'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Complete Store Package (Desktop + CCTV)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSetKey('desktop')}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                activeSetKey === 'desktop'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Desktop Set Only</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSetKey('cctv')}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                activeSetKey === 'cctv'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>CCTV Set Only</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-semibold">Date:</span>
            <input
              type="date"
              value={dateIssued}
              onChange={(e) => setDateIssued(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none"
            />
          </div>
        </div>

        {/* Configuration Toolbar for Options (SSD vs HDD, HDMI vs VGA, 4 vs 8 Cameras, Hikvision vs Dahua) */}
        <div className="bg-slate-50 p-4 border-b border-slate-200/70 shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* Desktop Storage Selector (SSD or HDD) */}
          {(activeSetKey === 'store_bundle' || activeSetKey === 'desktop') && (
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                System Unit Storage:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDesktopStorage('SSD')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border flex items-center justify-center space-x-1 ${
                    desktopStorage === 'SSD'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>SSD Drive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopStorage('HDD')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border flex items-center justify-center space-x-1 ${
                    desktopStorage === 'HDD'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Hard Drive</span>
                </button>
              </div>
            </div>
          )}

          {/* Desktop Display Cable Selector (HDMI or VGA) */}
          {(activeSetKey === 'store_bundle' || activeSetKey === 'desktop') && (
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Workstation Display Cable:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDesktopCable('HDMI')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border flex items-center justify-center space-x-1 ${
                    desktopCable === 'HDMI'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Cable className="w-3.5 h-3.5" />
                  <span>HDMI Cable</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopCable('VGA')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border flex items-center justify-center space-x-1 ${
                    desktopCable === 'VGA'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>VGA Cable</span>
                </button>
              </div>
            </div>
          )}

          {/* CCTV Brand Option Selector (Hikvision vs Dahua) */}
          {(activeSetKey === 'store_bundle' || activeSetKey === 'cctv') && (
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  CCTV Brand:
                </span>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                  Auto-filled
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCctvBrand('Hikvision')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border flex items-center justify-center space-x-1 ${
                    cctvBrand === 'Hikvision'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Hikvision CCTV System (Auto-fills Hikvision Turbo HD cameras & DVR descriptions)"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Hikvision</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCctvBrand('Dahua')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border flex items-center justify-center space-x-1 ${
                    cctvBrand === 'Dahua'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Dahua CCTV System (Auto-fills Dahua HD cameras & DVR descriptions)"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Dahua</span>
                </button>
              </div>
            </div>
          )}

          {/* CCTV Camera Count Selector (4 or 8 Cameras) */}
          {(activeSetKey === 'store_bundle' || activeSetKey === 'cctv') && (
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                CCTV Camera Package:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCctvCameraCount(4)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border flex items-center justify-center space-x-1 ${
                    cctvCameraCount === 4
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>4 Cameras</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCctvCameraCount(8)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs transition border flex items-center justify-center space-x-1 ${
                    cctvCameraCount === 8
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>8 Cameras</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Body: Inclusions Checklist & Config */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span>Inclusions Checklist</span>
                <span className="text-xs font-normal text-slate-500">
                  ({selectedCount} of {itemsList.length} items selected)
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Every inclusion is issued as its own item record, and displayed with its individual date on the official printable accountability form.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSelectAll(selectedCount !== itemsList.length)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold transition hover:underline"
            >
              {selectedCount === itemsList.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Inclusions Cards List */}
          <div className="space-y-3">
            {itemsList.map((item, idx) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition ${
                  item.selected
                    ? 'bg-white border-slate-300 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Checkbox + Inclusion Name & Group */}
                  <div className="flex items-start space-x-3 min-w-[220px]">
                    <button
                      type="button"
                      onClick={() => handleToggleItem(item.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition ${
                        item.selected
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-300 text-transparent hover:border-slate-400'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {idx + 1}. {item.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {item.equipmentType}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {item.group} &bull; {item.requiresSerial ? 'Serialized Device' : 'Standard Accessory / Cable'}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Equipment Description & Brand Inputs */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Item Name / Description
                        </label>
                        {item.group === 'Desktop Set' ? (
                          <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            PC Item Name
                          </span>
                        ) : hasTemplate ? (
                          <span className="text-[9px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                            Auto-filled ({cctvBrand})
                          </span>
                        ) : null}
                      </div>
                      <input
                        type="text"
                        value={item.description}
                        disabled={!item.selected}
                        placeholder={item.name}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        Brand / Model
                      </label>
                      <input
                        type="text"
                        value={item.brandModel}
                        disabled={!item.selected}
                        placeholder={
                          item.group === 'Desktop Set'
                            ? 'e.g. Dell / HP / Logitech (optional)'
                            : 'Brand and hardware model...'
                        }
                        onChange={(e) => handleItemChange(item.id, 'brandModel', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Right: Serial Number & Stock Matcher */}
                  <div className="lg:w-64 space-y-1.5 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Serial Number
                        </label>
                        <button
                          type="button"
                          disabled={!item.selected}
                          onClick={() =>
                            handleItemChange(
                              item.id,
                              'serialNumber',
                              generateUniqueSerial(item.key.slice(0, 3).toUpperCase())
                            )
                          }
                          className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold"
                        >
                          Auto-gen
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.serialNumber}
                        disabled={!item.selected}
                        onChange={(e) => handleItemChange(item.id, 'serialNumber', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Stock Matcher */}
                    {item.availableStockMatches && item.availableStockMatches.length > 0 && (
                      <div className="pt-0.5">
                        <select
                          disabled={!item.selected}
                          value={item.linkedItemId || ''}
                          onChange={(e) => handleLinkToInventory(item.id, e.target.value)}
                          className="w-full px-2 py-1 bg-emerald-50/70 border border-emerald-200 rounded text-[11px] text-emerald-900 font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Use In-Stock Inventory ({item.availableStockMatches.length} available) --</option>
                          {item.availableStockMatches.map((stk) => (
                            <option key={stk._id} value={stk._id}>
                              Stock: {stk.itemNumber} - {stk.brandModel} ({stk.serialNumber})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Will populate <strong>{selectedCount} item rows</strong> with individual serial numbers, categories, and date of issuance.
            </span>
          </div>

          <div className="flex items-center space-x-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={selectedCount === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                Add {activeSetKey === 'store_bundle' ? 'Store Package' : activeSetKey === 'desktop' ? 'Desktop Set' : 'CCTV Set'} ({selectedCount} items)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
