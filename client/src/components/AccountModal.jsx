import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  KeyRound,
  Users,
  CheckCircle2,
  AlertOctagon,
  Building2,
  Mail,
  Calendar,
  Lock,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccountModal({ isOpen, onClose }) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | 'accounts'

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Accounts list state
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // New account state
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Information Technology (IT)');
  const [newRole, setNewRole] = useState('admin');
  const [newPass, setNewPass] = useState('');
  const [addAccountLoading, setAddAccountLoading] = useState(false);
  const [addAccountError, setAddAccountError] = useState(null);
  const [addAccountSuccess, setAddAccountSuccess] = useState(null);

  useEffect(() => {
    if (isOpen && activeTab === 'accounts') {
      fetchAccounts();
    }
  }, [isOpen, activeTab]);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      setPasswordSuccess('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAddAccountError(null);
    setAddAccountSuccess(null);

    if (!newUsername.trim() || !newName.trim() || !newPass) {
      setAddAccountError('Username, Full Name, and Password are required.');
      return;
    }

    setAddAccountLoading(true);
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPass,
          name: newName.trim(),
          email: newEmail.trim(),
          department: newDept,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user account');
      }

      setAddAccountSuccess(`Account ${data.user.username} created successfully!`);
      setShowAddAccount(false);
      setNewUsername('');
      setNewName('');
      setNewEmail('');
      setNewPass('');
      fetchAccounts();
    } catch (err) {
      setAddAccountError(err.message);
    } finally {
      setAddAccountLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">IT Department Account Control</h3>
              <p className="text-xs text-slate-400">
                Manage your credentials and view authorized department accounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-200 bg-slate-50 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'password'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'accounts'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Authorized Accounts</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-5">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-700 border border-emerald-500/30 flex items-center justify-center font-black text-xl shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'I'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-bold text-slate-900">{user?.name || 'IT Administrator'}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                      {user?.role || 'Admin'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user?.department || 'Information Technology (IT)'}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Username
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-800">
                    @{user?.username || 'it.admin'}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Corporate Email
                  </span>
                  <div className="text-xs font-medium text-slate-800 truncate">
                    {user?.email || 'it.admin@chawnahfoods.com'}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned Custody Scope
                  </span>
                  <div className="text-xs font-semibold text-emerald-700">
                    Full Asset & Equipment Authority
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Session Security
                  </span>
                  <div className="text-xs font-medium text-slate-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>JWT Encrypted (7-Day TTL)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md mx-auto">
              {passwordSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center space-x-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{passwordError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {passwordLoading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}

          {/* TAB 3: AUTHORIZED ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">System Accounts</h4>
                  <p className="text-[11px] text-slate-500">
                    Accounts permitted to access the Equipment Accountability Portal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAccount(!showAddAccount)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold transition text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddAccount ? 'Close Form' : 'New Account'}</span>
                </button>
              </div>

              {addAccountSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{addAccountSuccess}</span>
                </div>
              )}

              {/* Add Account Inline Form */}
              {showAddAccount && (
                <form
                  onSubmit={handleCreateAccount}
                  className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 animate-in fade-in duration-100"
                >
                  <h5 className="font-bold text-slate-800 text-xs">Create New Department Account</h5>

                  {addAccountError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                      {addAccountError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Username *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. it.support"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mark Ramos - IT Specialist"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Department</label>
                      <input
                        type="text"
                        value={newDept}
                        onChange={(e) => setNewDept(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Initial Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAccount(false)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addAccountLoading}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm disabled:opacity-50"
                    >
                      {addAccountLoading ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              )}

              {/* Accounts List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {loadingAccounts ? (
                  <div className="p-6 text-center text-slate-400">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">No accounts found.</div>
                ) : (
                  accounts.map((acc) => (
                    <div
                      key={acc._id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {acc.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs flex items-center space-x-2">
                            <span>{acc.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              (@{acc.username})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {acc.department || 'Information Technology (IT)'} &bull;{' '}
                            <span className="text-emerald-700 font-semibold uppercase text-[10px]">
                              {acc.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-slate-400">
                        {acc.lastLogin ? (
                          <span>Active recently</span>
                        ) : (
                          <span className="text-slate-400">Pending initial login</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Chawnah Foods Inc. &bull; IT Asset Operations Security
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

