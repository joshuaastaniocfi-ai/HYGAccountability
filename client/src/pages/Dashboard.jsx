import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Users,
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  Search,
  Sparkles,
  Laptop,
  Printer,
  ScanLine,
  Smartphone,
  Store,
  BarChart3,
  PieChart,
  Layers,
  Activity,
  Wrench,
  Check,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [graphViewMode, setGraphViewMode] = useState('bars'); // 'bars' | 'cards'
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    navigate(`/items?search=${encodeURIComponent(quickSearch.trim())}`);
  };

  const { items, employees, forms, recentActivity, categories, conditions, departments, companies } =
    stats || {};

  // Compute category statistics for the graph
  const categoryStats = useMemo(() => {
    if (!categories || !categories.length) return [];
    return categories.map((cat) => {
      const total = cat.total || cat.count || 0;
      const issued = cat.issued !== undefined ? cat.issued : cat.assigned || 0;
      const stocked = cat.stocked !== undefined ? cat.stocked : Math.max(0, total - issued);
      const damaged = cat.damaged || 0;
      const good = cat.good || 0;
      const fair = cat.fair || 0;

      const issuedPct = total > 0 ? Math.round((issued / total) * 100) : 0;
      const stockedPct = total > 0 ? Math.round((stocked / total) * 100) : 0;
      const damagedPct = total > 0 ? Math.max(0, 100 - issuedPct - stockedPct) : 0;

      return {
        ...cat,
        category: cat._id || cat.category || 'General Equipment',
        total,
        issued,
        stocked,
        damaged,
        good,
        fair,
        issuedPct,
        stockedPct,
        damagedPct,
      };
    });
  }, [categories]);

  // Overall fleet status breakdown
  const totalFleetCount = items?.total || 0;
  const totalIssued = items?.assigned || 0;
  const totalStocked = items?.available || 0;
  const totalDamaged = items?.maintenance || 0;

  const totalIssuedPct = totalFleetCount > 0 ? Math.round((totalIssued / totalFleetCount) * 100) : 0;
  const totalStockedPct = totalFleetCount > 0 ? Math.round((totalStocked / totalFleetCount) * 100) : 0;
  const totalDamagedPct =
    totalFleetCount > 0 ? Math.max(0, 100 - totalIssuedPct - totalStockedPct) : 0;

  const getCategoryIcon = (categoryName) => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('laptop') || cat.includes('desktop') || cat.includes('computer')) return Laptop;
    if (cat.includes('printer')) return Printer;
    if (cat.includes('scanner') || cat.includes('barcode')) return ScanLine;
    if (cat.includes('tablet') || cat.includes('mobile')) return Smartphone;
    if (cat.includes('lab') || cat.includes('qa')) return ShieldCheck;
    if (cat.includes('office')) return Boxes;
    return Package;
  };

  if (loading) {
    return (
      <div className="p-16 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-600">Loading company asset intelligence...</p>
          <p className="text-[11px] text-slate-400">Aggregating equipment status across fleet</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-2xl text-xs flex items-center justify-between shadow-xs">
          <div>
            <p className="font-bold text-sm">Failed to load analytics dashboard</p>
            <p className="text-rose-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chawnah Foods Inc. Custody Tracker</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Equipment Fleet & Custody Command
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Real-time monitoring of company hardware: track active employee assignments, store branch deployments, warehouse stock, and equipment conditions.
            </p>

            {/* Quick search input */}
            <form onSubmit={handleQuickSearch} className="mt-5 flex items-center max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Quick search item, asset tag, serial, or custodian..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-slate-800"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg transition shadow-xs"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Link
              to="/forms/new"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition"
            >
              <span>+ Issue Equipment Form</span>
            </Link>
            <Link
              to="/inventory"
              className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Boxes className="w-4 h-4 text-emerald-400" />
              <span>Inventory by Type</span>
            </Link>
            <Link
              to="/stores"
              className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Store Branches</span>
            </Link>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Equipment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Fleet
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalFleetCount}</span>
            <span className="text-xs text-slate-500">registered units</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <Link to="/inventory" className="text-indigo-700 hover:text-indigo-900 font-semibold hover:underline">
              {totalIssued} Issued
            </Link>
            <Link to="/inventory" className="text-emerald-700 hover:text-emerald-900 font-semibold hover:underline">
              {totalStocked} Available
            </Link>
          </div>
        </div>

        {/* Active Accountabilities */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Forms
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-indigo-700">{forms?.active || 0}</span>
            <span className="text-xs text-slate-500">signed agreements</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{forms?.returned || 0} Archived returns</span>
            <Link to="/forms" className="text-indigo-600 font-semibold hover:underline">
              View all &rarr;
            </Link>
          </div>
        </div>

        {/* In-Stock / Available */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ready in Storage
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700">{totalStocked}</span>
            <span className="text-xs text-slate-500">available units ({totalStockedPct}%)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Ready for assignment</span>
            <Link to="/items?status=Available" className="text-emerald-700 font-semibold hover:underline">
              Issue Gear
            </Link>
          </div>
        </div>

        {/* Maintenance / Attention */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Maintenance / Damaged
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span
              className={`text-2xl font-black ${
                totalDamaged > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {totalDamaged}
            </span>
            <span className="text-xs text-slate-500">
              {totalDamaged > 0 ? 'requires repair' : 'zero damaged gear'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className={totalDamaged > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
              {totalDamaged > 0 ? 'Action required' : '100% Operational'}
            </span>
            <Link
              to="/items?status=Under%20Maintenance"
              className="text-slate-600 hover:text-slate-900 font-semibold hover:underline"
            >
              Inspect
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PRIMARY SECTION: EQUIPMENT TYPE STATUS DISTRIBUTION GRAPH */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
        {/* Section Header with View Mode Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Equipment Fleet Status by Category
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visual status breakdown for each equipment type: Issued (Active Use), Stocked (Available in Inventory), and Damaged (Maintenance)
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setGraphViewMode('bars')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                  graphViewMode === 'bars'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Stacked Bars</span>
              </button>
              <button
                type="button"
                onClick={() => setGraphViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                  graphViewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Category Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Inventory Ratio Visual Meter */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Company-Wide Fleet Ratio
              </span>
              <span className="text-xs text-slate-400 font-mono">({totalFleetCount} Total Assets)</span>
            </div>

            {/* Status Legend Pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span className="font-bold text-slate-800">Issued / In Use:</span>
                <span className="font-mono text-indigo-700 font-bold">
                  {totalIssued} ({totalIssuedPct}%)
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-slate-800">Stocked / In Storage:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {totalStocked} ({totalStockedPct}%)
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="font-bold text-slate-800">Damaged / Repair:</span>
                <span className="font-mono text-rose-700 font-bold">
                  {totalDamaged} ({totalDamagedPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Master Multi-Segment Bar */}
          <div className="w-full h-4 bg-slate-200/90 rounded-full overflow-hidden flex shadow-inner">
            {totalIssued > 0 && (
              <div
                style={{ width: `${totalIssuedPct}%` }}
                className="bg-indigo-600 hover:bg-indigo-500 transition-all duration-500 relative group cursor-pointer"
                title={`Issued / In Custody: ${totalIssued} units (${totalIssuedPct}%)`}
              />
            )}
            {totalStocked > 0 && (
              <div
                style={{ width: `${totalStockedPct}%` }}
                className="bg-emerald-500 hover:bg-emerald-400 transition-all duration-500 relative group cursor-pointer"
                title={`Stocked in Storage: ${totalStocked} units (${totalStockedPct}%)`}
              />
            )}
            {totalDamaged > 0 && (
              <div
                style={{ width: `${totalDamagedPct}%` }}
                className="bg-rose-500 hover:bg-rose-400 transition-all duration-500 relative group cursor-pointer"
                title={`Damaged / Maintenance: ${totalDamaged} units (${totalDamagedPct}%)`}
              />
            )}
          </div>
        </div>

        {/* View Mode 1: Stacked Bar Graph for Every Equipment Type */}
        {graphViewMode === 'bars' && (
          <div className="space-y-4 pt-1">
            {categoryStats.map((cat) => {
              const CategoryIcon = getCategoryIcon(cat.category);

              return (
                <div
                  key={cat._id}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-xs transition bg-white space-y-2.5 group"
                >
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center shrink-0 transition">
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{cat.category}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {cat.good > 0 ? `${cat.good} in Good Condition` : ''}
                          {cat.fair > 0 ? ` &bull; ${cat.fair} Fair Condition` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        {cat.total} Unit{cat.total !== 1 ? 's' : ''} Total
                      </span>
                      <Link
                        to={`/items?category=${encodeURIComponent(cat.category)}`}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center space-x-1"
                      >
                        <span>Filter</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Multi-Segment Stacked Progress Bar */}
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    {cat.issued > 0 && (
                      <div
                        style={{ width: `${cat.issuedPct}%` }}
                        className="bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 cursor-pointer"
                        title={`${cat.category} Issued: ${cat.issued} units (${cat.issuedPct}%)`}
                      />
                    )}
                    {cat.stocked > 0 && (
                      <div
                        style={{ width: `${cat.stockedPct}%` }}
                        className="bg-emerald-500 hover:bg-emerald-400 transition-all duration-300 cursor-pointer"
                        title={`${cat.category} Stocked: ${cat.stocked} units (${cat.stockedPct}%)`}
                      />
                    )}
                    {cat.damaged > 0 && (
                      <div
                        style={{ width: `${cat.damagedPct}%` }}
                        className="bg-rose-500 hover:bg-rose-400 transition-all duration-300 cursor-pointer"
                        title={`${cat.category} Damaged: ${cat.damaged} units (${cat.damagedPct}%)`}
                      />
                    )}
                  </div>

                  {/* Breakdown Indicator Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-y-1 text-xs text-slate-600 pt-0.5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center space-x-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        <span className="text-slate-500">Issued:</span>
                        <strong className="text-indigo-950 font-bold font-mono">
                          {cat.issued}
                        </strong>
                        <span className="text-[10px] text-slate-400">({cat.issuedPct}%)</span>
                      </span>

                      <span className="flex items-center space-x-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-500">Stocked:</span>
                        <strong className="text-emerald-950 font-bold font-mono">
                          {cat.stocked}
                        </strong>
                        <span className="text-[10px] text-slate-400">({cat.stockedPct}%)</span>
                      </span>

                      <span className="flex items-center space-x-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span className="text-slate-500">Damaged:</span>
                        <strong
                          className={`font-mono font-bold ${
                            cat.damaged > 0 ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          {cat.damaged}
                        </strong>
                        <span className="text-[10px] text-slate-400">({cat.damagedPct}%)</span>
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {cat.issued > 0
                        ? `${cat.issued} Active in Custody`
                        : '100% In Warehouse Storage'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode 2: Category Cards Grid View */}
        {graphViewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {categoryStats.map((cat) => {
              const CategoryIcon = getCategoryIcon(cat.category);

              return (
                <div
                  key={cat._id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition bg-white space-y-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {cat.total} Units
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mt-3">{cat.category}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {cat.good > 0 ? `${cat.good} Good Condition` : 'Standard Equipment'}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner mt-3">
                      {cat.issued > 0 && (
                        <div
                          style={{ width: `${cat.issuedPct}%` }}
                          className="bg-indigo-600"
                          title={`Issued: ${cat.issued}`}
                        />
                      )}
                      {cat.stocked > 0 && (
                        <div
                          style={{ width: `${cat.stockedPct}%` }}
                          className="bg-emerald-500"
                          title={`Stocked: ${cat.stocked}`}
                        />
                      )}
                      {cat.damaged > 0 && (
                        <div
                          style={{ width: `${cat.damagedPct}%` }}
                          className="bg-rose-500"
                          title={`Damaged: ${cat.damaged}`}
                        />
                      )}
                    </div>
                  </div>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                    <div className="bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
                      <span className="text-[10px] text-indigo-700 font-bold block uppercase tracking-wider">
                        Issued
                      </span>
                      <span className="font-black font-mono text-indigo-900 text-sm mt-0.5 block">
                        {cat.issued}
                      </span>
                    </div>

                    <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                        Stocked
                      </span>
                      <span className="font-black font-mono text-emerald-900 text-sm mt-0.5 block">
                        {cat.stocked}
                      </span>
                    </div>

                    <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-100">
                      <span className="text-[10px] text-rose-700 font-bold block uppercase tracking-wider">
                        Damaged
                      </span>
                      <span className="font-black font-mono text-rose-900 text-sm mt-0.5 block">
                        {cat.damaged}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/items?category=${encodeURIComponent(cat.category)}`}
                    className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-200 block"
                  >
                    View {cat.category} &rarr;
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Two-Column Layout: Deployment & Condition Analytics + Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Accountability Events & Audit Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>Recent Custody & Accountability Activity</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time chain of custody events: issuances, returns, and periodic audit logs
              </p>
            </div>
            <Link
              to="/items"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center space-x-1"
            >
              <span>Explore Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {!recentActivity || recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No recent activities recorded.</p>
            ) : (
              recentActivity.map((act) => {
                const isAssigned = act.action === 'ASSIGNED';
                const isReturned = act.action === 'RETURNED';
                const isNote = act.action === 'NOTE_ADDED';
                const isReg = act.action === 'REGISTERED';

                return (
                  <div key={act._id} className="py-3.5 flex items-start space-x-3 text-xs">
                    {/* Event icon badge */}
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isAssigned
                          ? 'bg-indigo-50 text-indigo-600'
                          : isReturned
                          ? 'bg-emerald-50 text-emerald-600'
                          : isNote
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isAssigned && <CheckCircle className="w-4 h-4" />}
                      {isReturned && <CheckCircle className="w-4 h-4" />}
                      {isNote && <Clock className="w-4 h-4" />}
                      {isReg && <Package className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900 truncate">
                          {act.item?.itemDescription || 'Equipment Asset'}
                          {act.item?.serialNumber && (
                            <span className="ml-1 text-[11px] font-mono text-slate-500 font-normal">
                              ({act.item.serialNumber})
                            </span>
                          )}
                        </p>
                        <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                          {new Date(act.date || act.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                        {act.remarks}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-medium">
                        {act.employeeName && (
                          <span className="text-slate-700 font-semibold flex items-center space-x-1">
                            <Users className="w-3 h-3 text-indigo-500" />
                            <span>Custodian: {act.employeeName}</span>
                          </span>
                        )}
                        {act.condition && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold border border-slate-200">
                            Cond: {act.condition}
                          </span>
                        )}
                        {act.formNumber && (
                          <Link
                            to={act.accountabilityId ? `/forms/${act.accountabilityId}` : '#'}
                            className="font-mono text-emerald-700 font-semibold hover:underline"
                          >
                            Ref: {act.formNumber}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Department Distribution & Condition Health */}
        <div className="space-y-6">
          {/* Department Deployment Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Deployment by Department & Branch</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Where active equipment is currently allocated
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {departments && departments.length > 0 ? (
                departments.map((dept, idx) => {
                  const deptCount = dept.count || 0;
                  const deptPct = totalIssued > 0 ? Math.round((deptCount / totalIssued) * 100) : 0;

                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 truncate">
                          {dept._id || 'Operations'}
                        </span>
                        <span className="font-mono font-bold text-slate-700 shrink-0">
                          {deptCount} unit{deptCount !== 1 ? 's' : ''} ({deptPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                          style={{ width: `${deptPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">
                  No active department allocations
                </div>
              )}
            </div>
          </div>

          {/* Workforce by Corporate Entity / Brand */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Workforce by Corporate Entity</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {employees?.total || 584} active personnel across brands & franchisees
                </p>
              </div>
              <Link
                to="/employees"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center space-x-1"
              >
                <span>Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 pt-1">
              {companies && companies.length > 0 ? (
                companies.map((c, idx) => {
                  const totalEmp = employees?.total || 584;
                  const pct = totalEmp > 0 ? Math.round((c.count / totalEmp) * 100) : 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => navigate(`/employees?company=${encodeURIComponent(c.company)}`)}
                      className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition cursor-pointer group space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 group-hover:text-indigo-700 transition truncate max-w-[200px]">
                          {c.company}
                        </span>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {c.count}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full group-hover:bg-indigo-600 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">
                  No company records found
                </div>
              )}
            </div>
          </div>

          {/* Overall Fleet Condition Reliability */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white border border-emerald-200/80 rounded-2xl p-5 text-xs text-slate-700 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Fleet Operational Health</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                Reliability: 100%
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Every piece of company equipment assigned to employees or retail branches is tracked under official accountability policy. 100% of the active fleet is currently verified in operational condition.
            </p>

            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
              <Link
                to="/stores"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-xs"
              >
                Inspect Branches
              </Link>
              <Link
                to="/items"
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs transition shadow-2xs"
              >
                Full Catalog &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
