import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Clock,
  Layers,
  Tag,
  Barcode,
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
  Printer,
  Video,
  Cpu,
  Mouse,
  Keyboard,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function SetHistoryModal({
  isOpen,
  onClose,
  setEquipmentTag,
  setItemNumber,
  accountabilityId,
  setTag,
  storeName,
  initialPartId = null,
  onOpenTagModal = null,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('setTimeline'); // 'setTimeline' | 'partsHistory'
  const [selectedPartId, setSelectedPartId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setError(null);
      return;
    }

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

        const res = await api.getSetHistory(params);
        setData(res);

        if (initialPartId && res.parts?.some((p) => p._id === initialPartId)) {
          setSelectedPartId(initialPartId);
          setActiveTab('partsHistory');
        } else if (res.parts?.length > 0) {
          setSelectedPartId(res.parts[0]._id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load set history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, setEquipmentTag, setItemNumber, accountabilityId, setTag, storeName, initialPartId]);

  if (!isOpen) return null;

  const setInfo = data?.setInfo || {};
  const parts = data?.parts || [];
  const timeline = data?.setTimeline || [];
  const summary = data?.summary || {};

  const selectedPart = parts.find((p) => p._id === selectedPartId) || parts[0];

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-start justify-between relative">
          <div className="space-y-1.5 pr-8">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Equipment Set Lifecycle & History
              </span>
              {setInfo.setItemNumber && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold border border-white/20">
                  {setInfo.setItemNumber}
                </span>
              )}
              {setInfo.setEquipmentTag && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-400/20 inline-flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-emerald-400" />
                  <span>{setInfo.setEquipmentTag}</span>
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>{setInfo.setTag || 'Equipment Package'} History</span>
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <span className="inline-flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-white">{setInfo.custodian || 'Custodian'}</span>
              </span>
              <span>•</span>
              <span className="text-slate-300">{setInfo.department || 'Operations'}</span>
              <span>•</span>
              <span className="text-slate-300">{setInfo.company || 'Chawnah Foods Inc.'}</span>
              {setInfo.formNumber && (
                <>
                  <span>•</span>
                  <span className="font-mono text-amber-300 font-medium">
                    Form: {setInfo.formNumber}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Quick Summary Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center space-x-4">
            <span className="text-slate-600">
              Total Parts: <strong className="text-slate-900 font-bold">{summary.totalParts || parts.length}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 inline-flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Operational: <strong>{summary.activePartsCount ?? parts.length}</strong></span>
            </span>
            {summary.replacedPartsCount > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-amber-700 inline-flex items-center space-x-1">
                  <Wrench className="w-3.5 h-3.5 text-amber-500" />
                  <span>Serviced / Replaced: <strong>{summary.replacedPartsCount}</strong></span>
                </span>
              </>
            )}
            {summary.returnedPartsCount > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-indigo-700 inline-flex items-center space-x-1">
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Returned: <strong>{summary.returnedPartsCount}</strong></span>
                </span>
              </>
            )}
          </div>

          {/* Action Tabs */}
          <div className="flex items-center space-x-1 bg-slate-200/80 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('setTimeline')}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition flex items-center space-x-1.5 ${
                activeTab === 'setTimeline'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Whole Set Timeline ({timeline.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('partsHistory')}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition flex items-center space-x-1.5 ${
                activeTab === 'partsHistory'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>History by Part ({parts.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-slate-700">Loading equipment set history...</p>
              <p className="text-xs text-slate-400">Aggregating custody logs, part replacements, and component audits</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-red-700">{error}</p>
              <p className="text-xs text-red-500">Could not retrieve history for this equipment set.</p>
            </div>
          ) : activeTab === 'setTimeline' ? (
            /* TAB 1: WHOLE SET TIMELINE */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span>Chronological Lifecycle Trail for {setInfo.setTag}</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unified audit timeline of set deployment, maintenance, part replacements, and returns.
                  </p>
                </div>
              </div>

              {timeline.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
                  No lifecycle events recorded for this set yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {timeline.map((evt, idx) => {
                    const isIssuance = evt.eventType === 'SET_ISSUED';
                    const isMaint = evt.eventType === 'PART_MAINTENANCE' || evt.eventType === 'PART_REPLACEMENT';
                    const isSwap = evt.eventType === 'WHOLE_UNIT_REPLACED';
                    const isReturn = evt.eventType === 'SET_RETURNED' || evt.eventType === 'SET_PARTIALLY_RETURNED';

                    let dotBg = 'bg-emerald-500 ring-emerald-100';
                    let badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    let IconComponent = CheckCircle2;

                    if (isMaint) {
                      dotBg = 'bg-blue-500 ring-blue-100';
                      badgeBg = 'bg-blue-50 text-blue-800 border-blue-200';
                      IconComponent = Wrench;
                    } else if (isSwap) {
                      dotBg = 'bg-amber-500 ring-amber-100';
                      badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
                      IconComponent = RefreshCw;
                    } else if (isReturn) {
                      dotBg = 'bg-purple-500 ring-purple-100';
                      badgeBg = 'bg-purple-50 text-purple-800 border-purple-200';
                      IconComponent = RotateCcw;
                    }

                    return (
                      <div key={evt.eventId || idx} className="relative group">
                        {/* Timeline Node Icon */}
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full ${dotBg} ring-4 flex items-center justify-center text-white shadow-xs`}
                        >
                          <IconComponent className="w-2.5 h-2.5" />
                        </div>

                        {/* Event Content Card */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeBg}`}>
                                {evt.badgeText || evt.eventType}
                              </span>
                              <h5 className="font-bold text-slate-800 text-sm">{evt.title}</h5>
                            </div>
                            <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(evt.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>

                          {/* Extra Event Details */}
                          {evt.oldComponent && evt.newComponent && (
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              <div>
                                <span className="font-semibold text-slate-500 uppercase text-[10px] block">Old Component Removed:</span>
                                <span className="font-mono text-slate-800">{evt.oldComponent.itemNumber || evt.oldComponent.serialNumber || 'N/A'}</span>
                                <span className="text-slate-400 text-[11px] block">{evt.oldComponent.description} ({evt.oldComponent.disposition || 'Replaced'})</span>
                              </div>
                              <div>
                                <span className="font-semibold text-emerald-600 uppercase text-[10px] block">New Component Installed:</span>
                                <span className="font-mono text-emerald-800 font-bold">{evt.newComponent.itemNumber || evt.newComponent.serialNumber || 'N/A'}</span>
                                <span className="text-slate-600 text-[11px] block">{evt.newComponent.description}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                            <span>
                              Specialist / Actor: <strong className="text-slate-600">{evt.actor || 'IT Custodian'}</strong>
                            </span>
                            {evt.formNumber && (
                              <Link
                                to={`/forms`}
                                className="text-emerald-700 hover:text-emerald-900 font-semibold font-mono inline-flex items-center space-x-1"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Ref: {evt.formNumber}</span>
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
          ) : (
            /* TAB 2: HISTORY BY COMPONENT PART */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left Column: Component Part Selector List (4 cols) */}
              <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
                  <span>Parts in this Set</span>
                  <span>{parts.length} Units</span>
                </div>

                <div className="space-y-1.5">
                  {parts.map((p) => {
                    const isSelected = p._id === selectedPart?._id;
                    const hasMaintenance = p.maintenanceHistory?.length > 0;

                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => setSelectedPartId(p._id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white/60 hover:bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                            {getComponentIcon(p.itemDescription)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-800 truncate">{p.itemDescription}</div>
                            <div className="font-mono text-[10px] text-slate-500 truncate">{p.itemNumber || p.assetTag}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {hasMaintenance && (
                            <span className="p-1 rounded bg-amber-50 text-amber-700" title="Has maintenance history">
                              <Wrench className="w-3 h-3" />
                            </span>
                          )}
                          <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-300'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Part Deep Lifecycle Details (8 cols) */}
              <div className="md:col-span-8 space-y-4">
                {selectedPart ? (
                  <div className="space-y-4">
                    {/* Part Header Card */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {selectedPart.equipmentType || selectedPart.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                selectedPart.currentCondition === 'Good' || selectedPart.currentCondition === 'New'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              Condition: {selectedPart.currentCondition}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              {selectedPart.status}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                            <span>{selectedPart.itemDescription}</span>
                          </h4>
                          <p className="text-xs text-slate-500">{selectedPart.brandModel || 'Standard Business Hardware'}</p>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {onOpenTagModal && (
                            <button
                              type="button"
                              onClick={() => onOpenTagModal(selectedPart)}
                              title="Print Barcode Tag for this Part"
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition"
                            >
                              <Barcode className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            to={`/items/${selectedPart._id}`}
                            title="View Complete Item Record"
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition inline-flex items-center"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>

                      {/* Part Specifications & Serial Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Item Code</span>
                          <span className="font-mono font-bold text-slate-800">{selectedPart.itemNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Asset Tag</span>
                          <span className="font-mono font-semibold text-slate-800">{selectedPart.assetTag}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Serial Number</span>
                          <span className="font-mono text-slate-800">{selectedPart.serialNumber || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                          <span className="text-slate-700 truncate block">{selectedPart.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Installed Sub-components (e.g. Battery in UPS, RAM/SSD in CPU) */}
                    {selectedPart.installedComponents?.length > 0 && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span>Installed Sub-components ({selectedPart.installedComponents.length})</span>
                        </h5>
                        <div className="space-y-1.5">
                          {selectedPart.installedComponents.map((comp, cIdx) => (
                            <div key={cIdx} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-800">{comp.itemDescription || comp.componentType}</span>
                                <span className="text-slate-400 font-mono text-[11px] block">SN: {comp.serialNumber || 'OEM'}</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                Installed
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Maintenance & Replacement History for this Part */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                      <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                        <Wrench className="w-4 h-4 text-amber-600" />
                        <span>Part Maintenance & Replacement Logs</span>
                      </h5>

                      {(!selectedPart.maintenanceHistory || selectedPart.maintenanceHistory.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">
                          No maintenance, repairs, or part replacements logged for this unit. Condition verified upon issuance.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedPart.maintenanceHistory.map((m, mIdx) => (
                            <div key={mIdx} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-amber-900">{m.actionType || 'Component Replacement'}</span>
                                <span className="font-mono text-slate-400 text-[11px]">
                                  {m.date ? new Date(m.date).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700">{m.notes || 'Service performed.'}</p>
                              {m.oldComponent && (
                                <div className="text-[11px] text-slate-500">
                                  Replaced: <strong className="text-slate-700">{m.oldComponent.description}</strong> ({m.oldComponent.disposition || 'Replaced'})
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 text-right">
                                Performed by: {m.performedBy || 'IT Specialist'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Individual Part Audit Timeline */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                      <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>Part Custody Trail & Events</span>
                      </h5>

                      {(!selectedPart.timelineEvents || selectedPart.timelineEvents.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">No custody events recorded.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedPart.timelineEvents.map((evt, eIdx) => (
                            <div key={eIdx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{evt.action || 'Assigned'}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {evt.date ? new Date(evt.date).toLocaleDateString() : ''}
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px]">{evt.remarks || 'Issued to custodian'}</p>
                              <div className="text-[10px] text-slate-400">
                                Custodian: {evt.employeeName || 'Staff'} {evt.formNumber ? `(Form: ${evt.formNumber})` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                    Select a component part from the left list to view its complete specifications and maintenance history.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Complete audit trail recorded in compliance with CFI IT asset policies.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}

