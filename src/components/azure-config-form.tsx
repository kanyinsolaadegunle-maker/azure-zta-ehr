'use client';

import React, { useState } from 'react';
import { updateSystemSettingAction } from '../app/actions';
import { Loader2, ShieldCheck, AlertCircle, DollarSign, Wrench } from 'lucide-react';

interface AzureConfigFormProps {
  initialBudgetLimit: string;
  initialBudgetSpent: string;
}

export function AzureConfigForm({
  initialBudgetLimit,
  initialBudgetSpent,
}: AzureConfigFormProps) {
  const [limit, setLimit] = useState(initialBudgetLimit);
  const [spent, setSpent] = useState(parseFloat(initialBudgetSpent));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await updateSystemSettingAction('budget_threshold', limit);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update budget limit.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSpend = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const newSpent = spent + 1.25;
      await updateSystemSettingAction('budget_spent', newSpent.toFixed(2));
      setSpent(newSpent);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger simulated spend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-lg text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-950/20 border border-green-500/20 p-3 rounded-lg text-xs text-green-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Setting updated successfully in Azure Portal config!</span>
        </div>
      )}

      <form onSubmit={handleUpdateLimit} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
        <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2 mb-2">
          <Wrench className="w-4 h-4 text-blue-400" />
          <h4 className="text-xs font-bold text-slate-200">Adjust Monthly Cost Budget</h4>
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500">Threshold Alert Limit ($)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="1.00"
              required
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-xs transition flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Limit
            </button>
          </div>
        </div>
      </form>

      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
        <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
          <DollarSign className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-bold text-slate-200">Trigger Spend Simulator</h4>
        </div>
        
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Trigger simulated cloud expenditures (representing VM compute hours or data queries) to test cost alert notifications.
        </p>

        <button
          onClick={handleSimulateSpend}
          disabled={loading}
          className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          + Simulate Cloud Spend (+ $1.25)
        </button>

        <div className="text-[9px] text-slate-500 text-center font-mono">
          Current simulated spend: ${spent.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
