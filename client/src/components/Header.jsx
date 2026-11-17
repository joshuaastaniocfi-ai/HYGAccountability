import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, UserPlus, PackagePlus, FilePlus } from 'lucide-react';

export default function Header({
  title,
  subtitle,
  onOpenAddEmployee,
  onOpenAddItem,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isFormNew = location.pathname === '/forms/new';
  const isFormDetail = location.pathname.startsWith('/forms/') && !isFormNew;

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 shadow-xs">
      <div className="flex items-center space-x-3 min-w-0">
        <img
          src="/logo_icon.png"
          alt="Chawnah Foods Inc."
          className="w-8 h-8 object-contain md:hidden shrink-0 rounded-lg shadow-2xs"
        />
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">{title}</h2>
          {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>

      {!isFormDetail && (
        <div className="flex items-center flex-wrap gap-2.5">
          {onOpenAddEmployee && (
            <button
              onClick={onOpenAddEmployee}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          )}

          {onOpenAddItem && (
            <button
              onClick={onOpenAddItem}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Add Equipment</span>
            </button>
          )}

          {!isFormNew && (
            <button
              onClick={() => navigate('/forms/new')}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition"
            >
              <FilePlus className="w-4 h-4" />
              <span>Issue Form</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}

