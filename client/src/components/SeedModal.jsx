import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function SeedModal({ isOpen, onClose, onSeeded }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.seedDatabase();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSeeded) onSeeded();
        onClose();
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to seed demo data');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reset & Seed Demo Data</h3>
              <p className="text-xs text-slate-500">Chawnah Foods Inc. asset test records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-900">Sample data successfully restored!</p>
            <p className="text-xs text-slate-500">Reloading fresh records...</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              This will populate your database with realistic records for <strong>Chawnah Foods Inc.</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>7 Employees across Quality Assurance, Logistics, Sales, Operations, IT, and HR</li>
              <li>11 Equipment items (Laptops, rugged QA tablets, barcode scanners, lab instruments)</li>
              <li>Active accountability forms & signed records</li>
              <li>Historical returned records with inspection remarks and ownership logs</li>
            </ul>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSeed}
                disabled={loading}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Restoring Data...' : 'Confirm & Seed Demo Data'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

