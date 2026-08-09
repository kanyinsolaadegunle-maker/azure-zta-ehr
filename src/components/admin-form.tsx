'use client';

import React, { useState } from 'react';
import { addAdminRecordAction } from '../app/actions';
import { Plus, Check, Loader2, AlertCircle } from 'lucide-react';

export function AdminForm({ patientId }: { patientId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    recordType: 'appointment' as 'appointment' | 'billing',
    title: '',
    details: '',
    amount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const amtVal = formData.recordType === 'billing' ? parseFloat(formData.amount) || 0 : undefined;
      await addAdminRecordAction(patientId, {
        recordType: formData.recordType,
        title: formData.title,
        details: formData.details,
        amount: amtVal,
      });
      setSuccess(true);
      setFormData({
        recordType: 'appointment',
        title: '',
        details: '',
        amount: '',
      });
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to record administrative entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition"
      >
        <Plus className="w-4 h-4" /> Add Record Entry
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-45 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Add Non-Clinical Record</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-lg text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-950/20 border border-green-500/20 p-3 rounded-lg text-xs text-green-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Administrative record added successfully!</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Record Type</label>
                <select
                  value={formData.recordType}
                  onChange={(e) => setFormData({ ...formData, recordType: e.target.value as 'appointment' | 'billing' })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-500"
                >
                  <option value="appointment">Appointment Event</option>
                  <option value="billing">Billing Invoice</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Title / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Specialized Cardiology Consult"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {formData.recordType === 'billing' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Invoice Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 150.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Description / Details</label>
                <textarea
                  required
                  placeholder="Enter details of this event..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-semibold text-white transition flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
