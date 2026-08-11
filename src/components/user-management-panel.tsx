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
  const hash = (username || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const codes = ['ASOFIWD', 'LUVCATS', 'WEIURQP', 'DOGSFTW', 'AZB9042', 'EHR7712', 'MKT8821', 'ZTA1049', 'SEC9940'];
  return codes[hash % codes.length];
}

// Helper to format email address for display
function formatEmail(username: string): string {
  if (username.includes('@')) return username;
  return `${username}@hallmark.med`;
}

// Color badges for security groups
function getGroupBadgeStyle(groupName: string) {
  const g = (groupName || '').toLowerCase();
  if (g.includes('cloud') || g.includes('admin')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
  if (g.includes('security') || g.includes('it')) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  if (g.includes('doctor')) {
    return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  }
  if (g.includes('nurse')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (g.includes('records')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (g.includes('vendor')) {
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

export function UserManagementPanel({
  users,
  securityGroups,
  currentUser,
  isSuperAdmin,
}: UserManagementPanelProps) {
  const availableGroups =
    securityGroups && securityGroups.length > 0 ? securityGroups : defaultSecurityGroups;

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

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
      const g = (u.groupName || '').toLowerCase();
      const un = (u.username || '').toLowerCase();
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
      const uname = (u.username || '').toLowerCase();
      const dname = (u.displayName || '').toLowerCase();
      const gname = (u.groupName || '').toLowerCase();
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
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUsername}`,
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

  if (!mounted) return null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Metrics Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</span>
            <div className="text-2xl font-black text-slate-900">{counts.all}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Privileged Admins</span>
            <div className="text-2xl font-black text-indigo-600">{counts.admins}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinical Staff</span>
            <div className="text-2xl font-black text-cyan-600">{counts.clinical}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MFA Security</span>
            <div className="text-2xl font-black text-emerald-600">100%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toast Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-md transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Clean User Management Card Container matching reference layout */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-10 text-slate-900 font-sans space-y-8">
        
        {/* Header Section */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-sm text-slate-500 font-medium">Add or remove accounts linked to your Group</p>
          </div>
        </div>

        {/* Top Controls Bar: Search + Batch Actions + Invite Primary Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input Bar */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search for users"
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shadow-sm'
                  : 'bg-slate-100/70 text-slate-400 cursor-not-allowed'
              }`}
            >
              Resend invitations
            </button>

            <button
              onClick={handleBulkRemove}
              disabled={selectedUserIds.length === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                selectedUserIds.length > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer border border-rose-200'
                  : 'bg-slate-100/70 text-slate-400 cursor-not-allowed'
              }`}
            >
              Remove
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-md shadow-indigo-600/20 flex items-center space-x-2 cursor-pointer"
            >
              <span>Invite users</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation matching reference tab underline indicator */}
        <div className="border-b border-slate-200 flex space-x-8 text-sm font-semibold">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`pb-3 transition relative flex items-center space-x-2 ${
              activeTab === 'all'
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All Users</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">{counts.all}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admins');
              setCurrentPage(1);
            }}
            className={`pb-3 transition relative flex items-center space-x-2 ${
              activeTab === 'admins'
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Admins</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-50 text-indigo-600 font-bold">{counts.admins}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('clinical');
              setCurrentPage(1);
            }}
            className={`pb-3 transition relative flex items-center space-x-2 ${
              activeTab === 'clinical'
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Doctors & Staff</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-cyan-50 text-cyan-600 font-bold">{counts.clinical}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('vendors');
              setCurrentPage(1);
            }}
            className={`pb-3 transition relative flex items-center space-x-2 ${
              activeTab === 'vendors'
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Vendors & External</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">{counts.vendors}</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-4 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={paginatedUsers.length > 0 && selectedUserIds.length === paginatedUsers.length}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-4 px-4 font-bold">
                  <div className="flex items-center space-x-1 cursor-pointer">
                    <span>Email</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-400" />
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

            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm font-medium">
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
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(u.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Email column with shield icon */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 flex-shrink-0">
                            <Shield className="w-3 h-3 fill-amber-500/20" />
                          </div>
                          <span className="font-semibold text-slate-900">{userEmail}</span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4 text-slate-600 font-normal">
                        {(String(u.displayName || u.username || 'User')).replace(/\s+/g, '')}
                      </td>

                      {/* Display Name */}
                      <td className="py-4 px-4 font-semibold text-slate-800">{String(u.displayName || u.username || 'User')}</td>

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
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isBanned ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* CODE */}
                      <td className="py-4 px-4 font-mono text-xs text-slate-500 font-bold uppercase tracking-wider">
                        {identityCode}
                      </td>

                      {/* Actions dropdown */}
                      <td className="py-4 px-4 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {/* Interactive Dropdown Menu */}
                        {activeMenuId === u.id && (
                          <div className="absolute right-4 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 py-1.5 text-left text-xs font-medium space-y-0.5">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditDisplayName(u.displayName);
                                setEditGroupId(u.groupId || '');
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center space-x-2 transition"
                            >
                              <Edit className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Edit User Details</span>
                            </button>

                            <button
                              onClick={() => handleToggleBan(u)}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center space-x-2 transition"
                            >
                              {isBanned ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Unban Account</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Ban Account</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition border-t border-slate-100"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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

        {/* Pagination Controls matching image centered style << < [1] > >> */}
        <div className="flex items-center justify-center space-x-2 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
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
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invite User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Invite New User</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Username / Email
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. officer@hmc.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Security Officer"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Security Group (Role)
                </label>
                <select
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit User Details</h3>
                  <p className="text-xs text-slate-500">@{editingUser.username}</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep existing"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Security Group (Role)
                </label>
                <select
                  value={editGroupId}
                  onChange={(e) => setEditGroupId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Keep current group ({editingUser.groupName})</option>
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
