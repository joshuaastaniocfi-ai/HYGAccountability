import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Briefcase,
  ChevronRight,
  Package,
  CheckCircle2,
  History,
  Download,
  ChevronDown,
  X,
  Building2,
  ChevronLeft,
  Pencil,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api';
import AddEmployeeModal from '../components/AddEmployeeModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { exportToCsv } from '../utils/exportCsv';

const COMPANY_CONFIG = {
  'DU99': {
    label: 'DU99',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    logo: '/logos/du99.png',
  },
  'Chawnah Foods Inc.': {
    label: 'Chawnah Foods (CFI / Goldilocks)',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    logo: '/website_logo.png',
  },
  'Cakes and Occasions Corp.': {
    label: 'Cakes & Occasions',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  'Fresh Berry Foods Corp.': {
    label: 'Fresh Berry Foods',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'Icebergs': {
    label: 'Icebergs',
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    dot: 'bg-cyan-500',
    logo: '/logos/icebergs.png',
  },
  'Cake Haven Inc.': {
    label: 'Cake Haven',
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
    dot: 'bg-pink-500',
  },
  'Taters': {
    label: 'Taters',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    logo: '/logos/taters.png',
  },
  'Savore': {
    label: 'Savore',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    logo: '/logos/savore.png',
  },
  'Chatime': {
    label: 'Chatime',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
    logo: '/logos/chatime.png',
  },
  '7/11': {
    label: '7-Eleven',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-600',
  },
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const navigate = useNavigate();

  const handleConfirmDeleteEmployee = async (target, force) => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await api.deleteEmployee(target._id, force);
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete employee');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Load list of companies for filters
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const list = await api.getEmployeeCompanies();
        setCompanies(list);
      } catch (e) {
        console.error('Failed to load companies:', e);
      }
    };
    fetchCompanies();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployees({
        search,
        department: selectedDept,
        company: selectedCompany,
      });
      setEmployees(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDept, selectedCompany]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  const departments = [
    'All',
    'Operations',
    'Logistics',
    'Inventory',
    'Accounting',
    'Admin',
    'Maintenance',
    'HR',
    'IT',
    'Marketing',
    'Motorpool',
    'AUDIT',
    'TRAINING',
  ];

  const handleExportCsv = () => {
    const exportData = employees.map((emp) => ({
      'Employee ID': emp.employeeId,
      'Full Name': emp.name,
      'First Name': emp.firstName || '',
      'Middle Name': emp.middleName || '',
      'Last Name': emp.lastName || '',
      'Suffix': emp.suffix || '',
      'Company': emp.company || 'Chawnah Foods Inc.',
      'Department': emp.department,
      'Position': emp.jobTitle,
      'Email': emp.email || '',
      'Status': emp.status || 'Active',
      'Active Items Count': emp.activeAccountabilitiesCount || 0,
      'Total History Count': emp.totalAccountabilitiesCount || 0,
    }));
    const compTag = selectedCompany !== 'All' ? `_${selectedCompany.replace(/\s+/g, '_')}` : '';
    exportToCsv(`Employees${compTag}_${new Date().toISOString().split('T')[0]}.csv`, exportData);
  };

  // Pagination calculation
  const totalEmployees = employees.length;
  const totalPages = pageSize === 'All' ? 1 : Math.ceil(totalEmployees / pageSize);
  const paginatedEmployees = useMemo(() => {
    if (pageSize === 'All') return employees;
    const start = (currentPage - 1) * pageSize;
    return employees.slice(start, start + pageSize);
  }, [employees, currentPage, pageSize]);

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Employees Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {totalEmployees} Total
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official employee rosters categorized across group companies & departments
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition"
            title="Export Employees to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Company Quick Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1 text-xs">
        <button
          onClick={() => setSelectedCompany('All')}
          className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition ${
            selectedCompany === 'All'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          All Companies ({companies.reduce((acc, c) => acc + c.count, 0) || totalEmployees})
        </button>
        {companies.map((c) => {
          const cfg = COMPANY_CONFIG[c.name] || {};
          const isSelected = selectedCompany === c.name;
          return (
            <button
              key={c.name}
              onClick={() => setSelectedCompany(c.name)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition flex items-center space-x-1.5 border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {cfg.logo && !isSelected && (
                <img src={cfg.logo} alt="" className="w-3.5 h-3.5 object-contain" />
              )}
              <span>{c.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, employee ID, position, or company..."
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

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Company Filter Dropdown */}
          <div className="relative inline-flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className={`pl-8 pr-8 py-2 rounded-lg text-xs font-semibold cursor-pointer transition appearance-none border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                selectedCompany !== 'All'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <option value="All">All Companies</option>
              {companies.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative inline-flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={`pl-8 pr-8 py-2 rounded-lg text-xs font-semibold cursor-pointer transition appearance-none border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                selectedDept !== 'All'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <option value="All">All Departments</option>
              {departments
                .filter((d) => d !== 'All')
                .map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Active Filter Pills */}
          {selectedCompany !== 'All' && (
            <button
              onClick={() => setSelectedCompany('All')}
              className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold border border-emerald-300 transition"
              title="Clear company filter"
            >
              <span>{selectedCompany}</span>
              <X className="w-3.5 h-3.5 text-emerald-700" />
            </button>
          )}

          {selectedDept !== 'All' && (
            <button
              onClick={() => setSelectedDept('All')}
              className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold border border-emerald-300 transition"
              title="Clear department filter"
            >
              <span>{selectedDept}</span>
              <X className="w-3.5 h-3.5 text-emerald-700" />
            </button>
          )}
        </div>
      </div>

      {/* Employees Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading employee roster...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600">{error}</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No employees match your search.</p>
            <p className="text-slate-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-4">Employee Name &amp; ID</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Department &amp; Position</th>
                    <th className="py-2.5 px-3">Active Accountability</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEmployees.map((emp, index) => {
                    const rowNumber =
                      pageSize === 'All' ? index + 1 : (currentPage - 1) * pageSize + index + 1;
                    const hasActive = emp.activeItemsCount > 0;
                    const compCfg = COMPANY_CONFIG[emp.company] || {
                      badge: 'bg-slate-100 text-slate-700 border-slate-200',
                      dot: 'bg-slate-400',
                    };

                    return (
                      <tr
                        key={emp._id}
                        onClick={() => navigate(`/employees/${emp._id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition group"
                      >
                        {/* # Row Number */}
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                          {rowNumber}
                        </td>

                        {/* Name & ID */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 group-hover:ring-2 group-hover:ring-emerald-500 transition">
                              {emp.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                                {emp.name}
                              </div>
                              <span className="font-mono text-[11px] text-slate-500">
                                {emp.employeeId}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${compCfg.badge}`}
                          >
                            {compCfg.logo ? (
                              <img
                                src={compCfg.logo}
                                alt=""
                                className="w-3.5 h-3.5 object-contain shrink-0"
                              />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full ${compCfg.dot}`}></span>
                            )}
                            <span>{emp.company || 'Chawnah Foods Inc.'}</span>
                          </span>
                        </td>

                        {/* Department & Role */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{emp.jobTitle}</div>
                          <span className="inline-block px-2 py-0.5 mt-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                            {emp.department}
                          </span>
                        </td>

                        {/* Active Accountability */}
                        <td className="py-2.5 px-3">
                          {hasActive ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Package className="w-3.5 h-3.5" />
                              <span>
                                {emp.activeItemsCount} Item{emp.activeItemsCount > 1 ? 's' : ''}{' '}
                                Active
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs text-slate-400 bg-slate-50 border border-slate-200">
                              <span>No active equipment</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              emp.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEmployeeToEdit(emp);
                                setIsEditModalOpen(true);
                              }}
                              title="Edit employee details"
                              className="w-7 h-7 flex items-center justify-center bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-700 rounded-lg border border-slate-200 hover:border-blue-300 shadow-2xs transition"
                            >
                              <Pencil className="w-3.5 h-3.5 text-blue-600" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEmployeeToDelete(emp);
                                setDeleteError(null);
                                setIsDeleteModalOpen(true);
                              }}
                              title="Delete employee record"
                              className="w-7 h-7 flex items-center justify-center bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-lg border border-slate-200 hover:border-rose-300 shadow-2xs transition"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>

                            <span
                              title="View employee profile"
                              className="w-7 h-7 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 shadow-2xs transition"
                            >
                              <ChevronRight className="w-4 h-4 text-emerald-600" />
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'All' ? 'All' : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="All">All ({totalEmployees})</option>
                </select>
                <span>
                  entries &bull; Showing{' '}
                  <strong className="text-slate-800">
                    {pageSize === 'All'
                      ? `1 - ${totalEmployees}`
                      : `${(currentPage - 1) * pageSize + 1} - ${Math.min(
                          currentPage * pageSize,
                          totalEmployees
                        )}`}
                  </strong>{' '}
                  of <strong className="text-slate-800">{totalEmployees}</strong> employees
                </span>
              </div>

              {pageSize !== 'All' && totalPages > 1 && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3 py-1 font-semibold text-slate-700">
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEmployeeAdded={(newEmp) => {
          fetchEmployees();
          navigate(`/employees/${newEmp._id}`);
        }}
      />

      {/* Edit Employee Modal */}
      <AddEmployeeModal
        isOpen={isEditModalOpen}
        employeeToEdit={employeeToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setEmployeeToEdit(null);
        }}
        onEmployeeUpdated={() => {
          fetchEmployees();
        }}
      />

      {/* Confirm Delete Employee Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        targetType="employee"
        targetData={employeeToDelete}
        title="Delete Employee Record"
        loading={deleteLoading}
        error={deleteError}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEmployeeToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDeleteEmployee}
      />
    </div>
  );
}
