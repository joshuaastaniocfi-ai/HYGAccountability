import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import PrintableForm from '../components/PrintableForm';
import ReturnModal from '../components/ReturnModal';

export default function FormViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnItem, setSelectedReturnItem] = useState(null);
  const [isBulkReturn, setIsBulkReturn] = useState(false);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const data = await api.getAccountability(id);
      setRecord(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const handleReturnAll = () => {
    setSelectedReturnItem(null);
    setIsBulkReturn(true);
    setIsReturnModalOpen(true);
  };

  const handleReturnComponent = (componentItem) => {
    setSelectedReturnItem(componentItem);
    setIsBulkReturn(false);
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (formData) => {
    await api.returnItems(id, formData);
    await fetchRecord();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading official accountability document...
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-center justify-between">
          <span>Failed to load form: {error || 'Not found'}</span>
          <button
            onClick={() => navigate('/forms')}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold"
          >
            Back to Forms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PrintableForm
        record={record}
        onReturnAll={handleReturnAll}
        onReturnComponent={handleReturnComponent}
      />

      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedReturnItem(null);
        }}
        onSubmit={handleReturnSubmit}
        record={record}
        formId={id}
        item={selectedReturnItem}
        isBulk={isBulkReturn}
      />
    </div>
  );
}

