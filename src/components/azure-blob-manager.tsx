'use client';

import React, { useState } from 'react';
import {
  Database,
  PlusCircle,
  ShieldCheck,
  HardDrive,
  Lock,
  Unlock,
  Key,
  CheckCircle2,
  Trash2,
  Edit,
  X,
  Sparkles,
  Server,
  Cloud,
  FileCode,
} from 'lucide-react';

interface BlobContainer {
  id: string;
  name: string;
  accessLevel: 'Private' | 'Blob' | 'Container';
  requiredGroup: string;
  encryption: 'Customer-Managed Key' | 'Microsoft-Managed Key';
  recordCount: number;
  sizeGb: string;
  status: 'Active' | 'Archived';
}

interface AzureBlobManagerProps {
  storageAccount: string;
  resourceGroup: string;
  isSuperAdmin: boolean;
}

const initialContainers: BlobContainer[] = [
  {
    id: 'cnt-1',
    name: 'patient-records',
    accessLevel: 'Private',
    requiredGroup: 'EHR-Doctors / EHR-Nurses',
    encryption: 'Customer-Managed Key',
    recordCount: 1420,
    sizeGb: '14.2 GB',
    status: 'Active',
  },
  {
    id: 'cnt-2',
    name: 'admin-records',
    accessLevel: 'Private',
    requiredGroup: 'EHR-Records-Admins',
    encryption: 'Customer-Managed Key',
    recordCount: 890,
    sizeGb: '8.4 GB',
    status: 'Active',
  },
  {
    id: 'cnt-3',
    name: 'audit-evidence',
    accessLevel: 'Private',
    requiredGroup: 'EHR-IT-Security / EHR-Auditors',
    encryption: 'Customer-Managed Key',
    recordCount: 4520,
    sizeGb: '32.1 GB',
    status: 'Active',
  },
];

