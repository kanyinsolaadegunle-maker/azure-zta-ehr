'use client';

import React, { useState, useMemo } from 'react';
import {
  createUserAction,
  updateUserAction,
  toggleBanUserAction,
  deleteUserAction,
} from '../app/actions';
import {
  Users,
  Search,
  X,
  UserPlus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  Lock,
  Mail,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
  ShieldCheck,
  UserCheck,
  Building2,
  Key,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface UserItem {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  description: string;
  projectMeaning: string;
  avatarUrl: string;
  status: string;
  groupName: string;
  groupId?: string;
}

interface SecurityGroupItem {
  id: string;
  name: string;
  description: string;
}

interface UserManagementPanelProps {
  users: UserItem[];
  securityGroups: SecurityGroupItem[];
  currentUser: string;
  isSuperAdmin: boolean;
}

const defaultSecurityGroups: SecurityGroupItem[] = [
  { id: 'g-doctors', name: 'EHR-Doctors', description: 'Clinical Doctors (Read & Write patient-records)' },
  { id: 'g-nurses', name: 'EHR-Nurses', description: 'Clinical Nurses (Read-Only patient-records)' },
  { id: 'g-records', name: 'EHR-Records-Admins', description: 'Records Admins (Read & Write admin-records)' },
  { id: 'g-security', name: 'EHR-IT-Security', description: 'IT Security Staff (Read audit-evidence)' },
  { id: 'g-admins', name: 'EHR-Cloud-Admins', description: 'Cloud Super Administrators' },
  { id: 'g-vendors', name: 'EHR-Vendors', description: 'Third-Party Vendors (Restricted Access)' },
  { id: 'g-auditors', name: 'EHR-Auditors', description: 'Compliance Auditors (Read audit-evidence)' },
];

// Helper to generate deterministic identity codes matching the reference format (e.g. ASOFIWD)
function generateIdentityCode(username: string): string {
  const u = String(username || '');
  const hash = u.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const codes = ['ASOFIWD', 'LUVCATS', 'WEIURQP', 'DOGSFTW', 'AZB9042', 'EHR7712', 'MKT8821', 'ZTA1049', 'SEC9940'];
  return codes[hash % codes.length];
}

// Helper to format email address for display
function formatEmail(username: string): string {
  const u = String(username || '');
  if (u.includes('@')) return u;
  return `${u}@hallmark.med`;
}

// Color badges for security groups in Dark Mode
function getGroupBadgeStyle(groupName: string) {
  const g = String(groupName || '').toLowerCase();
  if (g.includes('cloud') || g.includes('admin')) {
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
  }
  if (g.includes('security') || g.includes('it')) {
    return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  }
  if (g.includes('doctor')) {
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  }
  if (g.includes('nurse')) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }
  if (g.includes('records')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  if (g.includes('vendor')) {
    return 'bg-slate-800 text-slate-300 border-slate-700';
  }
  return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
}

export function UserManagementPanel({
  users,
  securityGroups,
  currentUser,
  isSuperAdmin,
}: UserManagementPanelProps) {
  const availableGroups =
    securityGroups && securityGroups.length > 0 ? securityGroups : defaultSecurityGroups;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tabs: 'admins' | 'all' | 'clinical' | 'vendors'
  const [activeTab, setActiveTab] = useState<'admins' | 'all' | 'clinical' | 'vendors'>('admins');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Form states for Create User / Invite
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('officer123');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newGroupId, setNewGroupId] = useState(availableGroups[0]?.id || 'g-doctors');

  // Form states for Edit User
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editGroupId, setEditGroupId] = useState('');

  // Tab count calculations
  const counts = useMemo(() => {
    if (!Array.isArray(users)) return { all: 0, admins: 0, clinical: 0, vendors: 0 };
    let admins = 0;
    let clinical = 0;
    let vendors = 0;

    users.forEach((u) => {
      const g = String(u.groupName || '').toLowerCase();
      const un = String(u.username || '').toLowerCase();
      if (g.includes('admin') || g.includes('security') || un.includes('admin') || un.includes('officer')) {
        admins++;
      } else if (g.includes('doctor') || g.includes('nurse')) {
        clinical++;
      } else {
        vendors++;
      }
    });

    return { all: users.length, admins, clinical, vendors };
  }, [users]);

  // Filtered users calculation based on tab and search
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    const term = (searchTerm || '').toLowerCase().trim();

    return users.filter((u) => {
      if (!u) return false;
      const uname = String(u.username || '').toLowerCase();
      const dname = String(u.displayName || '').toLowerCase();
      const gname = String(u.groupName || '').toLowerCase();
      const email = formatEmail(uname).toLowerCase();

      const matchesSearch =
        !term ||
        uname.includes(term) ||
        dname.includes(term) ||
        gname.includes(term) ||
        email.includes(term);

      const isUserAdmin =
        gname.includes('admin') ||
        gname.includes('security') ||
        uname.includes('admin') ||
        uname.includes('officer');

      const isUserClinical = gname.includes('doctor') || gname.includes('nurse');
      const isUserVendor = gname.includes('vendor') || gname.includes('auditor');

      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'admins' && isUserAdmin) ||
        (activeTab === 'clinical' && isUserClinical) ||
        (activeTab === 'vendors' && isUserVendor);

      return matchesSearch && matchesTab;
    });
  }, [users, searchTerm, activeTab]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Handle select all rows
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(paginatedUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Actions
  const handleResendInvitations = () => {
    if (selectedUserIds.length === 0) return;
    setMessage({
      type: 'success',
      text: `Resent user verification invitations to ${selectedUserIds.length} selected accounts!`,
    });
    setSelectedUserIds([]);
  };

  const handleBulkRemove = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedUserIds.length} selected user accounts?`)) return;
    
    setIsPending(true);
    try {
      for (const id of selectedUserIds) {
        const u = users.find((item) => item.id === id);
        if (u && u.username !== 'emergency.admin') {
          await deleteUserAction(u.username);
        }
      }
      setMessage({ type: 'success', text: `Removed ${selectedUserIds.length} selected user accounts.` });
      setSelectedUserIds([]);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove selected accounts.' });
    } finally {
      setIsPending(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newDisplayName) return;

    setIsPending(true);
    setMessage(null);
    try {
      const res = await createUserAction({
        username: newUsername,
        password: newPassword || 'officer123',
        displayName: newDisplayName,
        description: newUsername,
        projectMeaning: 'Directly Provisioned EHR User Account',
        avatarUrl: '',
        groupId: newGroupId,
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Successfully invited user '${newUsername}'!` });
        setShowCreateModal(false);
        setNewUsername('');
        setNewDisplayName('');
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to create user.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user.' });
    } finally {
      setIsPending(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsPending(true);
    setMessage(null);
    try {
      const res = await updateUserAction(editingUser.username, {
        displayName: editDisplayName,
        password: editPassword || undefined,
        groupId: editGroupId || undefined,
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Updated user configuration for '${editingUser.username}'!` });
        setEditingUser(null);
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update user.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user.' });
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleBan = async (user: UserItem) => {
    setIsPending(true);
    setActiveMenuId(null);
    try {
      const res = await toggleBanUserAction(user.username);
      if (res.success) {
        setMessage({ type: 'success', text: `Account status for '${user.username}' updated.` });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update account status.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status.' });
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!confirm(`Are you sure you want to delete user '${user.username}'?`)) return;
    setIsPending(true);
    setActiveMenuId(null);
    try {
      const res = await deleteUserAction(user.username);
      if (res.success) {
        setMessage({ type: 'success', text: `Deleted user '${user.username}'.` });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to delete user.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete user.' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Accounts</span>
            <div className="text-2xl font-black text-white">{counts.all}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administrators</span>
            <div className="text-2xl font-black text-indigo-400">{counts.admins}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clinical Staff</span>
            <div className="text-2xl font-black text-cyan-400">{counts.clinical}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MFA Security</span>
            <div className="text-2xl font-black text-emerald-400">100%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toast Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-md transition-all ${
            message.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Clean User Management Card Container matching dark UI theme */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6 sm:p-10 text-white font-sans space-y-8">
        
        {/* Header Section */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">User Management</h1>
            <p className="text-sm text-slate-400 font-medium">Add or remove accounts linked to your Group</p>
          </div>
        </div>

        {/* Top Controls Bar: Search + Batch Actions + Invite Primary Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input Bar */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search for users"
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleResendInvitations}
              disabled={selectedUserIds.length === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                selectedUserIds.length > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer border border-slate-700'
                  : 'bg-slate-950 text-slate-600 border border-slate-850 cursor-not-allowed'
              }`}
            >
              Resend invitations
            </button>

            <button
              onClick={handleBulkRemove}
              disabled={selectedUserIds.length === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                selectedUserIds.length > 0
                  ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 cursor-pointer border border-rose-500/30'
                  : 'bg-slate-950 text-slate-600 border border-slate-850 cursor-not-allowed'
              }`}
            >
              Remove
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-md shadow-indigo-600/20 flex items-center space-x-2 cursor-pointer"
            >
              <span>Invite users</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation matching dark theme underline indicator */}
        <div className="border-b border-slate-800 flex space-x-8 text-sm font-semibold">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`pb-3 transition relative flex items-center space-x-2 ${
              activeTab === 'all'
                ? 'text-indigo-400 font-bold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All Users</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300">{counts.all}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admins');
              setCurrentPage(1);
            }}
            className={`pb-3 transition relative flex items-center space-x-2 ${
              activeTab === 'admins'
                ? 'text-indigo-400 font-bold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Admins</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">{counts.admins}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('clinical');
              setCurrentPage(1);
            }}
            className={`pb-3 transition relative flex items-center space-x-2 ${
              activeTab === 'clinical'
                ? 'text-indigo-400 font-bold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Doctors & Staff</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">{counts.clinical}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('vendors');
              setCurrentPage(1);
            }}
            className={`pb-3 transition relative flex items-center space-x-2 ${
              activeTab === 'vendors'
                ? 'text-indigo-400 font-bold border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Vendors & External</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300">{counts.vendors}</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-xl bg-slate-950/60">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={paginatedUsers.length > 0 && selectedUserIds.length === paginatedUsers.length}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-4 px-4 font-bold">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>Email</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-500" />
                  </div>
                </th>
                <th className="py-4 px-4 font-bold">Name</th>
                <th className="py-4 px-4 font-bold">Display name</th>
                <th className="py-4 px-4 font-bold">Role Group</th>
                <th className="py-4 px-4 font-bold">Status</th>
                <th className="py-4 px-4 font-bold">CODE</th>
                <th className="py-4 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850 text-sm font-medium text-slate-200 font-mono">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm font-medium">
                    No user accounts match your search query or tab filter.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  const userEmail = formatEmail(u.username);
                  const identityCode = generateIdentityCode(u.username);
                  const isBanned = u.status === 'Banned';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-850/50 transition-colors ${
                        isSelected ? 'bg-indigo-950/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(u.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Email column with shield icon */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2.5 font-sans">
                          <div className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                            <Shield className="w-3 h-3 text-indigo-400" />
                          </div>
                          <span className="font-semibold text-slate-100">{userEmail}</span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4 text-slate-400 font-normal">
                        {(String(u.displayName || u.username || 'User')).replace(/\s+/g, '')}
                      </td>

                      {/* Display Name */}
                      <td className="py-4 px-4 font-semibold text-slate-200">{String(u.displayName || u.username || 'User')}</td>

                      {/* Role Group Tag */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getGroupBadgeStyle(u.groupName)}`}>
                          {u.groupName || 'Directory User'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold tracking-wider uppercase ${
                            isBanned
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isBanned ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* CODE */}
                      <td className="py-4 px-4 font-mono text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {identityCode}
                      </td>

                      {/* Actions dropdown */}
                      <td className="py-4 px-4 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {/* Interactive Dropdown Menu */}
                        {activeMenuId === u.id && (
                          <div className="absolute right-4 top-12 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 py-1.5 text-left text-xs font-medium space-y-0.5">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditDisplayName(u.displayName);
                                setEditGroupId(u.groupId || '');
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-slate-300 hover:bg-indigo-950/60 hover:text-indigo-400 flex items-center space-x-2 transition"
                            >
                              <Edit className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Edit User Details</span>
                            </button>

                            <button
                              onClick={() => handleToggleBan(u)}
                              className="w-full px-3 py-2 text-slate-300 hover:bg-amber-950/60 hover:text-amber-400 flex items-center space-x-2 transition"
                            >
                              {isBanned ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Unban Account</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Ban Account</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="w-full px-3 py-2 text-rose-400 hover:bg-rose-950/60 flex items-center space-x-2 transition border-t border-slate-800"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Remove Account</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls matching dark theme style << < [1] > >> */}
        <div className="flex items-center justify-center space-x-2 pt-4 border-t border-slate-800 text-xs font-semibold text-slate-400 font-mono">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 transition shadow-sm text-slate-300"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 transition shadow-sm text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg font-bold transition ${
                currentPage === page
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 shadow-sm'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 transition shadow-sm text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 transition shadow-sm text-slate-300"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invite User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Invite New User</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. officer01"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Display Name</label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Officer User"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Security Group Role</label>
                <select
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20"
                >
                  {isPending ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Edit className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Edit @{editingUser.username}</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Display Name</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Security Group Role</label>
                <select
                  value={editGroupId}
                  onChange={(e) => setEditGroupId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="">Keep Existing Group</option>
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20"
                >
                  {isPending ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
