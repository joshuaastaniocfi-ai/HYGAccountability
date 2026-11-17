import React, { useState, useRef, useEffect } from 'react';
import { Store, ChevronDown, Check, Search, X } from 'lucide-react';
import { CHAWNAH_STORES } from '../data/stores';

export default function StoreCombobox({ value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const filteredStores = CHAWNAH_STORES.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (store) => {
    onChange(store);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative text-xs">
      <label className="block font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
        <Store className="w-3.5 h-3.5 text-emerald-600" />
        <span>Select Store / Branch (Combobox) *</span>
        <span className="text-[10px] text-slate-400 font-normal">({CHAWNAH_STORES.length} Official Branches)</span>
      </label>

      {/* Combobox Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition shadow-xs ${
          error
            ? 'border-rose-400 ring-1 ring-rose-400'
            : isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          <Store className="w-4 h-4 text-emerald-600 shrink-0" />
          {value ? (
            <span className="font-bold text-slate-900">{value}</span>
          ) : (
            <span className="text-slate-400">-- Search or choose a Store Branch --</span>
          )}
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180 text-emerald-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu with Search Input */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              placeholder="Type to filter stores (e.g. Savemore, Ormoc, Gaisano)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none py-1"
            />
          </div>

          {/* Stores List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 py-1">
            {filteredStores.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No stores match "<strong>{search}</strong>"
              </div>
            ) : (
              filteredStores.map((store, idx) => {
                const isSelected = value === store;
                return (
                  <div
                    key={store}
                    onClick={() => handleSelect(store)}
                    className={`px-3.5 py-2 flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] text-slate-400 w-5">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <span>{store}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
            Showing {filteredStores.length} of {CHAWNAH_STORES.length} stores
          </div>
        </div>
      )}
    </div>
  );
}

