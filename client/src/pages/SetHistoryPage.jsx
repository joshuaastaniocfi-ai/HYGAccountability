import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Barcode,
  History,
  Clock,
  Layers,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  RefreshCw,
  RotateCcw,
  FileText,
  Building2,
  User,
  Calendar,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Laptop,
  Monitor,
  Video,
  Cpu,
  Mouse,
  Keyboard,
  Share2,
  Check,
  Search,
  Info,
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { api } from '../services/api';
import AssetTagModal from '../components/AssetTagModal';

function generateBarcodeDataUrl(text, options = {}) {
  if (!text) return '';
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, String(text).trim(), {
      format: 'CODE128',
      lineColor: '#000000',
      width: options.width || 1.1,
      height: options.height || 38,
      displayValue: true,
      text: options.displayText || String(text).trim(),
      font: 'monospace',
      fontSize: options.fontSize || 7.5,
      fontOptions: 'bold',
      textMargin: 2,
      margin: 4,
      background: '#ffffff',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Barcode generation error:', err);
    return '';
  }
}

export default function SetHistoryPage() {
  const { tag: routeTag, id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'parts'
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [partSearch, setPartSearch] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  // Extract query params
  const setEquipmentTag = searchParams.get('setEquipmentTag') || (routeTag && routeTag.startsWith('CFI-') ? routeTag : null);
  const setItemNumber = searchParams.get('setItemNumber') || (routeTag && routeTag.startsWith('SET-') ? routeTag : null);
  const accountabilityId = searchParams.get('accountabilityId');
  const setTag = searchParams.get('setTag');
  const storeName = searchParams.get('storeName');
  const itemId = routeId || searchParams.get('itemId') || searchParams.get('id');
  const queryTag = searchParams.get('tag') || routeTag;
  const initialPartId = searchParams.get('partId');

  // Load history data
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (setEquipmentTag) params.setEquipmentTag = setEquipmentTag;
        if (setItemNumber) params.setItemNumber = setItemNumber;
        if (accountabilityId) params.accountabilityId = accountabilityId;
        if (setTag) params.setTag = setTag;
        if (storeName) params.storeName = storeName;
        if (itemId) params.itemId = itemId;
        if (queryTag) params.tag = queryTag;

        const res = await api.getSetHistory(params);
        setData(res);

        if (initialPartId && res.parts?.some((p) => p._id === initialPartId)) {
          setSelectedPartId(initialPartId);
          setActiveTab('parts');
        } else if (res.parts?.length > 0) {
          setSelectedPartId(res.parts[0]._id);
        }
      } catch (err) {
        console.error('Failed to load equipment history:', err);
        setError(err.message || 'Failed to load equipment and set history trail.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [setEquipmentTag, setItemNumber, accountabilityId, setTag, storeName, itemId, queryTag, initialPartId]);

  const setInfo = data?.setInfo || {};
  const parts = data?.parts || [];
  const timeline = data?.setTimeline || [];
  const summary = data?.summary || {};

  // Current page direct URL for barcode link and sharing
  const canonicalUrl = useMemo(() => {
    const identifier = setInfo.setEquipmentTag || setInfo.setItemNumber || queryTag || itemId || 'set';
    return `${window.location.origin}/history/set/${encodeURIComponent(identifier)}`;
  }, [setInfo, queryTag, itemId]);

  // Barcode encoding the live canonical history URL
  const barcodeImageUrl = useMemo(
    () => (canonicalUrl ? generateBarcodeDataUrl(canonicalUrl) : ''),
    [canonicalUrl]
  );

  // Selected part deep-dive
  const selectedPart = useMemo(() => {
    return parts.find((p) => p._id === selectedPartId) || parts[0];
  }, [parts, selectedPartId]);

  // Filtered parts list for sidebar selector
  const filteredParts = useMemo(() => {
    if (!partSearch.trim()) return parts;
    const q = partSearch.toLowerCase();
    return parts.filter(
      (p) =>
        p.itemDescription?.toLowerCase().includes(q) ||
        p.itemNumber?.toLowerCase().includes(q) ||
        p.assetTag?.toLowerCase().includes(q) ||
        p.serialNumber?.toLowerCase().includes(q) ||
        p.brandModel?.toLowerCase().includes(q)
    );
  }, [parts, partSearch]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(canonicalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getComponentIcon = (desc = '') => {
    const d = desc.toLowerCase();
    if (d.includes('laptop')) return <Laptop className="w-4 h-4 text-blue-600" />;
    if (d.includes('monitor') || d.includes('screen')) return <Monitor className="w-4 h-4 text-indigo-600" />;
    if (d.includes('system unit') || d.includes('cpu') || d.includes('dvr')) return <Cpu className="w-4 h-4 text-emerald-600" />;
    if (d.includes('printer')) return <Printer className="w-4 h-4 text-amber-600" />;
    if (d.includes('camera') || d.includes('cctv')) return <Video className="w-4 h-4 text-teal-600" />;
    if (d.includes('mouse')) return <Mouse className="w-4 h-4 text-slate-600" />;
    if (d.includes('keyboard')) return <Keyboard className="w-4 h-4 text-slate-600" />;
    return <Layers className="w-4 h-4 text-slate-500" />;
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Loading equipment history trail...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Unable to Load History Trail</span>
          </div>
          <p className="text-xs text-rose-700">{error || 'Equipment identifier not found.'}</p>
          <button
            onClick={() => navigate('/items')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
          >
            Go to Equipment Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Breadcrumb & Action Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium">History Trail</span>
          <span className="text-slate-300">/</span>
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            {setInfo.setEquipmentTag || setInfo.setItemNumber || 'SET'}
          </span>
          <span className="text-slate-300">&bull;</span>
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-extrabold text-xs shadow-2xs">
            <User className="w-3.5 h-3.5 text-amber-700" />
            <span>Holder: {setInfo.custodian || 'Store Custodian'}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition"
            title="Copy shareable link to this history trail"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied Link!' : 'Share Link'}</span>
          </button>

          {/* Printable Barcode Tag Modal Trigger */}
          <button
            type="button"
            onClick={() => setTagModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 shadow-2xs transition"
            title="Print physical Barcode equipment sticker"
          >
            <Barcode className="w-4 h-4 text-emerald-700" />
            <span>Print Equipment Tag</span>
          </button>

          {/* Print History Report */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
            title="Print this history report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print History Report</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-[#091024] via-[#0f1b38] to-[#14234b] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Top Badges */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Equipment History Trail
              </span>
              {setInfo.setItemNumber && (
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white font-bold border border-white/20">
                  {setInfo.setItemNumber}
                </span>
              )}
              {setInfo.setEquipmentTag && (
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-400/20 inline-flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{setInfo.setEquipmentTag}</span>
                </span>
              )}
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {setInfo.status || 'Assigned'}
              </span>
            </div>

            {/* Set Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {setInfo.setTag || 'Equipment Package'} History & Audit Trail
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Official hardware lifecycle tracking, serial specifications, and chain of custody.
              </p>
            </div>

            {/* Prominently Highlighted Current Holder Badge & Meta Details */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* Standout Current Holder Highlight Badge */}
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 px-4 py-2.5 rounded-2xl shadow-xl ring-4 ring-amber-400/25 border border-amber-300 font-black">
                <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-300 flex items-center justify-center font-black shadow-inner shrink-0">
                  <User className="w-4.5 h-4.5" />
                </div>
                <div className="leading-tight">
                  <div className="text-[9.5px] uppercase font-black tracking-widest text-slate-900/80">
                    Current Holder / Custodian
                  </div>
                  <div className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                    {setInfo.custodian || 'Store Custodian'}
                  </div>
                </div>
              </div>

              {/* Company, Department & Official Form Link */}
              <div className="flex items-center flex-wrap gap-2.5 text-xs text-slate-200 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15 backdrop-blur-xs">
                <div className="flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-blue-300" />
                  <span className="font-bold text-white">{setInfo.company || 'Chawnah Foods Inc.'}</span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-slate-300">{setInfo.department || 'Operations'}</span>
                </div>
                {setInfo.formNumber && (
                  <>
                    <span className="text-slate-500">|</span>
                    <Link
                      to={`/forms/${setInfo.recordId}`}
                      className="flex items-center space-x-1 font-mono text-amber-300 hover:text-amber-200 transition font-bold"
                      title="View official accountability form document"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Form: {setInfo.formNumber}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Digital Passport / Barcode Link Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center space-x-3 shrink-0 shadow-lg">
            <div className="space-y-1.5 text-left text-xs">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 block">
                Digital Passport &bull; Barcode Link
              </span>
              <p className="text-[11px] text-slate-200 max-w-[240px] leading-tight font-medium">
                Scan or click barcode to open this live history trail anytime.
              </p>
              {barcodeImageUrl && (
                <div className="pt-1">
                  <div
                    onClick={handleCopyLink}
                    title="Click to copy history trail link"
                    className="bg-white p-2 rounded-xl shadow-xs text-center border border-white/20 hover:ring-2 hover:ring-emerald-400 transition cursor-pointer"
                  >
                    <img src={barcodeImageUrl} alt="Barcode Link" className="h-11 w-auto object-contain max-w-[250px] mx-auto" />
                    <span className="block font-mono text-[8px] text-slate-800 font-bold truncate max-w-[240px] mx-auto mt-0.5">
                      {canonicalUrl}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stat Cards Strip */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-white">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Components</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{summary.totalParts || parts.length} Units</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Operational</span>
            <span className="text-xl font-extrabold text-emerald-300 mt-0.5 block">{summary.activeParts || parts.length} Units</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">In Servicing</span>
            <span className="text-xl font-extrabold text-amber-300 mt-0.5 block">{summary.maintenanceParts || 0} Units</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Returned / Swapped</span>
            <span className="text-xl font-extrabold text-slate-300 mt-0.5 block">{summary.returnedParts || 0} Units</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="no-print flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'timeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Whole Set Lifecycle Timeline ({timeline.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('parts')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'parts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Component Parts Audit Trail & Specs ({parts.length})</span>
        </button>
      </div>

      {/* TAB 1: WHOLE SET TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  <span>Chronological Lifecycle Trail for {setInfo.setTag || 'Set'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unified chronological record of set deployment, maintenance, part swaps, and returns.
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold">
                {timeline.length} Recorded Events
              </span>
            </div>

            {timeline.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">No lifecycle events recorded yet.</p>
                <p className="text-xs">Events will populate automatically upon maintenance and return inspections.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {timeline.map((ev, idx) => {
                  const isIssuance = ev.eventType === 'SET_ISSUED' || ev.eventType === 'ITEM_REGISTERED';
                  const isMaintenance = ev.eventType === 'PART_MAINTENANCE' || ev.eventType === 'PART_REPLACEMENT';
                  const isSwap = ev.eventType === 'WHOLE_UNIT_REPLACED';

                  return (
                    <div key={ev.eventId || idx} className="relative group">
                      {/* Timeline Node Bullet */}
                      <div
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                          isIssuance
                            ? 'border-emerald-500 text-emerald-600'
                            : isMaintenance
                            ? 'border-blue-500 text-blue-600'
                            : isSwap
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-amber-500 text-amber-600'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isIssuance
                              ? 'bg-emerald-500'
                              : isMaintenance
                              ? 'bg-blue-500'
                              : isSwap
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      </div>

                      {/* Event Card */}
                      <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/80 p-5 transition space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isIssuance
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isMaintenance
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : isSwap
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {ev.badgeText || 'Lifecycle Event'}
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm">{ev.title}</h3>
                          </div>

                          <div className="flex items-center space-x-1.5 text-xs text-slate-500 shrink-0 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {ev.date
                                ? new Date(ev.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '—'}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>

                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <div className="flex items-center space-x-2">
                            <span>Specialist / Actor:</span>
                            <strong className="text-slate-700">{ev.actor || 'IT Department'}</strong>
                          </div>

                          {ev.formNumber && (
                            <Link
                              to={`/forms/${ev.recordId}`}
                              className="font-mono text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center space-x-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Ref: {ev.formNumber} &rarr;</span>
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
      )}

      {/* TAB 2: COMPONENT PARTS AUDIT TRAIL */}
      {activeTab === 'parts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Parts Selector */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Parts In This Set ({parts.length})
              </span>
              <span className="text-[11px] font-mono text-slate-400">Click to inspect</span>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                placeholder="Search component or serial..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Parts List */}
            <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredParts.map((p) => {
                const isSelected = p._id === selectedPart?._id;
                return (
                  <div
                    key={p._id}
                    onClick={() => setSelectedPartId(p._id)}
                    className={`p-3 rounded-xl cursor-pointer transition border text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                        {getComponentIcon(p.itemDescription || p.category)}
                      </div>
                      <div className="truncate">
                        <div className="truncate font-semibold">{p.itemDescription || 'Hardware Unit'}</div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {p.itemNumber} &bull; {p.serialNumber || 'No S/N'}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Dive for Selected Part */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
            {selectedPart ? (
              <>
                {/* Part Header & Quick Actions */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {selectedPart.category || 'Component'}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                        Condition: {selectedPart.currentCondition || 'Good'}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-bold">
                        {selectedPart.status}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">{selectedPart.itemDescription}</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedPart.brandModel && selectedPart.brandModel !== 'N/A'
                        ? selectedPart.brandModel
                        : 'Standard Hardware'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Link
                      to={`/items/${selectedPart._id}`}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-2xs transition inline-flex items-center space-x-1"
                      title="Open full item catalog details"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Item Details</span>
                    </Link>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Item Code</span>
                    <span className="font-mono text-xs font-extrabold text-slate-800 mt-0.5 block">
                      {selectedPart.itemNumber}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Asset Tag</span>
                    <span className="font-mono text-xs font-extrabold text-slate-800 mt-0.5 block">
                      {selectedPart.assetTag}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Serial Number</span>
                    <span className="font-mono text-xs font-extrabold text-slate-800 mt-0.5 block truncate">
                      {selectedPart.serialNumber}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Category</span>
                    <span className="text-xs font-extrabold text-slate-800 mt-0.5 block truncate">
                      {selectedPart.category}
                    </span>
                  </div>
                </div>

                {/* Sub-components (if any) */}
                {selectedPart.installedComponents && selectedPart.installedComponents.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Installed Sub-Components & Accessories</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedPart.installedComponents.map((comp, cIdx) => (
                        <div key={cIdx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{comp.componentType || 'Part'}</span>
                            <span className="text-slate-400 text-[11px] block">{comp.specifications || 'Standard'}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {comp.serialNumber || 'No S/N'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Part Maintenance & Replacement Logs */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>Part Maintenance & Replacement Logs</span>
                  </h3>

                  {selectedPart.maintenanceHistory && selectedPart.maintenanceHistory.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPart.maintenanceHistory.map((m, mIdx) => (
                        <div key={mIdx} className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-amber-900">
                            <span>{m.actionType || 'Part Replacement'}</span>
                            <span className="font-mono text-[10px] text-amber-700">
                              {m.date ? new Date(m.date).toLocaleDateString() : '—'}
                            </span>
                          </div>
                          <p className="text-slate-600">{m.notes || 'Component serviced and verified.'}</p>
                          <div className="text-[10px] text-slate-400">Performed By: {m.performedBy || 'IT Specialist'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      No maintenance, repairs, or part replacements logged for this unit. Condition verified upon issuance.
                    </div>
                  )}
                </div>

                {/* Part Custody Trail & Events */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Part Custody Trail & Events</span>
                  </h3>

                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
                    {/* Issuance Entry */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>Issued with Package</span>
                        <span className="font-mono text-slate-400">
                          {selectedPart.dateIssued ? new Date(selectedPart.dateIssued).toLocaleDateString() : 'Initial Deployment'}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        Initially deployed under custody of{' '}
                        <strong className="text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-extrabold">
                          {setInfo.custodian || 'Custodian'}
                        </strong>.
                      </p>
                    </div>

                    {/* Timeline events */}
                    {selectedPart.timelineEvents &&
                      selectedPart.timelineEvents.map((te, teIdx) => (
                        <div key={teIdx} className="p-3 bg-slate-50/60 space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{te.action?.replace(/_/g, ' ') || 'Audit Log'}</span>
                            <span className="font-mono text-slate-400 text-[10px]">
                              {te.date ? new Date(te.date).toLocaleDateString() : '—'}
                            </span>
                          </div>
                          <p className="text-slate-600">{te.remarks || 'Status logged in system.'}</p>
                          <div className="text-[10px] text-slate-400">Recorded By: {te.performedBy || 'System'}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>Select a component part from the left list to inspect its history.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Barcode Asset Tag Modal (for physical label printing) */}
      <AssetTagModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        group={setInfo.setTag ? { ...setInfo, items: parts } : null}
        item={selectedPart}
      />
    </div>
  );
}
