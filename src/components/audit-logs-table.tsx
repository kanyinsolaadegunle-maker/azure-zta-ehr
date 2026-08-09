'use client';

import React, { useState, useMemo } from 'react';
import { Download, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  userGroup: string;
  action: string;
  resource: string;
  accessGranted: number;
  riskLevel: string;
  location: string;
  ipAddress: string;
  policyTriggered: string;
  failureReason: string;
}

export function AuditLogsTable({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [policyFilter, setPolicyFilter] = useState('all');

  // Filter logs
  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      const matchesSearch =
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'granted' && log.accessGranted === 1) ||
        (statusFilter === 'blocked' && log.accessGranted === 0);

      const matchesRisk = riskFilter === 'all' || log.riskLevel === riskFilter;

      const matchesPolicy =
        policyFilter === 'all' || log.policyTriggered.toLowerCase().includes(policyFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesRisk && matchesPolicy;
    });
  }, [initialLogs, searchTerm, statusFilter, riskFilter, policyFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Username',
      'Security Group',
      'Action / Operation',
      'Target Resource',
      'Status',
      'IP Address',
      'Location',
      'Risk Level',
      'Policy Enforced',
      'Denial Reason',
    ];

    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.username,
      log.userGroup,
      log.action,
      log.resource,
      log.accessGranted === 1 ? 'Granted' : 'Blocked',
      log.ipAddress,
      log.location,
      log.riskLevel,
      log.policyTriggered,
      log.failureReason,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zta_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by User, Action, Resource or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 placeholder-slate-500"
          />
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-orange-500"
        >
          <option value="all">All Access Statuses</option>
          <option value="granted">Granted Only</option>
          <option value="blocked">Blocked Only</option>
        </select>

        {/* Risk */}
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-orange-500"
        >
          <option value="all">All Risk Levels</option>
          <option value="Low">Low Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="High">High Risk</option>
        </select>

        {/* Policy */}
        <select
          value={policyFilter}
          onChange={(e) => setPolicyFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-orange-500"
        >
          <option value="all">All Rule Policies</option>
          <option value="CA001">CA001 (EHR Users MFA)</option>
          <option value="CA002">CA002 (High Risk Block)</option>
          <option value="CA003">CA003 (Medium Risk MFA)</option>
          <option value="CA004">CA004 (Admin MFA)</option>
          <option value="RBAC">Azure RBAC Checks</option>
        </select>
      </div>

      {/* Export & Count */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400">
          Showing <span className="font-bold text-slate-200 font-mono">{filteredLogs.length}</span> audit logs
        </span>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold py-1.5 px-3 rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5 text-orange-400" /> Export Audit Log (.CSV)
        </button>
      </div>

      {/* Table */}
      <div className="border border-slate-850 rounded-xl overflow-hidden text-xs bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950">
              <tr className="text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-850">
                <th className="p-3">Timestamp</th>
                <th className="p-3">User & Group</th>
                <th className="p-3">Operation / Target</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Network Location</th>
                <th className="p-3">CA Policy / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/20">
                    <td className="p-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-200 block font-mono">{log.username}</span>
                      <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{log.userGroup}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-300 block">{log.action}</span>
                      <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{log.resource}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.accessGranted === 1
                            ? 'bg-green-500/10 text-green-300 border border-green-500/25'
                            : 'bg-red-500/10 text-red-300 border border-red-500/25'
                        }`}
                      >
                        {log.accessGranted === 1 ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Granted
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Blocked
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-slate-300 block font-mono">{log.ipAddress}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5 flex items-center gap-1">
                        {log.location} • 
                        <span
                          className={`font-semibold ${
                            log.riskLevel === 'High'
                              ? 'text-red-400'
                              : log.riskLevel === 'Medium'
                              ? 'text-yellow-400'
                              : 'text-green-400'
                          }`}
                        >
                          {log.riskLevel} Risk
                        </span>
                      </span>
                    </td>
                    <td className="p-3 max-w-[200px]">
                      <span className="font-bold text-slate-300 block font-mono text-[10px] truncate">
                        {log.policyTriggered}
                      </span>
                      {log.failureReason && (
                        <span className="text-[10px] text-red-400/90 block mt-0.5 truncate" title={log.failureReason}>
                          {log.failureReason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No matching audit entries found. Try adjusting filters or searching.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
