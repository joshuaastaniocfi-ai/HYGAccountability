import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  FilePlus,
  Search,
  Filter,
  Printer,
  ChevronRight,
  Package,
  Calendar,
  User,
  Download,
  ChevronDown,
  X,
  Store,
} from 'lucide-react';
import { api } from '../services/api';
import { exportToCsv } from '../utils/exportCsv';

export default function AccountabilityFormsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const navigate = useNavigate();

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await api.getAccountabilities({
        search,
        status: statusFilter,
        brand: brandFilter,
      });
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter, brandFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleExportCsv = () => {
    const exportData = records.map((r) => ({
      'Form Number': r.formNumber,
      'Accountability Type': r.accountabilityType || 'Individual',
      'Assigned Target': r.storeName ? `Store: ${r.storeName}` : r.targetGroup || 'Individual',
      'Custodian Name': r.employeeInfo?.name || '',
      'Custodian ID': r.employeeInfo?.employeeId || '',
      'Department': r.employeeInfo?.department || '',
      'Position': r.employeeInfo?.jobTitle || '',
      'Items Count': r.items?.length || 0,
      'Equipment List': r.items?.map((i) => `${i.itemDescription} (${i.serialNumber})`).join('; ') || '',
      'Status': r.status,
      'Date Released': r.issuance?.date ? new Date(r.issuance.date).toLocaleDateString() : '',
      'Released By': r.issuance?.releasedBy || '',
      'Approved By': r.issuance?.approvedBy || '',
    }));
    exportToCsv(`Chawnah_Accountability_Forms_${new Date().toISOString().split('T')[0]}.csv`, exportData);
  };

  const statuses = ['All', 'Active', 'Partially Returned', 'Returned'];
  const brands = ['All', 'Goldilocks', 'DU99', 'Taters', 'Icebergs', 'Savore', 'Chatime'];

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Form #, employee, store, serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium"
          >
            Find
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Brand Filter Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className={`pl-3 pr-8 py-2 rounded-lg text-xs font-semibold cursor-pointer transition appearance-none border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                brandFilter !== 'All'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <option value="All">All Brands</option>
              {brands
                .filter((b) => b !== 'All')
                .map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
            </select>
            <div className={`absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none ${brandFilter !== 'All' ? 'text-slate-300' : 'text-slate-400'}`}>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative inline-flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`pl-8 pr-8 py-2 rounded-lg text-xs font-semibold cursor-pointer transition appearance-none border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                statusFilter !== 'All'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <option value="All">All Form Statuses</option>
              {statuses
                .filter((s) => s !== 'All')
                .map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
            </select>
            <div className={`absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none ${statusFilter !== 'All' ? 'text-slate-300' : 'text-slate-400'}`}>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Quick Active Filter Pill */}
          {statusFilter !== 'All' && (
            <button
              onClick={() => setStatusFilter('All')}
              className="inline-flex items-center space-x-1.5 px-2.5 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold border border-emerald-300 transition"
              title="Clear status filter"
            >
              <span>{statusFilter}</span>
              <X className="w-3.5 h-3.5 text-emerald-700" />
            </button>
          )}

          {/* Quick Brand Filter Pill */}
          {brandFilter !== 'All' && (
            <button
              onClick={() => setBrandFilter('All')}
              className="inline-flex items-center space-x-1.5 px-2.5 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-semibold border border-indigo-300 transition"
              title="Clear brand filter"
            >
              <span>{brandFilter}</span>
              <X className="w-3.5 h-3.5 text-indigo-700" />
            </button>
          )}

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Forms Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading accountability records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600">{error}</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No accountability forms found.</p>
            <p className="text-slate-400">Click "+ Issue New Form" to create your first accountability.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-5">Form Reference</th>
                  <th className="py-3 px-4">Brand & Legal Owner</th>
                  <th className="py-3 px-5">Employee / Custodian</th>
                  <th className="py-3 px-5">Equipment Items</th>
                  <th className="py-3 px-5">Date Issued</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => {
                  const isActive = rec.status === 'Active';
                  const isPartial = rec.status === 'Partially Returned';

                  return (
                    <tr
                      key={rec._id}
                      onClick={() => navigate(`/forms/${rec._id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition group"
                    >
                      {/* Form Reference */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900 group-hover:text-emerald-700 transition">
                            {rec.formNumber}
                          </span>
                          {rec.accountabilityType === 'Store' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Store
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Released by: {rec.issuance?.releasedBy || 'N/A'}
                        </div>
                      </td>

                      {/* Brand & Legal Owner */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">
                          {rec.brand || 'Goldilocks'}
                        </div>
                        <div
                          className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]"
                          title={`Legal Owner: ${rec.propertyOwnerCompany || rec.company || 'Chawnah Foods Inc.'}`}
                        >
                          {rec.propertyOwnerCompany || rec.company || 'Chawnah Foods Inc.'}
                        </div>
                      </td>

                      {/* Employee / Custodian / Store */}
                      <td className="py-3.5 px-5">
                        {rec.accountabilityType === 'Store' && rec.storeName ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <Store className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{rec.storeName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <span>{rec.employeeInfo?.name || 'Store Supervisor'}</span>
                              {rec.employeeInfo?.employeeId && (
                                <span className="font-mono text-slate-400"> ({rec.employeeInfo.employeeId})</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-800">
                              {rec.employeeInfo?.name || 'Unassigned'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono">{rec.employeeInfo?.employeeId}</span>
                              {rec.employeeInfo?.department && ` • ${rec.employeeInfo.department}`}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Equipment Items - Clean summary, no vertical stretch */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-xs">
                              {rec.items?.length || 0} Item{rec.items?.length !== 1 ? 's' : ''}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {rec.items?.filter((i) => i.status === 'Active').length || 0} Active
                            </span>
                          </div>
                          <div
                            className="text-[11px] text-slate-500 truncate max-w-xs"
                            title={rec.items?.map((it, i) => `${i + 1}. ${it.itemDescription || it.assetTag}`).join('\n')}
                          >
                            {rec.items?.[0]?.itemDescription || 'No items listed'}
                            {rec.items?.length > 1 && (
                              <span className="text-indigo-600 font-semibold">
                                {' '}• +{rec.items.length - 1} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date Issued */}
                      <td className="py-3.5 px-5 text-slate-600 whitespace-nowrap">
                        {new Date(rec.issuance?.date || rec.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPartial
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 group-hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition">
                          <Printer className="w-3.5 h-3.5" />
                          <span>View / Print</span>
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
  );
}

