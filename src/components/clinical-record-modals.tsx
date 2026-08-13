'use client';

import React, { useState } from 'react';
import {
  updatePatientVitalsAction,
  addPatientAllergyAction,
  addPatientImmunizationAction,
  addPatientLabResultAction,
  updatePatientLabResultAction,
} from '../app/actions';
import { X, Heart, Droplet, ShieldCheck, AlertCircle, FileSpreadsheet, Edit, Trash2 } from 'lucide-react';

interface UpdateVitalsModalProps {
  patientId: string;
  currentVitals?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateVitalsModal({
  patientId,
  currentVitals,
  isOpen,
  onClose,
  onSuccess,
}: UpdateVitalsModalProps) {
  const [bloodPressure, setBloodPressure] = useState(currentVitals?.bloodPressure || '120/80');
  const [heartRate, setHeartRate] = useState(currentVitals?.heartRate ? String(currentVitals.heartRate) : '72');
  const [temperature, setTemperature] = useState(currentVitals?.temperature || '98.6 °F');
  const [oxygenSaturation, setOxygenSaturation] = useState(currentVitals?.oxygenSaturation ? String(currentVitals.oxygenSaturation) : '99');
  const [height, setHeight] = useState(currentVitals?.height || "5'10\"");
  const [weight, setWeight] = useState(currentVitals?.weight || '165 lbs');
  const [bmi, setBMI] = useState(currentVitals?.bmi || '23.7');
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg('');

    const res = await updatePatientVitalsAction(patientId, {
      bloodPressure,
      heartRate: parseInt(heartRate) || 72,
      temperature,
      oxygenSaturation: parseInt(oxygenSaturation) || 99,
      height,
      weight,
      bmi,
    });

    setIsPending(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to update vitals');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 text-red-400">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Update Vital Signs</h3>
              <p className="text-xs text-slate-400">Record latest patient vitals ({patientId})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block font-bold mb-1">Blood Pressure</label>
              <input
                type="text"
                required
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                placeholder="120/80"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                required
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                placeholder="72"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">Temperature</label>
              <input
                type="text"
                required
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="98.6 °F"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">O2 Saturation (%)</label>
              <input
                type="number"
                required
                value={oxygenSaturation}
                onChange={(e) => setOxygenSaturation(e.target.value)}
                placeholder="99"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">Height</label>
              <input
                type="text"
                required
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="5'10&quot;"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">Weight / BMI</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="165 lbs"
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  required
                  value={bmi}
                  onChange={(e) => setBMI(e.target.value)}
                  placeholder="23.7"
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white transition flex items-center gap-2"
            >
              {isPending ? 'Saving...' : 'Save Vital Signs'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddAllergyModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAllergyModal({
  patientId,
  isOpen,
  onClose,
  onSuccess,
}: AddAllergyModalProps) {
  const [allergen, setAllergen] = useState('');
  const [reaction, setReaction] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg('');

    const res = await addPatientAllergyAction(patientId, { allergen, reaction });

    setIsPending(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to add allergy');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20 text-orange-400">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Document Drug Allergy</h3>
              <p className="text-xs text-slate-400">Add allergen & reaction ({patientId})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block font-bold mb-1">Allergen / Substance</label>
            <input
              type="text"
              required
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
              placeholder="e.g. Penicillin VK, Codeine, Peanuts"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block font-bold mb-1">Observed Clinical Reaction</label>
            <input
              type="text"
              required
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="e.g. Anaphylaxis, Urticaria, Facial Rash"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 font-bold text-white transition flex items-center gap-2"
            >
              {isPending ? 'Documenting...' : 'Add Allergy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddImmunizationModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddImmunizationModal({
  patientId,
  isOpen,
  onClose,
  onSuccess,
}: AddImmunizationModalProps) {
  const [vaccine, setVaccine] = useState('');
  const [dateAdministered, setDateAdministered] = useState(new Date().toISOString().split('T')[0]);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg('');

    const res = await addPatientImmunizationAction(patientId, { vaccine, dateAdministered });

    setIsPending(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to add immunization');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/20 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Record Immunization</h3>
              <p className="text-xs text-slate-400">Add vaccine record ({patientId})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block font-bold mb-1">Vaccine Name & Dose</label>
            <input
              type="text"
              required
              value={vaccine}
              onChange={(e) => setVaccine(e.target.value)}
              placeholder="e.g. Influenza Quadrivalent, Tdap Booster"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block font-bold mb-1">Date Administered</label>
            <input
              type="date"
              required
              value={dateAdministered}
              onChange={(e) => setDateAdministered(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-white transition flex items-center gap-2"
            >
              {isPending ? 'Recording...' : 'Record Immunization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddLabReportModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLabReportModal({
  patientId,
  isOpen,
  onClose,
  onSuccess,
}: AddLabReportModalProps) {
  const [panelName, setPanelName] = useState('Comprehensive Metabolic Panel');
  const [testName, setTestName] = useState('Fasting Blood Glucose');
  const [resultValue, setResultValue] = useState('105 mg/dL');
  const [referenceRange, setReferenceRange] = useState('70 - 99 mg/dL');
  const [flag, setFlag] = useState('HIGH');
  const [comments, setComments] = useState('Mild elevation noted. Recommend dietary modification and re-check in 8 weeks.');
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg('');

    const res = await addPatientLabResultAction(patientId, {
      panelName,
      testName,
      resultValue,
      referenceRange,
      flag,
      comments,
    });

    setIsPending(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to record lab report');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Order / Record Laboratory Report</h3>
              <p className="text-xs text-slate-400">Add lab diagnostic result ({patientId})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block font-bold mb-1">Panel Name</label>
              <input
                type="text"
                required
                value={panelName}
                onChange={(e) => setPanelName(e.target.value)}
                placeholder="e.g. Lipid Panel, Hemoglobin A1c"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">Test Name</label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. Fasting Glucose"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">Result Value</label>
              <input
                type="text"
                required
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                placeholder="e.g. 118 mg/dL, 6.2%"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">Reference Range</label>
              <input
                type="text"
                required
                value={referenceRange}
                onChange={(e) => setReferenceRange(e.target.value)}
                placeholder="e.g. 70 - 99 mg/dL"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block font-bold mb-1">Clinical Flag</label>
            <select
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
              <option value="LOW">LOW</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block font-bold mb-1">Pathologist / Doctor Comments</label>
            <textarea
              rows={2}
              required
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Clinical comments or diagnostic notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition flex items-center gap-2"
            >
              {isPending ? 'Recording...' : 'Record Lab Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditLabReportModalProps {
  patientId: string;
  labValue: any;
  currentComments?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditLabReportModal({
  patientId,
  labValue,
  currentComments,
  isOpen,
  onClose,
  onSuccess,
}: EditLabReportModalProps) {
  const [panelName, setPanelName] = useState(labValue?.panelName || 'Comprehensive Metabolic Panel');
  const [testName, setTestName] = useState(labValue?.testName || 'Fasting Blood Glucose');
  const [resultValue, setResultValue] = useState(labValue?.resultValue || '105 mg/dL');
  const [referenceRange, setReferenceRange] = useState(labValue?.referenceRange || '70 - 99 mg/dL');
  const [flag, setFlag] = useState(labValue?.flag || 'NORMAL');
  const [comments, setComments] = useState(currentComments || '');
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state if labValue changes
  React.useEffect(() => {
    if (labValue) {
      setPanelName(labValue.panelName || 'Comprehensive Metabolic Panel');
      setTestName(labValue.testName || 'Fasting Blood Glucose');
      setResultValue(labValue.resultValue || '');
      setReferenceRange(labValue.referenceRange || '');
      setFlag(labValue.flag || 'NORMAL');
      setComments(currentComments || '');
    }
  }, [labValue, currentComments]);

  if (!isOpen || !labValue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg('');

    const res = await updatePatientLabResultAction(patientId, labValue.id, {
      panelName,
      testName,
      resultValue,
      referenceRange,
      flag,
      comments,
    });

    setIsPending(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to update lab result');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20 text-blue-400">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Edit Lab Result</h3>
              <p className="text-xs text-slate-400">Modify test result & comments ({patientId})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block font-bold mb-1">Panel Name</label>
              <input
                type="text"
                required
                value={panelName}
                onChange={(e) => setPanelName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">Test Name</label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">Result Value</label>
              <input
                type="text"
                required
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block font-bold mb-1">Reference Range</label>
              <input
                type="text"
                required
                value={referenceRange}
                onChange={(e) => setReferenceRange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block font-bold mb-1">Clinical Flag</label>
            <select
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
              <option value="LOW">LOW</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block font-bold mb-1">Pathologist / Doctor Comments</label>
            <textarea
              rows={2}
              required
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white transition flex items-center gap-2"
            >
              {isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
