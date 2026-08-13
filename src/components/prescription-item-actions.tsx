'use client';

import React, { useState } from 'react';
import { updatePrescriptionAction, deletePrescriptionAction } from '../app/actions';
import { Edit, Trash2, X, Check, AlertTriangle, Loader2 } from 'lucide-react';

interface PrescriptionItemActionsProps {
  rxId: string;
  currentStatus: string;
  currentMedication: string;
  currentStrength: string;
  currentDose: string;
  currentFrequency: string;
  currentInstructions: string;
  isDoctor: boolean;
}

export function PrescriptionItemActions({
  rxId,
  currentStatus,
  currentMedication,
  currentStrength,
  currentDose,
  currentFrequency,
  currentInstructions,
  isDoctor,
}: PrescriptionItemActionsProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState(currentStatus || 'Active');
  const [medication, setMedication] = useState(currentMedication || '');
  const [strength, setStrength] = useState(currentStrength || '');
  const [dose, setDose] = useState(currentDose || '');
  const [frequency, setFrequency] = useState(currentFrequency || '');
  const [instructions, setInstructions] = useState(currentInstructions || '');

  if (!isDoctor) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const res = await updatePrescriptionAction(rxId, {
        status,
        medication,
        strength,
        dose,
        frequency,
        specialInstructions: instructions,
      });

      if (res.success) {
        setShowEditModal(false);
      } else {
        setError(res.error || 'Failed to update prescription.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update prescription.');
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    setIsPending(true);
    setError(null);

    try {
      const res = await deletePrescriptionAction(rxId);
      if (res.success) {
        setIsDeleting(false);
      } else {
        setError(res.error || 'Failed to remove prescription.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to remove prescription.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center space-x-1.5">
      <button
        onClick={() => setShowEditModal(true)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition flex items-center gap-1 text-[11px] font-semibold"
        title="Edit Prescription"
      >
        <Edit className="w-3.5 h-3.5" />
        <span>Edit</span>
      </button>

      <button
        onClick={() => setIsDeleting(true)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition flex items-center gap-1 text-[11px] font-semibold"
        title="Remove Prescription"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Remove</span>
      </button>

      {/* Edit Prescription Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-white text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Edit Prescription ({rxId})</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="bg-rose-950/60 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Discontinued">Discontinued</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Medication Name</label>
                  <input
                    type="text"
                    required
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Strength</label>
                  <input
                    type="text"
                    required
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dose</label>
                  <input
                    type="text"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frequency</label>
                  <input
                    type="text"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Special Instructions</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take after meal"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center space-x-1.5 shadow-md"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save Changes</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4 text-white text-left">
            <div className="flex items-center space-x-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold">Confirm Prescription Removal</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove prescription <span className="font-mono font-bold text-white">{rxId}</span>? This clinical action will be recorded in the security audit evidence log.
            </p>

            {error && (
              <p className="text-xs text-rose-400 font-mono bg-rose-950/60 p-2 rounded-lg border border-rose-500/20">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setIsDeleting(false)}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1.5 shadow-md"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Remove Prescription</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