export function AzureBlobManager({
  storageAccount,
  resourceGroup,
  isSuperAdmin,
}: AzureBlobManagerProps) {
  const [containers, setContainers] = useState<BlobContainer[]>(initialContainers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [connectionString, setConnectionString] = useState(
    'DefaultEndpointsProtocol=https;AccountName=hallmarkztestorage;AccountKey=wB9x...;EndpointSuffix=core.windows.net'
  );
  const [showConnKey, setShowConnKey] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Form states for adding container
  const [newContainerName, setNewContainerName] = useState('');
  const [newAccessLevel, setNewAccessLevel] = useState<'Private' | 'Blob' | 'Container'>('Private');
  const [newRequiredGroup, setNewRequiredGroup] = useState('EHR-Doctors');
  const [newEncryption, setNewEncryption] = useState<'Customer-Managed Key' | 'Microsoft-Managed Key'>(
    'Customer-Managed Key'
  );

  const handleAddContainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContainerName) return;

    const formattedName = newContainerName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const newCnt: BlobContainer = {
      id: `cnt-${Date.now().toString().slice(-4)}`,
      name: formattedName,
      accessLevel: newAccessLevel,
      requiredGroup: newRequiredGroup,
      encryption: newEncryption,
      recordCount: 0,
      sizeGb: '0.1 GB',
      status: 'Active',
    };

    setContainers([...containers, newCnt]);
    setStatusMsg(`Successfully provisioned Azure Storage Blob container '${formattedName}'!`);
    setShowAddModal(false);
    setNewContainerName('');
  };

  const handleDeleteContainer = (id: string, name: string) => {
    if (name === 'patient-records' || name === 'admin-records' || name === 'audit-evidence') {
      alert(`System Blob Container '${name}' cannot be deleted because it is linked to active EHR Zero Trust Policies.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete container '${name}'?`)) return;
    setContainers(containers.filter((c) => c.id !== id));
    setStatusMsg(`Deleted Blob container '${name}'.`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Azure Storage & Blob Container Integration Suite
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure Azure Storage Account connection strings, blob containers, and RBAC security policies.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-lg flex items-center gap-1.5 flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Add Azure Blob Container
          </button>
        )}
      </div>

      {statusMsg && (
        <div className="p-3 bg-green-950/40 text-green-300 border border-green-500/30 rounded-xl text-xs flex justify-between items-center">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Storage Account Details & Connection Key */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold">Storage Account Name:</span>
            <span className="font-mono text-blue-400 font-bold">{storageAccount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold">Resource Group:</span>
            <span className="font-mono text-slate-200">{resourceGroup}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold">Primary Region:</span>
            <span className="font-mono text-slate-200">East US 2 (Azure Cloud)</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold">Connection Key / String:</span>
            <button
              onClick={() => setShowConnKey(!showConnKey)}
              className="text-[10px] text-blue-400 hover:underline font-mono"
            >
              {showConnKey ? 'Hide Secret Key' : 'Reveal Connection Key'}
            </button>
          </div>
          <p className="font-mono text-[10px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 break-all truncate">
            {showConnKey ? connectionString : 'DefaultEndpointsProtocol=https;AccountName=hallmarkztestorage;AccountKey=••••••••••••••••;EndpointSuffix=core.windows.net'}
          </p>
        </div>
      </div>

      {/* Blob Containers Directory Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-400" /> Active Azure Storage Blob Containers
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">{containers.length} Containers Provisioned</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {containers.map((c) => (
            <div
              key={c.id}
              className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-slate-750 transition"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-100 text-xs font-mono">{c.name}</h5>
                    <span className="text-[10px] text-emerald-400 font-bold block">{c.sizeGb}</span>
                  </div>
                  <span className="text-[9px] bg-blue-500/10 text-blue-300 font-mono font-bold px-2 py-0.5 rounded border border-blue-500/20">
                    {c.accessLevel} Access
                  </span>
                </div>

                <div className="space-y-1 text-[11px] font-mono text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">RBAC Role:</span>
                    <span className="text-slate-200 truncate max-w-[120px]">{c.requiredGroup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Encryption:</span>
                    <span className="text-slate-200 truncate max-w-[120px]">{c.encryption}</span>
                  </div>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="pt-2 border-t border-slate-850 flex justify-end">
                  <button
                    onClick={() => handleDeleteContainer(c.id, c.name)}
                    className="text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Container
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Azure Blob Container */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-400" /> Provision New Azure Storage Blob Container
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContainer} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">
                  Blob Container Name
                </label>
                <input
                  type="text"
                  required
                  value={newContainerName}
                  onChange={(e) => setNewContainerName(e.target.value)}
                  placeholder="e.g. medical-scans-blob"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">
                  Public Access Level
                </label>
                <select
                  value={newAccessLevel}
                  onChange={(e) => setNewAccessLevel(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 font-mono"
                >
                  <option value="Private">Private (No anonymous read access)</option>
                  <option value="Blob">Blob (Anonymous read access for blobs only)</option>
                  <option value="Container">Container (Anonymous read access for container and blobs)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">
                  Required Entra ID Security Group Role
                </label>
                <select
                  value={newRequiredGroup}
                  onChange={(e) => setNewRequiredGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 font-mono"
                >
                  <option value="EHR-Doctors">EHR-Doctors (Storage Blob Data Contributor)</option>
                  <option value="EHR-Nurses">EHR-Nurses (Storage Blob Data Reader)</option>
                  <option value="EHR-Records-Admins">EHR-Records-Admins (Admin Records Contributor)</option>
                  <option value="EHR-IT-Security">EHR-IT-Security (Audit Logs Reader)</option>
                  <option value="EHR-Cloud-Admins">EHR-Cloud-Admins (Storage Account Contributor)</option>
                  <option value="EHR-Auditors">EHR-Auditors (Compliance Reader)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">
                  Encryption Key Tier
                </label>
                <select
                  value={newEncryption}
                  onChange={(e) => setNewEncryption(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 font-mono"
                >
                  <option value="Customer-Managed Key">Customer-Managed Key (Azure Key Vault)</option>
                  <option value="Microsoft-Managed Key">Microsoft-Managed Key (AES-256)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  Provision Blob Container
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
