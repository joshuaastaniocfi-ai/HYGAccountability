import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  Building2,
  Hash,
  Package,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  Store,
  Building,
  Users2,
  Layers,
  Laptop,
  Video,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import SignaturePad from '../components/SignaturePad';
import StoreCombobox from '../components/StoreCombobox';
import EquipmentSetModal from '../components/EquipmentSetModal';

export default function IssueFormWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedEmployeeId = searchParams.get('employeeId');
  const preselectedItemId = searchParams.get('itemId');
  const preselectedType = searchParams.get('type') || searchParams.get('accountabilityType');
  const preselectedStore = searchParams.get('storeName') || searchParams.get('store');
  const preselectedPackage = searchParams.get('package');

  const [employees, setEmployees] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Accountability Type: 'Store' | 'Department' | 'Office' | 'Individual'
  const [accountabilityType, setAccountabilityType] = useState(preselectedType || 'Store');

  // Store selection state (from Combobox)
  const [selectedStore, setSelectedStore] = useState(preselectedStore || '');

  // Office Location (when Office type selected)
  const [officeLocation, setOfficeLocation] = useState('Main Office HQ');

  // Companies List for Dropdown
  const companiesList = [
    'Chawnah Foods Inc.',
    'DU99',
    'Cakes and Occasions Corp.',
    'Fresh Berry Foods Corp.',
    'Icebergs',
    'Cake Haven Inc.',
    'Taters',
    'Savore',
    'Chatime',
    '7/11',
  ];

  // Departments List for Dropdown
  const departmentsList = [
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
    'Store Operations / Retail',
  ];

  // Employee / Custodian Representative Information State
  const [employeeData, setEmployeeData] = useState({
    dateOfRelease: new Date().toISOString().split('T')[0],
    name: '',
    company: 'Chawnah Foods Inc.',
    department: 'Operations',
    position: 'Store Supervisor / Branch In-Charge',
    employeeId: '',
  });

  // Selected existing employee ID (optional quick picker)
  const [selectedExistingEmployeeId, setSelectedExistingEmployeeId] = useState(preselectedEmployeeId || '');

  // Equipment Items Table State
  const [equipmentRows, setEquipmentRows] = useState([
    {
      id: 1,
      itemNumber: 'ITM-0001',
      equipment: '',
      brand: '',
      serialNumber: '',
      dateIssued: new Date().toISOString().split('T')[0],
      conditionAtIssuance: 'Good',
      remark: '',
      itemId: null, // if from existing catalog
      setTag: null,
    },
  ]);

  // Set modal state
  const [isSetModalOpen, setIsSetModalOpen] = useState(false);
  const [activeSetType, setActiveSetType] = useState('desktop');

  // Signatures & Acknowledgments State
  const [signData, setSignData] = useState({
    releasedBy: 'N/A',
    approvedBy: 'N/A',
    employeeSignatureName: '',
    employeeSignatureImage: '',
    receivedInGoodCondition: true,
    notedIssues: '',
  });

  // Auto-adapt default values when changing accountability type
  useEffect(() => {
    if (accountabilityType === 'Store') {
      setEmployeeData((prev) => ({
        ...prev,
        department: 'Store Operations / Retail',
        position: prev.position || 'Store Supervisor / Branch In-Charge',
      }));
    } else if (accountabilityType === 'Department') {
      setEmployeeData((prev) => ({
        ...prev,
        department: prev.department === 'Store Operations / Retail' ? 'Quality Assurance' : prev.department,
        position: prev.position || 'Department Head / Area Lead',
      }));
    } else if (accountabilityType === 'Office') {
      setEmployeeData((prev) => ({
        ...prev,
        department: 'Administration',
        position: prev.position || 'Office Administrator / Facilities Lead',
      }));
    } else {
      setEmployeeData((prev) => ({
        ...prev,
        position: prev.position || 'Staff / Specialist',
      }));
    }
  }, [accountabilityType]);

  // Handle URL package trigger (e.g. ?package=store_default)
  useEffect(() => {
    if (preselectedPackage) {
      if (
        preselectedPackage === 'store_default' ||
        preselectedPackage === 'store' ||
        preselectedPackage === 'complete'
      ) {
        setActiveSetType('store_bundle');
        setIsSetModalOpen(true);
      } else if (preselectedPackage === 'desktop') {
        setActiveSetType('desktop');
        setIsSetModalOpen(true);
      } else if (preselectedPackage === 'cctv') {
        setActiveSetType('cctv');
        setIsSetModalOpen(true);
      }
    }
  }, [preselectedPackage]);

  // Fetch initial data & setup next item numbers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empData, itemsData, nextNumData] = await Promise.all([
          api.getEmployees(),
          api.getItems({ status: 'Available' }),
          api.getNextItemNumber().catch(() => ({ nextItemNumber: 'ITM-0001', count: 0 })),
        ]);

        setEmployees(empData);
        setAvailableItems(itemsData);

        const baseItemNum = nextNumData?.nextItemNumber || 'ITM-0001';

        // Pre-fill employee if query param exists
        if (preselectedEmployeeId) {
          const emp = empData.find((e) => e._id === preselectedEmployeeId);
          if (emp) {
            setAccountabilityType('Individual');
            setSelectedExistingEmployeeId(emp._id);
            setEmployeeData((prev) => ({
              ...prev,
              name: emp.name,
              department: emp.department,
              position: emp.jobTitle,
              employeeId: emp.employeeId,
            }));
            setSignData((prev) => ({
              ...prev,
              employeeSignatureName: emp.name,
            }));
          }
        }

        // Pre-fill item if query param exists
        if (preselectedItemId) {
          const it = itemsData.find((i) => i._id === preselectedItemId);
          if (it) {
            setEquipmentRows([
              {
                id: 1,
                itemNumber: it.itemNumber || it.assetTag || baseItemNum,
                equipment: it.itemDescription,
                brand: it.brandModel,
                serialNumber: it.serialNumber,
                dateIssued: new Date().toISOString().split('T')[0],
                conditionAtIssuance: it.currentCondition || 'Good',
                remark: it.remarks || '',
                itemId: it._id,
                setTag: null,
              },
            ]);
          }
        } else {
          setEquipmentRows([
            {
              id: 1,
              itemNumber: baseItemNum,
              equipment: '',
              brand: '',
              serialNumber: '',
              dateIssued: new Date().toISOString().split('T')[0],
              conditionAtIssuance: 'Good',
              remark: '',
              itemId: null,
              setTag: null,
            },
          ]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [preselectedEmployeeId, preselectedItemId]);

  // Handle employee quick-select from existing records
  const handleSelectExistingEmployee = (empId) => {
    setSelectedExistingEmployeeId(empId);
    if (!empId) return;

    const emp = employees.find((e) => e._id === empId);
    if (emp) {
      setEmployeeData((prev) => ({
        ...prev,
        name: emp.name,
        company: emp.company || 'Chawnah Foods Inc.',
        department: emp.department || prev.department,
        position: emp.jobTitle || prev.position,
        employeeId: emp.employeeId,
      }));
      setSignData((prev) => ({
        ...prev,
        employeeSignatureName: emp.name,
      }));
    }
  };

  // Add new equipment row with auto-increment item number
  const handleAddEquipmentRow = () => {
    setEquipmentRows((prev) => {
      const lastRow = prev[prev.length - 1];
      let nextNumber = 'ITM-0001';

      if (lastRow && lastRow.itemNumber && lastRow.itemNumber.startsWith('ITM-')) {
        const numPart = parseInt(lastRow.itemNumber.replace('ITM-', ''), 10);
        if (!isNaN(numPart)) {
          nextNumber = `ITM-${String(numPart + 1).padStart(4, '0')}`;
        }
      } else {
        nextNumber = `ITM-${String(prev.length + 1).padStart(4, '0')}`;
      }

      return [
        ...prev,
        {
          id: Date.now(),
          itemNumber: nextNumber,
          equipment: '',
          brand: '',
          serialNumber: '',
          dateIssued: employeeData.dateOfRelease,
          conditionAtIssuance: 'Good',
          remark: '',
          itemId: null,
          setTag: null,
        },
      ];
    });
  };

  // Open Equipment Set Modal
  const handleOpenSetModal = (setType = 'desktop') => {
    setActiveSetType(setType);
    setIsSetModalOpen(true);
  };

  // Receive and append equipment set items into the rows list
  const handleAddSetItems = (newItems) => {
    setEquipmentRows((prev) => {
      // If current form only has 1 blank row, replace it
      const isSingleEmpty =
        prev.length === 1 && !prev[0].equipment.trim() && !prev[0].serialNumber.trim();

      const baseList = isSingleEmpty ? [] : [...prev];

      let nextNumInt = 1;
      const lastRow = baseList[baseList.length - 1];
      if (lastRow && lastRow.itemNumber && lastRow.itemNumber.startsWith('ITM-')) {
        const parsed = parseInt(lastRow.itemNumber.replace('ITM-', ''), 10);
        if (!isNaN(parsed)) nextNumInt = parsed + 1;
      } else if (baseList.length > 0) {
        nextNumInt = baseList.length + 1;
      }

      const appended = newItems.map((item, idx) => ({
        id: Date.now() + idx,
        itemNumber: `ITM-${String(nextNumInt + idx).padStart(4, '0')}`,
        equipment: item.equipment,
        brand: item.brand,
        serialNumber: item.serialNumber,
        dateIssued: item.dateIssued || employeeData.dateOfRelease,
        conditionAtIssuance: item.conditionAtIssuance || 'Good',
        remark: item.remark || '',
        equipmentType: item.equipmentType,
        category: item.category,
        itemId: item.itemId || null,
        setTag: item.setTag,
      }));

      return [...baseList, ...appended];
    });
  };

  // Update specific field in an equipment row
  const handleRowChange = (id, field, value) => {
    setEquipmentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Quick-select an item from inventory to populate a row
  const handlePopulateFromInventory = (rowId, inventoryItemId) => {
    const it = availableItems.find((i) => i._id === inventoryItemId);
    if (!it) return;

    setEquipmentRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
            ...row,
            equipment: it.itemDescription,
            brand: it.brandModel,
            serialNumber: it.serialNumber,
            conditionAtIssuance: it.currentCondition || 'Good',
            remark: it.remarks || '',
            itemId: it._id,
            itemNumber: it.itemNumber || it.assetTag || row.itemNumber,
          }
          : row
      )
    );
  };

  // Remove row
  const handleRemoveRow = (id) => {
    if (equipmentRows.length === 1) {
      setEquipmentRows([
        {
          id: Date.now(),
          itemNumber: 'ITM-0001',
          equipment: '',
          brand: '',
          serialNumber: '',
          dateIssued: employeeData.dateOfRelease,
          conditionAtIssuance: 'Good',
          remark: '',
          itemId: null,
          setTag: null,
        },
      ]);
      return;
    }
    setEquipmentRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Submit Issuance Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate Store if Store type
    if (accountabilityType === 'Store' && !selectedStore.trim()) {
      setError('Please select a Store Branch from the combobox.');
      return;
    }

    // Validation
    if (!employeeData.name.trim()) {
      setError(
        accountabilityType === 'Store'
          ? 'Store Supervisor / Custodian Name is required.'
          : 'Name of Employee is required.'
      );
      return;
    }
    if (!employeeData.employeeId.trim()) {
      setError('Employee / Custodian ID is required.');
      return;
    }
    if (!employeeData.department) {
      setError('Please select a Department from the dropdown.');
      return;
    }
    if (!employeeData.position.trim()) {
      setError('Position / Job Title is required.');
      return;
    }

    // Validate equipment rows
    const validRows = equipmentRows.filter(
      (r) => r.equipment.trim() || r.serialNumber.trim()
    );

    if (validRows.length === 0) {
      setError('Please enter at least one Equipment item with description and serial number.');
      return;
    }

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      if (!row.equipment.trim()) {
        setError(`Row ${i + 1}: Item Name / Description is required.`);
        return;
      }
      if (!row.serialNumber.trim()) {
        setError(`Row ${i + 1}: Serial Number is required.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        accountabilityType,
        storeName: accountabilityType === 'Store' ? selectedStore : undefined,
        officeLocation: accountabilityType === 'Office' ? officeLocation : undefined,
        employeeId: selectedExistingEmployeeId || undefined,
        company: employeeData.company || 'Chawnah Foods Inc.',
        employeeInfo: {
          name: employeeData.name.trim(),
          employeeId: employeeData.employeeId.trim().toUpperCase(),
          jobTitle: employeeData.position.trim(),
          department: employeeData.department,
          company: employeeData.company || 'Chawnah Foods Inc.',
        },
        items: validRows.map((row) => ({
          itemId: row.itemId || undefined,
          itemNumber: row.itemNumber.trim(),
          equipment: row.equipment.trim(),
          brand: row.brand.trim() || 'Standard',
          serialNumber: row.serialNumber.trim(),
          dateIssued: row.dateIssued || employeeData.dateOfRelease,
          conditionAtIssuance: row.conditionAtIssuance,
          remark: row.remark.trim(),
          setTag: row.setTag || null,
          equipmentType: row.equipmentType,
          category: row.category,
        })),
        issuance: {
          dateOfRelease: employeeData.dateOfRelease,
          date: employeeData.dateOfRelease,
          releasedBy: signData.releasedBy.trim(),
          approvedBy: signData.approvedBy.trim(),
          employeeSignatureName: signData.employeeSignatureName.trim() || employeeData.name.trim(),
          employeeSignatureImage: signData.employeeSignatureImage,
          conditionAcknowledgment: {
            receivedInGoodCondition: signData.receivedInGoodCondition,
            notedIssues: signData.notedIssues.trim(),
          },
        },
      };

      const result = await api.createAccountability(payload);
      navigate(`/forms/${result._id}`);
    } catch (err) {
      setError(err.message || 'Failed to issue accountability form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Navigation & Context Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <Link
          to="/forms"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-emerald-600 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Forms Archive</span>
        </Link>

        <div className="inline-flex items-center space-x-2 text-xs font-medium text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Official Custody Form Protocol</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* ACCOUNTABILITY TYPE SELECTOR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Users2 className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Select Accountability Scope / Custody Mode:
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            {
              id: 'Store',
              title: 'Store Equipment',
              desc: 'Group Accountable: Branch',
              icon: Store,
              badge: '44 Branches',
            },
            {
              id: 'Department',
              title: 'Department Equipment',
              desc: 'Group Accountable: Dept',
              icon: Building2,
              badge: 'QA / Logistics',
            },
            {
              id: 'Office',
              title: 'Office Equipment',
              desc: 'Group Accountable: HQ Area',
              icon: Building,
              badge: 'Shared Assets',
            },
            {
              id: 'Individual',
              title: 'Individual Employee',
              desc: 'Personal Accountability',
              icon: User,
              badge: 'Personal Gear',
            },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = accountabilityType === type.id;

            return (
              <div
                key={type.id}
                onClick={() => setAccountabilityType(type.id)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${isSelected
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                      {type.badge}
                    </span>
                  </div>

                  <h3
                    className={`font-bold text-xs ${isSelected ? 'text-emerald-950 font-black' : 'text-slate-800'
                      }`}
                  >
                    {type.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{type.desc}</p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className={isSelected ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                    {isSelected ? 'Selected' : 'Click to select'}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD 1: ISSUANCE & CUSTODIAN INFORMATION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                {accountabilityType === 'Store' ? (
                  <Store className="w-5 h-5" />
                ) : accountabilityType === 'Department' ? (
                  <Building2 className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {accountabilityType === 'Store'
                    ? 'Store Branch & Custodian In-Charge'
                    : accountabilityType === 'Department'
                      ? 'Department & Custodian In-Charge'
                      : accountabilityType === 'Office'
                        ? 'Office Location & Custodian In-Charge'
                        : 'Employee Information'}
                </h2>
                <p className="text-xs text-slate-500">
                  {accountabilityType === 'Store'
                    ? 'Group accountability for the selected store branch operations'
                    : 'Accountability holder details and date of equipment release'}
                </p>
              </div>
            </div>

            {/* Quick Picker from Registered Employees */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Autofill Custodian:</span>
              <select
                value={selectedExistingEmployeeId}
                onChange={(e) => handleSelectExistingEmployee(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Choose Registered Staff --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId}) &bull; {emp.department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STORE COMBOBOX (IF STORE EQUIPMENT SELECTED) */}
          {accountabilityType === 'Store' && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
              <StoreCombobox
                value={selectedStore}
                onChange={(store) => setSelectedStore(store)}
                error={null}
              />
              <p className="text-[11px] text-emerald-700 mt-2 font-medium">
                ★ All items in this form will be assigned to <strong>{selectedStore || 'the chosen store branch'}</strong> under group accountability.
              </p>
            </div>
          )}

          {/* OFFICE LOCATION FIELD (IF OFFICE SELECTED) */}
          {accountabilityType === 'Office' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <label className="block font-bold text-slate-700 mb-1">
                Office Location / Area *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Main Office HQ - 2nd Floor Conference Room / Production Control Office"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Date of Release */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Date of Release *</span>
              </label>
              <input
                type="date"
                required
                value={employeeData.dateOfRelease}
                onChange={(e) =>
                  setEmployeeData({ ...employeeData, dateOfRelease: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Employee ID / Custodian ID */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {accountabilityType === 'Store'
                    ? 'Supervisor / OIC ID *'
                    : 'Employee ID *'}
                </span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CFI-2024-001"
                value={employeeData.employeeId}
                onChange={(e) =>
                  setEmployeeData({ ...employeeData, employeeId: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 uppercase focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Name of Employee / Custodian */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {accountabilityType === 'Store'
                    ? 'Store In-Charge / Supervisor *'
                    : accountabilityType === 'Department'
                      ? 'Dept Head / Area Custodian *'
                      : 'Name of Employee *'}
                </span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maria Santos / Store Supervisor"
                value={employeeData.name}
                onChange={(e) => {
                  setEmployeeData({ ...employeeData, name: e.target.value });
                  setSignData((prev) => ({ ...prev, employeeSignatureName: e.target.value }));
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Company (Dropdown) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Company *</span>
              </label>
              <select
                required
                value={employeeData.company}
                onChange={(e) =>
                  setEmployeeData({ ...employeeData, company: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition cursor-pointer"
              >
                {companiesList.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>

            {/* Department (Dropdown) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Department *</span>
              </label>
              <select
                required
                value={employeeData.department}
                onChange={(e) =>
                  setEmployeeData({ ...employeeData, department: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition cursor-pointer"
              >
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <span>Position / Job Title *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sales Associate, Supervisor, Manager"
                value={employeeData.position}
                onChange={(e) =>
                  setEmployeeData({ ...employeeData, position: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: EQUIPMENT DETAILS TABLE (DYNAMIC MULTI-ROW & SET ISSUANCE) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-7 shadow-xs space-y-5">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-slate-700/50">
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Equipment Details & Issuance List
                </h2>
                <p className="text-xs text-slate-500">
                  Select a pre-set bundle below or add custom equipment items
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-400">
              {equipmentRows.length} item{equipmentRows.length !== 1 ? 's' : ''} in form
            </div>
          </div>

          {/* Clean Pre-sets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center space-x-1.5 pl-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pre-sets:</span>
              </span>

              <button
                type="button"
                onClick={() => handleOpenSetModal('store_bundle')}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-amber-50/80 text-slate-800 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold transition shadow-2xs group"
                title="Complete store branch bundle (Desktop Set + CCTV Set)"
              >
                <Store className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                <span>Complete Store Package</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                  Desktop + CCTV
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSetModal('desktop')}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-emerald-50/80 text-slate-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs group"
                title="Desktop workstation set"
              >
                <Laptop className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span>Desktop Set</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  7 items
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSetModal('cctv')}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-indigo-50/80 text-slate-800 hover:text-indigo-900 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold transition shadow-2xs group"
                title="CCTV security system set"
              >
                <Video className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span>CCTV Set</span>
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">
                  4 or 8 cams
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddEquipmentRow}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Custom Item</span>
            </button>
          </div>

          {/* Rows List */}
          <div className="space-y-4">
            {equipmentRows.map((row, index) => (
              <div
                key={row.id}
                className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/90 relative group hover:border-emerald-300 transition"
              >
                {/* Row Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[11px]">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      Equipment Entry #{index + 1}
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      <span>Unique ID:</span>
                      <span>{row.itemNumber}</span>
                    </span>

                    {row.setTag && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <span>Set:</span>
                        <span>{row.setTag}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Quick Inventory Matcher */}
                    {availableItems.length > 0 && (
                      <select
                        onChange={(e) => handlePopulateFromInventory(row.id, e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-600 hover:border-slate-400 focus:outline-none cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          -- Autofill from Inventory --
                        </option>
                        {availableItems.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.itemDescription} ({item.serialNumber})
                          </option>
                        ))}
                      </select>
                    )}

                    {equipmentRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid Inputs for Equipment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-xs">
                  {/* Item Number (auto-increment / unique) */}
                  <div className="lg:col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">
                      Item Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ITM-0001"
                      value={row.itemNumber}
                      onChange={(e) => handleRowChange(row.id, 'itemNumber', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      Auto-incremented
                    </span>
                  </div>

                  {/* Item Name / Description */}
                  <div className="lg:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Item Name / Description *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Monitor / Mouse / Keyboard / System Unit / UPS"
                      value={row.equipment}
                      onChange={(e) => handleRowChange(row.id, 'equipment', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Brand / Model */}
                  <div className="lg:col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">
                      Brand / Model *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dell / Hikvision / Standard"
                      value={row.brand}
                      onChange={(e) => handleRowChange(row.id, 'brand', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Serial Number */}
                  <div className="lg:col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">
                      Serial Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SN-89218-STR"
                      value={row.serialNumber}
                      onChange={(e) => handleRowChange(row.id, 'serialNumber', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Date of Issuance (Per Item Row) */}
                  <div className="lg:col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">
                      Date Issued *
                    </label>
                    <input
                      type="date"
                      required
                      value={row.dateIssued || employeeData.dateOfRelease}
                      onChange={(e) => handleRowChange(row.id, 'dateIssued', e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Condition at Issuance */}
                  <div className="lg:col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">
                      Condition *
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {['New', 'Good', 'Fair'].map((cond) => (
                        <button
                          type="button"
                          key={cond}
                          onClick={() => handleRowChange(row.id, 'conditionAtIssuance', cond)}
                          className={`py-1.5 text-center rounded text-[11px] font-bold border transition ${row.conditionAtIssuance === cond
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Remark */}
                  <div className="lg:col-span-7 pt-1">
                    <label className="block font-semibold text-slate-600 mb-1">
                      Remark (Accessories, Condition notes, set inclusion details, cables, etc.)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Desktop Set inclusion - issued with power cords and display accessories."
                      value={row.remark}
                      onChange={(e) => handleRowChange(row.id, 'remark', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={handleAddEquipmentRow}
              className="inline-flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Equipment Item to This Form</span>
            </button>
          </div>
        </div>

        {/* CARD 3: CONDITION ACKNOWLEDGMENT, RESPONSIBILITIES & SIGNATURE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Condition Acknowledgment & Signatures
              </h2>
              <p className="text-xs text-slate-500">
                Official sign-off adhering to Chawnah Foods Inc. company policy
              </p>
            </div>
          </div>

          {/* Condition checkbox */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs space-y-2">
            <label className="flex items-center space-x-2.5 font-bold text-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={signData.receivedInGoodCondition}
                onChange={(e) =>
                  setSignData({ ...signData, receivedInGoodCondition: e.target.checked })
                }
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span>I confirm that I have inspected the equipment and received it in good working condition</span>
            </label>

            {!signData.receivedInGoodCondition && (
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Specify noted issues on release (if any)..."
                  value={signData.notedIssues}
                  onChange={(e) =>
                    setSignData({ ...signData, notedIssues: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Signatures & Release Officers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Released By (IT / Asset Custodian) *
              </label>
              <input
                type="text"
                required
                value={signData.releasedBy}
                onChange={(e) => setSignData({ ...signData, releasedBy: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Approved By (Operations / Dept Head) *
              </label>
              <input
                type="text"
                required
                value={signData.approvedBy}
                onChange={(e) => setSignData({ ...signData, approvedBy: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {accountabilityType === 'Store'
                  ? 'Store Custodian Printed Name *'
                  : 'Employee Signature Printed Name *'}
              </label>
              <input
                type="text"
                required
                value={signData.employeeSignatureName}
                onChange={(e) =>
                  setSignData({ ...signData, employeeSignatureName: e.target.value })
                }
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Interactive Digital Signature Pad */}
          <div className="pt-2">
            <SignaturePad
              label={
                accountabilityType === 'Store'
                  ? 'Store Custodian Signature (Draw or Touch to Sign)'
                  : 'Employee / Custodian Digital Signature'
              }
              onSave={(dataUrl) => setSignData({ ...signData, employeeSignatureImage: dataUrl })}
            />
          </div>
        </div>

        {/* Submit Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            to="/forms"
            className="px-5 py-3 text-slate-600 hover:bg-slate-200 font-semibold rounded-xl text-xs transition"
          >
            Cancel & Return to Archive
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>
              {submitting
                ? 'Creating Official Form...'
                : `Issue & Generate ${accountabilityType === 'Store'
                  ? 'Store Accountability Form'
                  : accountabilityType === 'Department'
                    ? 'Department Form'
                    : accountabilityType === 'Office'
                      ? 'Office Form'
                      : 'Employee Form'
                }`}
            </span>
          </button>
        </div>
      </form>

      {/* Equipment Set Quick-Issue Modal */}
      <EquipmentSetModal
        isOpen={isSetModalOpen}
        onClose={() => setIsSetModalOpen(false)}
        onAddItems={handleAddSetItems}
        availableInventory={availableItems}
        initialSetType={activeSetType}
        defaultDateIssued={employeeData.dateOfRelease}
      />
    </div>
  );
}
