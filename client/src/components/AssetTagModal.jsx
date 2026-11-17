import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import {
  X,
  Printer,
  Barcode,
  User,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Video,
  Monitor,
  CheckCircle2,
  Package,
  ExternalLink,
  History,
} from 'lucide-react';

function generateBarcodeDataUrl(text, options = {}) {
  if (!text) return '';
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, String(text).trim(), {
      format: 'CODE128',
      lineColor: '#000000',
      width: options.width || 1.15,
      height: options.height || 42,
      displayValue: true,
      text: options.displayText || String(text).trim(),
      font: 'monospace',
      fontSize: options.fontSize || 9,
      fontOptions: 'bold',
      textMargin: 3,
      margin: 4,
      background: '#ffffff',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Barcode generation error for:', text, err);
    return '';
  }
}

export default function AssetTagModal({
  isOpen,
  onClose,
  item = null,
  group = null,
  currentAssignment = null,
}) {
  const isGroupModal = Boolean(group || item?.isSetGroup || item?.type === 'preset_group');
  const targetGroup = group || (item?.isSetGroup || item?.type === 'preset_group' ? item : null);

  const [activeTab, setActiveTab] = useState('group'); // 'group' or 'components'
  const [componentIndex, setComponentIndex] = useState(0);

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(isGroupModal ? 'group' : 'single');
      setComponentIndex(0);
    }
  }, [isOpen, isGroupModal]);

  // Sort components naturally if group is provided
  const sortedComponents = useMemo(() => {
    if (!targetGroup?.items) return [];
    return [...targetGroup.items].sort((a, b) => {
      const tagA = a.equipmentTag || a.propertyTag || a.itemNumber || a.tag || '';
      const tagB = b.equipmentTag || b.propertyTag || b.itemNumber || b.tag || '';
      return tagA.localeCompare(tagB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [targetGroup]);

  // Current active item for preview
  const currentItem = isGroupModal
    ? sortedComponents[componentIndex] || sortedComponents[0] || null
    : item;

  // Resolve holder details
  const assignment = currentAssignment || currentItem?.currentAssignment;
  const isAssigned =
    (currentItem?.status === 'Assigned' || targetGroup?.status === 'Assigned') &&
    (assignment || targetGroup?.custodian || targetGroup?.currentCustodian);

  const holderName = isGroupModal
    ? targetGroup.custodian ||
      targetGroup.currentCustodian ||
      targetGroup.storeName ||
      targetGroup.employeeName ||
      assignment?.employeeName ||
      assignment?.storeName ||
      'Assigned Custodian'
    : isAssigned
    ? assignment?.employeeName ||
      assignment?.employee?.name ||
      assignment?.storeName ||
      'Assigned Custodian'
    : 'Unassigned / In Inventory';

  const holderSub = isGroupModal
    ? targetGroup.department ||
      (targetGroup.storeName ? 'Store Group Accountability' : 'Official Deployment')
    : isAssigned
    ? assignment?.department ||
      assignment?.employee?.department ||
      (assignment?.storeName ? 'Store Group Accountability' : '')
    : 'Ready for Issuance';

  const dateIssuedStr = isGroupModal
    ? targetGroup.issuanceDate || targetGroup.dateIssued
      ? new Date(targetGroup.issuanceDate || targetGroup.dateIssued).toLocaleDateString()
      : 'Active Deployment'
    : isAssigned && (assignment?.dateIssued || assignment?.date)
    ? new Date(assignment.dateIssued || assignment.date).toLocaleDateString()
    : 'Not Issued (In Storage)';

  // Tags & Codes
  const groupTagCode = (
    targetGroup?.setEquipmentTag ||
    targetGroup?.equipmentTag ||
    targetGroup?.setItemNumber ||
    targetGroup?.setTag ||
    'CFI-SET-TAG'
  )
    .trim()
    .toUpperCase();

  const singleTagCode = (
    currentItem?.equipmentTag ||
    currentItem?.propertyTag ||
    currentItem?.assetTag ||
    currentItem?.itemNumber ||
    currentItem?.serialNumber ||
    'CFI-ASSET'
  )
    .trim()
    .toUpperCase();

  // History URLs & Live Trail Paths
  const navigate = useNavigate();

  const groupHistoryPath = `/history/set/${encodeURIComponent(groupTagCode)}`;
  const fullGroupHistoryUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${groupHistoryPath}` : groupHistoryPath;

  const singleId = currentItem?._id || singleTagCode;
  const singleHistoryPath = currentItem?._id
    ? `/history/item/${encodeURIComponent(currentItem._id)}`
    : `/history/set/${encodeURIComponent(singleTagCode)}`;
  const fullSingleHistoryUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${singleHistoryPath}` : singleHistoryPath;

  const currentHistoryPath = activeTab === 'group' && isGroupModal ? groupHistoryPath : singleHistoryPath;
  const currentFullHistoryUrl = activeTab === 'group' && isGroupModal ? fullGroupHistoryUrl : fullSingleHistoryUrl;

  // Generate barcodes encoding the live history link directly
  const groupBarcodeUrl = useMemo(
    () => (isGroupModal && fullGroupHistoryUrl ? generateBarcodeDataUrl(fullGroupHistoryUrl) : ''),
    [isGroupModal, fullGroupHistoryUrl]
  );

  const singleBarcodeUrl = useMemo(
    () => (fullSingleHistoryUrl ? generateBarcodeDataUrl(fullSingleHistoryUrl) : ''),
    [fullSingleHistoryUrl]
  );

  if (!isOpen) return null;

  const isCctv = targetGroup?.setTag?.toLowerCase().includes('cctv');

  // Tag Range calculation for group
  const firstTag =
    sortedComponents[0]?.equipmentTag ||
    sortedComponents[0]?.propertyTag ||
    sortedComponents[0]?.itemNumber ||
    '';
  const lastTag =
    sortedComponents[sortedComponents.length - 1]?.equipmentTag ||
    sortedComponents[sortedComponents.length - 1]?.propertyTag ||
    sortedComponents[sortedComponents.length - 1]?.itemNumber ||
    '';
  const tagRangeStr =
    firstTag && lastTag && firstTag !== lastTag ? `${firstTag} → ${lastTag}` : firstTag;

  // Print Handler
  const handlePrint = (mode = 'current') => {
    const printWindow = window.open('', '_blank', 'width=560,height=440');
    if (!printWindow) return;

    let stickersHtml = '';

    if (mode === 'group' || (mode === 'current' && activeTab === 'group')) {
      // Print 1 Master Set Group Tag
      stickersHtml = `
        <div class="sticker-page">
          <div class="sticker">
            <div class="header">
              <div style="display:flex;align-items:center;gap:6px;">
                <img src="/logo_icon.png" style="height:16px;object-fit:contain;" alt="CFI" onerror="this.src='/cfi_logo.png'" />
                <span class="company">CHAWNAH FOODS INC.</span>
              </div>
              <span class="badge ${isCctv ? 'badge-cctv' : 'badge-desk'}">SET ASSET TAG</span>
            </div>

            <div class="barcode-card">
              <div class="barcode-wrapper">
                <img class="barcode-img" src="${groupBarcodeUrl}" alt="${fullGroupHistoryUrl}" />
                <div class="barcode-link-text">${fullGroupHistoryUrl}</div>
              </div>
              <div class="url-box">
                ${fullGroupHistoryUrl}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (mode === 'all_components') {
      // Batch print all individual component stickers in the group
      const renderedComponents = sortedComponents.map((comp) => {
        const compTag = (
          comp.equipmentTag ||
          comp.propertyTag ||
          comp.assetTag ||
          comp.itemNumber ||
          comp.serialNumber ||
          'CFI-TAG'
        )
          .trim()
          .toUpperCase();
        const compHistoryUrl = `${window.location.origin}/history/item/${encodeURIComponent(comp._id || compTag)}`;
        const compBarcode = generateBarcodeDataUrl(compHistoryUrl);

        return `
          <div class="sticker-page">
            <div class="sticker">
              <div class="header">
                <div style="display:flex;align-items:center;gap:6px;">
                  <img src="/logo_icon.png" style="height:16px;object-fit:contain;" alt="CFI" onerror="this.src='/cfi_logo.png'" />
                  <span class="company">CHAWNAH FOODS INC.</span>
                </div>
                <span class="badge badge-desk">ASSET TAG</span>
              </div>

              <div class="barcode-card">
                <div class="barcode-wrapper">
                  <img class="barcode-img" src="${compBarcode}" alt="${compHistoryUrl}" />
                  <div class="barcode-link-text">${compHistoryUrl}</div>
                </div>
                <div class="url-box">
                  ${compHistoryUrl}
                </div>
              </div>
            </div>
          </div>
        `;
      });
      stickersHtml = renderedComponents.join('');
    } else {
      // Print single item sticker
      stickersHtml = `
        <div class="sticker-page">
          <div class="sticker">
            <div class="header">
              <div style="display:flex;align-items:center;gap:6px;">
                <img src="/logo_icon.png" style="height:16px;object-fit:contain;" alt="CFI" onerror="this.src='/cfi_logo.png'" />
                <span class="company">CHAWNAH FOODS INC.</span>
              </div>
              <span class="badge badge-desk">ASSET TAG</span>
            </div>

            <div class="barcode-card">
              <div class="barcode-wrapper">
                <img class="barcode-img" src="${singleBarcodeUrl}" alt="${fullSingleHistoryUrl}" />
                <div class="barcode-link-text">${fullSingleHistoryUrl}</div>
              </div>
              <div class="url-box">
                ${fullSingleHistoryUrl}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Asset Tag - ${isGroupModal ? groupTagCode : singleTagCode}</title>
          <style>
            @page {
              size: 75mm 45mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
            }
            .sticker-page {
              width: 75mm;
              height: 45mm;
              padding: 2.2mm;
              page-break-after: always;
              break-after: page;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
            }
            .sticker-page:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            .sticker {
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              padding: 3mm 4mm;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
              background: #fff;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1.2px solid #0f172a;
              padding-bottom: 2mm;
            }
            .company {
              font-size: 9.5px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              color: #0f172a;
            }
            .badge {
              font-size: 7px;
              font-weight: 900;
              background: #1d4ed8;
              color: #fff;
              padding: 1.5px 6px;
              border-radius: 3px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .badge-cctv {
              background: #b45309;
            }
            .badge-desk {
              background: #1d4ed8;
            }
            .barcode-card {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 2.5mm 3mm;
              margin-top: 2.5mm;
            }
            .barcode-wrapper {
              width: 100%;
              text-align: center;
            }
            .barcode-img {
              max-width: 100%;
              height: 48px;
              object-fit: contain;
              display: block;
              margin: 0 auto;
            }
            .barcode-link-text {
              font-size: 5px;
              font-family: monospace;
              color: #1e293b;
              margin-top: 1px;
            }
            .url-box {
              margin-top: 2.5mm;
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: 2px 8px;
              font-family: monospace;
              font-size: 6.5px;
              font-weight: bold;
              color: #0f172a;
              text-align: center;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
          </style>
        </head>
        <body>
          ${stickersHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div
              className={`p-2 rounded-lg ${
                isGroupModal
                  ? isCctv
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isGroupModal ? 'Print Equipment Set Tag' : 'Print Equipment Asset Tag'}
                </h3>
                {isGroupModal && (
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCctv
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    PRE-SET GROUP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Code 128 barcode link to live equipment history trail page
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Equipment & Set History Trail Page Shortcut Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/90 rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <span>View Full Equipment History Trail</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                  PAGE
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Click to open dedicated lifecycle timeline, specs, and custody history
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(currentHistoryPath);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-95 shrink-0"
          >
            <span>Open History</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Selector for Pre-Sets */}
        {isGroupModal && (
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('group')}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition inline-flex items-center justify-center space-x-1.5 ${
                activeTab === 'group'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isCctv ? <Video className="w-3.5 h-3.5 text-amber-600" /> : <Monitor className="w-3.5 h-3.5 text-blue-600" />}
              <span>Group Master Tag</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('components')}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition inline-flex items-center justify-center space-x-1.5 ${
                activeTab === 'components'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Component Stickers ({sortedComponents.length})</span>
            </button>
          </div>
        )}

        {/* Component Selector sub-bar when activeTab === 'components' */}
        {isGroupModal && activeTab === 'components' && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <button
              type="button"
              disabled={componentIndex <= 0}
              onClick={() => setComponentIndex((prev) => Math.max(0, prev - 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center font-medium">
              <span className="text-slate-500 font-normal">Component </span>
              <strong className="text-slate-900">{componentIndex + 1}</strong> of{' '}
              <strong className="text-slate-900">{sortedComponents.length}</strong>
              <div className="text-[11px] font-mono font-bold text-indigo-700 truncate max-w-xs">
                {currentItem?.itemDescription || currentItem?.equipmentType} &bull; {singleTagCode}
              </div>
            </div>

            <button
              type="button"
              disabled={componentIndex >= sortedComponents.length - 1}
              onClick={() => setComponentIndex((prev) => Math.min(sortedComponents.length - 1, prev + 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sticker Mockup Preview */}
        <div className="p-4 bg-slate-100/90 rounded-2xl flex justify-center">
          <div className="bg-white border-2 border-slate-900 rounded-xl p-4 shadow-sm max-w-[440px] w-full space-y-3 text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center space-x-2">
                <img
                  src="/logo_icon.png"
                  alt="CFI Logo"
                  className="h-5 w-auto object-contain"
                  onError={(e) => {
                    e.target.src = '/cfi_logo.png';
                  }}
                />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 whitespace-nowrap">
                  CHAWNAH FOODS INC.
                </span>
              </div>
              <span
                className={`text-[9.5px] font-black px-2.5 py-0.5 rounded-md tracking-wider uppercase text-white whitespace-nowrap ${
                  isGroupModal && activeTab === 'group'
                    ? isCctv
                      ? 'bg-amber-700'
                      : 'bg-blue-600'
                    : 'bg-blue-600'
                }`}
              >
                {isGroupModal && activeTab === 'group' ? 'SET ASSET TAG' : 'ASSET TAG'}
              </span>
            </div>

            {/* Clickable Barcode Link Section */}
            <div
              onClick={() => {
                onClose();
                navigate(currentHistoryPath);
              }}
              title="Click barcode to view live History Trail page"
              className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition cursor-pointer group text-center space-y-2.5"
            >
              {(activeTab === 'group' && isGroupModal ? groupBarcodeUrl : singleBarcodeUrl) ? (
                <img
                  src={activeTab === 'group' && isGroupModal ? groupBarcodeUrl : singleBarcodeUrl}
                  alt={currentFullHistoryUrl}
                  className="h-16 w-auto object-contain max-w-full mx-auto group-hover:scale-[1.01] transition"
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-xs text-slate-400">
                  Generating barcode link...
                </div>
              )}
              <div className="text-[10px] font-mono text-slate-800 font-bold truncate max-w-[340px] mx-auto bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                {currentFullHistoryUrl}
              </div>
              <div className="text-[9.5px] text-blue-600 font-bold group-hover:underline flex items-center justify-center space-x-1">
                <span>Click barcode to open live history trail</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed text-center">
          Prints directly on standard thermal sticker labels (75mm &times; 45mm / Zebra, Brother &amp; Dymo roll printers).
        </p>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg text-xs transition"
          >
            Close
          </button>

          <div className="flex items-center space-x-2">
            {/* Batch print all components button when in group mode */}
            {isGroupModal && (
              <button
                type="button"
                onClick={() => handlePrint('all_components')}
                title="Print individual barcode stickers for all components in this set"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-lg text-xs border border-indigo-200 transition"
              >
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                <span>Print All ({sortedComponents.length} Stickers)</span>
              </button>
            )}

            {/* Main Print Sticker button */}
            <button
              type="button"
              onClick={() => handlePrint(activeTab === 'group' && isGroupModal ? 'group' : 'current')}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isGroupModal && activeTab === 'group'
                  ? 'Print Group Tag'
                  : 'Print Barcode Sticker'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
