'use client';

import React, { useState } from 'react';
import { addPrescriptionAction } from '../app/actions';
import { Plus, Check, Loader2, AlertCircle } from 'lucide-react';

export function PrescriptionForm({ patientId }: { patientId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    medication: '',
    strength: '',
    dosageForm: 'Oral Tablet',
    dose: '1 tablet',
    frequency: 'Once daily (morning)',
    route: 'Oral',
    quantity: '90 tablets',
    refills: '3',
    indication: '',
    specialInstructions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await addPrescriptionAction(patientId, formData);
      setSuccess(true);
      setFormData({
        medication: '',
        strength: '',
        dosageForm: 'Oral Tablet',
        dose: '1 tablet',
        frequency: 'Once daily (morning)',
        route: 'Oral',
        quantity: '90 tablets',
        refills: '3',
        indication: '',
        specialInstructions: '',
      });
      // Close modal after delay
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to add prescription due to authorization failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition"
      >
        <Plus className="w-4 h-4" /> Create Prescription
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-40 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm">Issue New Prescription</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar">
              {error && (
                <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-lg text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-950/20 border border-green-500/20 p-3 rounded-lg text-xs text-green-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Prescription recorded and signed electronically!</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Medication Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lisinopril"
                    value={formData.medication}
                    onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Strength</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10 mg"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Dosage Form</label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Oral Tablet">Oral Tablet</option>
                    <option value="Extended-Release Oral Tablet">Extended-Release Oral Tablet</option>
                    <option value="Enteric-Coated Oral Tablet">Enteric-Coated Oral Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Liquid">Liquid</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Dose</label>
                  <input
                    type="text"
                    required
                    value={formData.dose}
                    onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Frequency</label>
                  <input
                    type="text"
                    required
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Route</label>
                  <input
                    type="text"
                    required
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Quantity</label>
                  <input
                    type="text"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Refills Authorized</label>
                  <input
                    type="text"
                    required
                    value={formData.refills}
                    onChange={(e) => setFormData({ ...formData, refills: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Indication</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hypertension"
                  value={formData.indication}
                  onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Special Instructions</label>
                <textarea
                  placeholder="e.g. Take in the morning with food"
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] text-slate-400">
                <span className="font-bold text-slate-300">Physician Digital Signature:</span>
                <p className="font-mono mt-0.5">Dr. Emily Carson, MD [Electronic Signature on File]</p>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold text-white transition flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Sign & Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
