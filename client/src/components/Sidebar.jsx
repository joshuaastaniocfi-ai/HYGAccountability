import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  FileCheck2,
  LogOut,
  Boxes,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ChevronUp,
  KeyRound,
  X,
  Menu,
  FilePlus2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AccountModal from './AccountModal';

export default function Sidebar({ isCollapsed, onToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isMobileNavMenuOpen, setIsMobileNavMenuOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  // Other navigation links contained inside the Mobile "Menu" Drop-Up
  const moreNavItems = [
    {
      to: '/items',
      label: 'Equipment & Items',
      description: 'Asset catalog, serials & status',
      icon: Package,
    },
    {
      to: '/stores',
      label: 'Store Branches',
      description: '44 retail branches & custody',
      icon: Store,
    },
    {
      to: '/forms',
      label: 'Accountability Forms',
      description: 'Issuance records & printable forms',
      icon: FileCheck2,
    },
    {
      to: '/forms/new',
      label: 'Issue Equipment',
      description: 'Quick accountability issuance wizard',
      icon: FilePlus2,
    },
  ];

  // Active check if user is on any page within the "Menu" drop-up
  const isOtherActive =
    location.pathname.startsWith('/items') ||
    location.pathname.startsWith('/stores') ||
    location.pathname.startsWith('/forms');

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/inventory', label: 'Inventory by Type', icon: Boxes },
    { to: '/items', label: 'Equipment & Items', icon: Package },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/stores', label: 'Store Branches', icon: Store },
    { to: '/forms', label: 'Accountability Forms', icon: FileCheck2 },
  ];

  return (
    <>
      <aside
        className={`no-print hidden md:flex fixed top-0 bottom-0 left-0 bg-[#091024] text-slate-300 flex-col z-30 border-r border-blue-950/60 shadow-2xl transition-all duration-300 ease-in-out select-none ${
          isCollapsed ? 'w-[76px]' : 'w-64'
        }`}
        style={{
          backgroundImage:
            'radial-gradient(ellipse 160% 70% at 15% -5%, rgba(1, 132, 246, 0.16), transparent 60%)',
        }}
      >
      {/* Brand Header */}
      <div className="p-3.5 border-b border-blue-950/60 shrink-0">
        <div className="flex items-center justify-between min-h-[50px]">
          {isCollapsed ? (
            <div className="w-full flex items-center justify-center relative group">
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-xl hover:bg-white/[0.08] active:scale-95 transition flex items-center justify-center cursor-pointer group-hover:scale-105"
                aria-label="Expand Sidebar"
              >
                <img
                  src="/logo_icon.png"
                  alt="Chawnah Foods Inc."
                  className="w-10 h-10 object-contain filter drop-shadow-md transition-transform"
                />
              </button>

              {/* Floating Tooltip for Logo */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0f1b38] text-white text-xs font-bold rounded-lg shadow-2xl border border-blue-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 transform translate-x-1 group-hover:translate-x-0 flex items-center space-x-1.5">
                <PanelLeftOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Expand Sidebar</span>
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#0f1b38] border-b border-l border-blue-500/30 rotate-45"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 py-0.5 px-1 min-w-0">
                <img
                  src="/website_logo.png"
                  alt="Chawnah Foods Inc."
                  className="h-12 w-auto object-contain filter drop-shadow-md"
                />
              </div>

              <button
                type="button"
                onClick={onToggle}
                title="Collapse Sidebar"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition shrink-0 ml-1 cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Section */}
      <div
        className={`p-3 flex-1 space-y-1.5 ${
          isCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'
        }`}
      >
        {/* Section Label or Divider */}
        {isCollapsed ? (
          <div className="my-2.5 mx-auto w-8 h-px bg-slate-800/80" />
        ) : (
          <div className="text-[10px] font-extrabold text-blue-400/80 uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
            <span>Management</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40"></span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.to} className="relative group">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isCollapsed
                    ? `w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                      }`
                    : `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-l-[3.5px] ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600/25 via-blue-500/10 to-transparent text-white border-blue-400 shadow-xs shadow-blue-500/10'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05] hover:border-slate-600'
                      }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-blue-400'
                            : 'text-slate-400 group-hover:text-blue-300'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400 shrink-0" />
                    )}
                  </>
                )}
              </NavLink>

              {/* Hover Tooltip in Collapsed Mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0c1633] text-white text-xs font-semibold rounded-lg shadow-xl shadow-black/50 border border-blue-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 ease-out z-[60] transform translate-x-1 group-hover:translate-x-0">
                  <span>{item.label}</span>
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#0c1633] border-b border-l border-blue-500/30 rotate-45"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Authenticated Admin User Profile & Logout */}
      {user && (
        <div className="p-2.5 border-t border-blue-950/60 bg-[#070c1c]/90 shrink-0">
          {isCollapsed ? (
            /* Collapsed User & Logout Buttons */
            <div className="flex flex-col items-center space-y-2 py-1">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(true)}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40 hover:scale-105 transition-transform cursor-pointer"
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </button>

                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#0c1633] text-white text-xs rounded-xl shadow-xl shadow-black/50 border border-blue-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 ease-out z-[60] transform translate-x-1 group-hover:translate-x-0">
                  <div className="font-bold text-white leading-tight">
                    {user.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-blue-300 mt-0.5">
                    {user.department || 'IT Department'} &bull; Click to manage
                  </div>
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#0c1633] border-b border-l border-blue-500/30 rotate-45"></div>
                </div>
              </div>

              <div className="relative group">
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition cursor-pointer"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-rose-950/95 text-rose-200 text-xs font-semibold rounded-lg shadow-xl shadow-black/50 border border-rose-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 ease-out z-[60] transform translate-x-1 group-hover:translate-x-0">
                  Sign Out
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-rose-950/95 border-b border-l border-rose-500/30 rotate-45"></div>
                </div>
              </div>
            </div>
          ) : (
            /* Expanded Full User Profile Card */
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-blue-900/30 hover:bg-white/[0.07] transition">
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                title="Click to manage IT account & credentials"
                className="flex items-center space-x-2.5 truncate text-left flex-1 hover:opacity-95 transition group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-blue-600/30 ring-1 ring-blue-400/30 shrink-0 group-hover:scale-105 transition-transform">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="truncate text-left flex-1">
                  <div className="text-xs font-bold text-white truncate leading-tight group-hover:text-blue-300 transition-colors">
                    {user.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span
                      className="font-semibold text-[10px] text-blue-300 truncate max-w-[85px]"
                      title={user.department || 'IT Department'}
                    >
                      {user.department || 'IT Dept'}
                    </span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="truncate text-[10px] text-slate-400 font-mono">
                      @{user.username || 'admin'}
                    </span>
                  </div>
                </div>
              </button>

              <button
                onClick={logout}
                title="Sign Out of Admin Portal"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition shrink-0 ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
      </aside>

      {/* Mobile Experience: Backdrop Overlay when Menu Drop-Up or Profile Sheet is Open */}
      {(isMobileNavMenuOpen || isMobileProfileOpen) && (
        <div
          className="no-print fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => {
            setIsMobileNavMenuOpen(false);
            setIsMobileProfileOpen(false);
          }}
        />
      )}

      {/* Mobile Experience: Menu Drop-Up for "Menu" Button */}
      {isMobileNavMenuOpen && (
        <div
          className="no-print fixed bottom-20 left-3 right-3 sm:left-auto sm:right-auto sm:w-[350px] sm:mx-auto max-w-sm mx-auto z-50 rounded-2xl border border-blue-500/35 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(37,99,235,0.25)] md:hidden animate-in fade-in slide-in-from-bottom-4 duration-200 select-none"
          style={{ backgroundColor: '#091024' }}
        >
          {/* Drop-up Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-blue-900/40">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Menu className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-white tracking-wide uppercase">Navigation Menu</h4>
                <p className="text-[9.5px] text-slate-400">Other directories & forms</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileNavMenuOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drop-up Navigation Links */}
          <div className="space-y-1.5">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileNavMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 border border-blue-500/40 text-white shadow-xs shadow-blue-500/20'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-blue-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.9)] shrink-0 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Drop-up downward triangle pointer pointing to middle Menu button */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#091024] border-b border-r border-blue-500/35 rotate-45 pointer-events-none" />
        </div>
      )}

      {/* Mobile Experience: Quick Profile & Credentials Drop-Up */}
      {isMobileProfileOpen && (
        <div
          className="no-print fixed bottom-20 right-3.5 left-auto w-[290px] max-w-[calc(100vw-28px)] z-50 rounded-2xl border border-blue-500/35 p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(37,99,235,0.25)] md:hidden animate-in fade-in slide-in-from-bottom-4 duration-200 text-slate-200 select-none"
          style={{ backgroundColor: '#091024' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-blue-600/40 ring-1 ring-blue-400/40 shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white leading-tight truncate">
                  {user?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-blue-300 flex items-center space-x-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="truncate">{user?.department || 'IT Department'}</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-slate-400 font-mono truncate">@{user?.username || 'admin'}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileProfileOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition shrink-0 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 pt-3">
            <button
              type="button"
              onClick={() => {
                setIsMobileProfileOpen(false);
                setIsAccountModalOpen(true);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-blue-900/30 transition text-left active:scale-[0.98]"
            >
              <KeyRound className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Account & Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMobileProfileOpen(false);
                logout();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/20 transition text-left active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Downward pointer pointing to Profile button on the right */}
          <div className="absolute -bottom-1.5 right-6 w-3.5 h-3.5 bg-[#091024] border-b border-r border-blue-500/35 rotate-45 pointer-events-none" />
        </div>
      )}

      {/* Mobile Experience: Beautiful & Smooth Bottom Navigation Bar (5 Buttons) */}
      <nav
        className="no-print fixed bottom-0 inset-x-0 z-40 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] md:hidden pointer-events-none"
        aria-label="Mobile Bottom Navigation"
      >
        <div
          className="pointer-events-auto mx-2.5 mb-1.5 rounded-2xl border border-blue-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_20px_rgba(37,99,235,0.2)] px-1 py-1.5 flex items-center justify-between select-none"
          style={{
            backgroundColor: '#091024',
            backgroundImage:
              'radial-gradient(ellipse 160% 70% at 50% -20%, rgba(1, 132, 246, 0.22), transparent 70%)',
          }}
        >
          {/* 1. Dashboard */}
          <NavLink
            to="/"
            end
            onClick={() => {
              setIsMobileNavMenuOpen(false);
              setIsMobileProfileOpen(false);
            }}
            className={({ isActive }) =>
              `flex-1 min-w-0 py-1 px-0.5 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-white bg-blue-600/30 ring-1 ring-blue-400/40 shadow-xs shadow-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 shadow-[0_0_8px_rgba(56,189,248,0.95)]" />
                )}
                <LayoutDashboard
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.85)]'
                      : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-[9.5px] tracking-tight mt-1 truncate max-w-full leading-none transition-colors ${
                    isActive ? 'font-bold text-white' : 'font-medium text-slate-400'
                  }`}
                >
                  Dashboard
                </span>
              </>
            )}
          </NavLink>

          {/* 2. Inventory */}
          <NavLink
            to="/inventory"
            onClick={() => {
              setIsMobileNavMenuOpen(false);
              setIsMobileProfileOpen(false);
            }}
            className={({ isActive }) =>
              `flex-1 min-w-0 py-1 px-0.5 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-white bg-blue-600/30 ring-1 ring-blue-400/40 shadow-xs shadow-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 shadow-[0_0_8px_rgba(56,189,248,0.95)]" />
                )}
                <Boxes
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.85)]'
                      : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-[9.5px] tracking-tight mt-1 truncate max-w-full leading-none transition-colors ${
                    isActive ? 'font-bold text-white' : 'font-medium text-slate-400'
                  }`}
                >
                  Inventory
                </span>
              </>
            )}
          </NavLink>

          {/* 3. Menu (Center Drop-Up Button) */}
          <button
            type="button"
            onClick={() => {
              setIsMobileNavMenuOpen(!isMobileNavMenuOpen);
              setIsMobileProfileOpen(false);
            }}
            title="Open Menu"
            className={`flex-1 min-w-0 py-1 px-0.5 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 select-none active:scale-90 ${
              isMobileNavMenuOpen || isOtherActive
                ? 'text-white bg-blue-600/30 ring-1 ring-blue-400/40 shadow-xs shadow-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            {(isMobileNavMenuOpen || isOtherActive) && (
              <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 shadow-[0_0_8px_rgba(56,189,248,0.95)]" />
            )}
            <div className="relative">
              <Menu
                className={`w-5 h-5 transition-transform duration-200 ${
                  isMobileNavMenuOpen || isOtherActive
                    ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.85)]'
                    : 'text-slate-400'
                }`}
              />
              <ChevronUp
                className={`w-2.5 h-2.5 absolute -top-1 -right-2 text-blue-300 transition-transform ${
                  isMobileNavMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
            <span
              className={`text-[9.5px] tracking-tight mt-1 truncate max-w-full leading-none transition-colors ${
                isMobileNavMenuOpen || isOtherActive ? 'font-bold text-white' : 'font-medium text-slate-400'
              }`}
            >
              Menu
            </span>
          </button>

          {/* 4. Employee */}
          <NavLink
            to="/employees"
            onClick={() => {
              setIsMobileNavMenuOpen(false);
              setIsMobileProfileOpen(false);
            }}
            className={({ isActive }) =>
              `flex-1 min-w-0 py-1 px-0.5 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-white bg-blue-600/30 ring-1 ring-blue-400/40 shadow-xs shadow-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 shadow-[0_0_8px_rgba(56,189,248,0.95)]" />
                )}
                <Users
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.85)]'
                      : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-[9.5px] tracking-tight mt-1 truncate max-w-full leading-none transition-colors ${
                    isActive ? 'font-bold text-white' : 'font-medium text-slate-400'
                  }`}
                >
                  Employee
                </span>
              </>
            )}
          </NavLink>

          {/* 5. Profile */}
          <button
            type="button"
            onClick={() => {
              setIsMobileProfileOpen(!isMobileProfileOpen);
              setIsMobileNavMenuOpen(false);
            }}
            title="User Account & Security"
            className={`flex-1 min-w-0 py-1 px-0.5 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 select-none active:scale-90 ${
              isMobileProfileOpen
                ? 'text-white bg-blue-600/30 ring-1 ring-blue-400/40 shadow-xs shadow-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            {isMobileProfileOpen && (
              <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 shadow-[0_0_8px_rgba(56,189,248,0.95)]" />
            )}
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-extrabold text-[9px] flex items-center justify-center ring-1 ring-blue-400/60 shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <span
              className={`text-[9.5px] tracking-tight mt-1 truncate max-w-full leading-none transition-colors ${
                isMobileProfileOpen ? 'font-bold text-white' : 'font-medium text-slate-400'
              }`}
            >
              Profile
            </span>
          </button>
        </div>
      </nav>

      {/* Account Settings & Credentials Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </>
  );
}
