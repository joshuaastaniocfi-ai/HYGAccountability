import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import StoresPage from './pages/StoresPage';
import ItemsPage from './pages/ItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import InventoryGroupsPage from './pages/InventoryGroupsPage';
import EquipmentTypeUnitsPage from './pages/EquipmentTypeUnitsPage';
import AccountabilityFormsPage from './pages/AccountabilityFormsPage';
import IssueFormWizardPage from './pages/IssueFormWizardPage';
import FormViewPage from './pages/FormViewPage';
import SetHistoryPage from './pages/SetHistoryPage';
import LoginPage from './pages/LoginPage';
import AddEmployeeModal from './components/AddEmployeeModal';
import AddItemModal from './components/AddItemModal';
import SeedModal from './components/SeedModal';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function AdminLayout() {
  const location = useLocation();

  // Collapsible sidebar state persisted in localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Modals state
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  // Dynamic header title and subtitle based on current route
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path === '/') {
      return {
        title: 'Chawnah Foods Inc. — Asset Accountability',
        subtitle: 'Overview of equipment custody, active assignments, and recent returns',
      };
    }
    if (path === '/inventory') {
      return {
        title: 'Inventory by Equipment Type',
        subtitle: 'Grouped equipment inventory tracking: assigned vs available stock across all 44 branches',
      };
    }
    if (path.startsWith('/inventory/')) {
      return {
        title: 'Equipment Units & Stock',
        subtitle: 'Individual equipment units, serial numbers, custodians, and replacement history',
      };
    }
    if (path === '/employees') {
      return {
        title: 'Employee Equipment Accountability',
        subtitle: 'Select any employee to view active & past equipment accountabilities',
      };
    }
    if (path === '/stores') {
      return {
        title: 'Store & Branch Equipment Accountability',
        subtitle: 'Official equipment deployed across all 44 Chawnah Foods Inc. retail branches',
      };
    }
    if (path.startsWith('/employees/')) {
      return {
        title: 'Employee Accountability Profile',
        subtitle: 'Active gear, returned items history, and signed accountability forms',
      };
    }
    if (path === '/items') {
      return {
        title: 'Equipment & Asset Catalog',
        subtitle: 'Select any equipment to see previous owners, maintenance, and remarks',
      };
    }
    if (path.startsWith('/items/')) {
      return {
        title: 'Equipment Detail & Chain of Custody',
        subtitle: 'Prior owners, timeline audit log, and inspection remarks',
      };
    }
    if (path === '/forms') {
      return {
        title: 'Accountability Forms Archive',
        subtitle: 'All official equipment issuance forms of Chawnah Foods Inc.',
      };
    }
    if (path === '/forms/new') {
      return {
        title: 'Issue New Equipment Accountability Form',
        subtitle: 'Create, authorize, and sign official equipment custody document',
      };
    }
    if (path.startsWith('/forms/')) {
      return {
        title: 'Official Equipment Accountability Form',
        subtitle: 'Printable signed document adhering to company property policy',
      };
    }
    if (path.startsWith('/history')) {
      return {
        title: 'Equipment & Set History Audit Trail',
        subtitle: 'Chronological lifecycle timeline, component part specifications, and chain of custody',
      };
    }
    return {
      title: 'Chawnah Foods Inc.',
      subtitle: 'Equipment Accountability System',
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Fixed Collapsible Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main Content Area offset by dynamic sidebar width (ml-[76px] or ml-64 on desktop, full width on mobile) */}
      <div
        className={`${
          isSidebarCollapsed ? 'md:ml-[76px]' : 'md:ml-64'
        } ml-0 print:ml-0 flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out`}
      >
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onOpenAddEmployee={() => setIsAddEmployeeOpen(true)}
          onOpenAddItem={() => setIsAddItemOpen(true)}
        />

        <main className="flex-1 pb-24 md:pb-16">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<InventoryGroupsPage />} />
            <Route path="/inventory/:type" element={<EquipmentTypeUnitsPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/forms" element={<AccountabilityFormsPage />} />
            <Route path="/forms/new" element={<IssueFormWizardPage />} />
            <Route path="/forms/:id" element={<FormViewPage />} />
            <Route path="/history" element={<SetHistoryPage />} />
            <Route path="/history/set/:tag" element={<SetHistoryPage />} />
            <Route path="/history/item/:id" element={<SetHistoryPage />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onEmployeeAdded={() => {
          window.location.reload();
        }}
      />

      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onItemAdded={() => {
          window.location.reload();
        }}
      />

      <SeedModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        onSeeded={() => {}}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Administration Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
