import React, { useState, useEffect } from 'react';
import { X, UserPlus, Pencil, AlertOctagon, Building2, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onEmployeeAdded,
  employeeToEdit = null,
  onEmployeeUpdated = null,
}) {
  const isEdit = Boolean(employeeToEdit);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    company: 'Chawnah Foods Inc.',
    jobTitle: '',
    department: 'Operations',
    email: '',
    phone: '',
    status: 'Active',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (employeeToEdit) {
        setFormData({
          employeeId: employeeToEdit.employeeId || '',
          name: employeeToEdit.name || '',
          firstName: employeeToEdit.firstName || '',
          middleName: employeeToEdit.middleName || '',
          lastName: employeeToEdit.lastName || '',
          suffix: employeeToEdit.suffix || '',
          company: employeeToEdit.company || 'Chawnah Foods Inc.',
          jobTitle: employeeToEdit.jobTitle || '',
          department: employeeToEdit.department || 'Operations',
          email: employeeToEdit.email || '',
          phone: employeeToEdit.phone || '',
          status: employeeToEdit.status || 'Active',
          notes: employeeToEdit.notes || '',
        });
      } else {
        setFormData({
          employeeId: '',
          name: '',
          firstName: '',
          middleName: '',
          lastName: '',
          suffix: '',
          company: 'Chawnah Foods Inc.',
          jobTitle: '',
          department: 'Operations',
          email: '',
          phone: '',
          status: 'Active',
          notes: '',
        });
      }
    }
  }, [isOpen, employeeToEdit]);

  if (!isOpen) return null;

  const companies = [
    'DU99',
    'Chawnah Foods Inc.',
    'Cakes and Occasions Corp.',
    'Fresh Berry Foods Corp.',
    'Icebergs',
    'Cake Haven Inc.',
    'Taters',
    'Savore',
    'Chatime',
    '7/11',
  ];

  const departments = [
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

  const statuses = ['Active', 'Inactive', 'On Leave', 'Resigned'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Auto-construct name if empty but first/last provided
      let fullName = formData.name.trim();
      if (!fullName && (formData.firstName || formData.lastName)) {
        fullName = [
          formData.firstName.trim(),
          formData.middleName.trim(),
          formData.lastName.trim(),
          formData.suffix.trim(),
        ]
          .filter(Boolean)
          .join(' ');
      }

      const payload = {
        ...formData,
        employeeId: formData.employeeId.trim().toUpperCase(),
        name: fullName || formData.employeeId,
      };

      if (isEdit) {
        const updated = await api.updateEmployee(employeeToEdit._id, payload);
        if (onEmployeeUpdated) {
          onEmployeeUpdated(updated);
        }
      } else {
        const created = await api.createEmployee(payload);
        if (onEmployeeAdded) {
          onEmployeeAdded(created);
        }
      }
      onClose();
    } catch (err) {
      setError(err.message || (isEdit ? 'Failed to update employee' : 'Failed to create employee'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${isEdit ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isEdit ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? 'Edit Employee Details' : 'Add New Employee'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? `Updating profile for ${employeeToEdit.name}`
                  : 'Register employee for equipment issuance'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Company *
              </label>
              <select
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 11112026-01"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. JUAN P. DELA CRUZ"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                First Name
              </label>
              <input
                type="text"
                placeholder="First"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                placeholder="Middle"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Last"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Suffix
              </label>
              <input
                type="text"
                placeholder="Jr/III"
                value={formData.suffix}
                onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Position / Job Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sales Associate, Manager"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="employee@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                placeholder="0917-xxx-xxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows="2"
              placeholder="Optional notes or details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50 ${
                isEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Register Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
