const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('cfi_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Invalid credentials');
    return result;
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Session expired or unauthorized');
    return res.json();
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      });
    } catch (_) {}
    localStorage.removeItem('cfi_auth_token');
    localStorage.removeItem('cfi_auth_user');
  },

  // Stats
  getStats: async () => {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Employees
  getEmployees: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/employees${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
  },

  getEmployeeCompanies: async () => {
    const res = await fetch(`${API_BASE}/employees/meta/companies`);
    if (!res.ok) throw new Error('Failed to fetch companies');
    return res.json();
  },

  getEmployee: async (id) => {
    const res = await fetch(`${API_BASE}/employees/${id}`);
    if (!res.ok) throw new Error('Failed to fetch employee details');
    return res.json();
  },

  createEmployee: async (data) => {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create employee');
    return result;
  },

  updateEmployee: async (id, data) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update employee');
    return result;
  },

  deleteEmployee: async (id, force = false) => {
    const res = await fetch(`${API_BASE}/employees/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete employee');
    return result;
  },

  // Items
  getItems: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/items${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },

  getNextItemNumber: async () => {
    const res = await fetch(`${API_BASE}/items/next-number`);
    if (!res.ok) throw new Error('Failed to fetch next item number');
    return res.json();
  },

  getItem: async (id) => {
    const res = await fetch(`${API_BASE}/items/${id}`);
    if (!res.ok) throw new Error('Failed to fetch item details');
    return res.json();
  },

  getSetHistory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/items/set-history${query ? `?${query}` : ''}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch set history');
    }
    return res.json();
  },

  createItem: async (data) => {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to add item');
    return result;
  },

  updateItem: async (id, data) => {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update item');
    return result;
  },

  addItemRemark: async (id, remarks, performedBy) => {
    const res = await fetch(`${API_BASE}/items/${id}/remarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks, performedBy }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to add remark');
    return result;
  },

  replacePart: async (id, data) => {
    const res = await fetch(`${API_BASE}/items/${id}/replace-part`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to replace part');
    return result;
  },

  replaceWhole: async (id, data) => {
    const res = await fetch(`${API_BASE}/items/${id}/replace-whole`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to replace whole unit');
    return result;
  },

  deleteItem: async (id, force = false) => {
    const res = await fetch(`${API_BASE}/items/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete item');
    return result;
  },

  updateEquipmentType: async (oldType, newType, category) => {
    const res = await fetch(`${API_BASE}/items/equipment-type/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldType, newType, category }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update equipment type');
    return result;
  },

  deleteEquipmentType: async (equipmentType, force = false) => {
    const res = await fetch(`${API_BASE}/items/equipment-type/delete${force ? '?force=true' : ''}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentType, force }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete equipment type');
    return result;
  },

  // Accountability Forms
  getAccountabilities: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/accountabilities${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch accountability records');
    return res.json();
  },

  getAccountability: async (id) => {
    const res = await fetch(`${API_BASE}/accountabilities/${id}`);
    if (!res.ok) throw new Error('Failed to fetch accountability record');
    return res.json();
  },

  createAccountability: async (data) => {
    const res = await fetch(`${API_BASE}/accountabilities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to issue accountability form');
    return result;
  },

  returnItem: async (formId, itemId, returnData) => {
    const res = await fetch(`${API_BASE}/accountabilities/${formId}/return-item/${itemId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(returnData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to return item');
    return result;
  },

  returnAllItems: async (formId, returnData) => {
    const res = await fetch(`${API_BASE}/accountabilities/${formId}/return-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(returnData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to return all items');
    return result;
  },

  returnItems: async (formId, returnData) => {
    const res = await fetch(`${API_BASE}/accountabilities/${formId}/return-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(returnData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to return items');
    return result;
  },

  // Inventory Batches / Bulk Intake Records
  createBatchItems: async (data) => {
    const res = await fetch(`${API_BASE}/inventory/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create batch intake');
    return result;
  },

  getInventoryBatches: async () => {
    const res = await fetch(`${API_BASE}/inventory/batches`);
    if (!res.ok) throw new Error('Failed to fetch inventory batch records');
    return res.json();
  },

  getInventoryBatch: async (id) => {
    const res = await fetch(`${API_BASE}/inventory/batches/${id}`);
    if (!res.ok) throw new Error('Failed to fetch batch receiving details');
    return res.json();
  },

  getNextBatchInfo: async () => {
    const res = await fetch(`${API_BASE}/inventory/next-batch-info`);
    if (!res.ok) throw new Error('Failed to fetch next batch information');
    return res.json();
  },

  // Seed sample database
  seedDatabase: async () => {
    const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to seed database');
    return result;
  },
};

