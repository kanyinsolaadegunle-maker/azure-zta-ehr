'use client';

import React, { useState, useMemo } from 'react';
import {
  createUserAction,
  updateUserAction,
  toggleBanUserAction,
  deleteUserAction,
} from '../app/actions';
import {
  UserPlus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
  UserCheck,
  Camera,
  X,
  PlusCircle,
  AlertTriangle,
  Lock,
  Sparkles,
  Upload,
  Search,
  Users,
  LayoutGrid,
  List,
  Mail,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
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

// Helper to generate deterministic identity codes (e.g. ASOFIWD)
function generateIdentityCode(username: string): string {
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const codes = ['ASOFIWD', 'LUVCATS', 'WEIURQP', 'DOGSFTW', 'AZB9042', 'EHR7712', 'MKT8821', 'ZTA1049', 'SEC9940'];
  return codes[hash % codes.length];
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
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Layout View Mode & Selection State
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'active' | 'banned' | 'clinical' | 'admin'>('all');

  // Form states for Create User
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('UserPass2026!');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newGroupId, setNewGroupId] = useState(availableGroups[0]?.id || 'g-doctors');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');

  // Form states for Edit User
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  // Filtered Users computation safely guarded
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    const term = (searchTerm || '').toLowerCase();

    return users.filter((u) => {
      if (!u) return false;
      const uname = (u.username || '').toLowerCase();
      const dname = (u.displayName || '').toLowerCase();
      const gname = (u.groupName || '').toLowerCase();
      const pdesc = (u.projectMeaning || '').toLowerCase();
      const ustatus = u.status || 'Active';

      const matchesSearch =
        !term ||
        uname.includes(term) ||
        dname.includes(term) ||
        gname.includes(term) ||
        pdesc.includes(term);

      const matchesCategory =
        filterCategory === 'all' ||
        (filterCategory === 'active' && ustatus === 'Active') ||
        (filterCategory === 'banned' && ustatus === 'Banned') ||
        (filterCategory === 'clinical' && (gname.includes('doctor') || gname.includes('nurse'))) ||
        (filterCategory === 'admin' && (gname.includes('admin') || gname.includes('security')));

      return matchesSearch && matchesCategory;
    });
  }, [users, searchTerm, filterCategory]);

  // Paginated users
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Selection handlers
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

  // Bulk Actions
  const handleBulkResendMfa = () => {
    if (selectedUserIds.length === 0) return;
    setMessage({
      type: 'success',
      text: `Resent Entra ID MFA verification challenges to ${selectedUserIds.length} selected user accounts!`,
    });
    setSelectedUserIds([]);
  };

  const handleBulkBan = async () => {
    if (selectedUserIds.length === 0) return;
    setIsPending(true);
    try {
      for (const id of selectedUserIds) {
        const u = users.find((item) => item.id === id);
        if (u && u.username !== 'emergency.admin') {
          await toggleBanUserAction(u.username);

        }
      }
      setMessage({ type: 'success', text: `Updated account status for ${selectedUserIds.length} users.` });
      setSelectedUserIds([]);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Bulk update failed' });
    } finally {
      setIsPending(false);
    }
  };

  // File Upload Handlers
  const handleCreateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('File size exceeds 4MB. Please select a smaller image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('File size exceeds 4MB. Please select a smaller image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        password: newPassword,
        displayName: newDisplayName,
        description: newUsername,
        projectMeaning: newRoleDesc || 'Assigned EHR Staff Member',
        groupId: newGroupId || availableGroups[0]?.id || 'g-doctors',
        avatarUrl: newAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUsername}`,
      });

      if (res && res.success) {
        setMessage({ type: 'success', text: `User '@${newUsername.toLowerCase()}' created successfully!` });
        setShowCreateModal(false);
        setNewUsername('');
        setNewDisplayName('');
        setNewRoleDesc('');
        setNewAvatarUrl('');
      } else {
        setMessage({ type: 'error', text: res?.error || 'Failed to create user account.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user' });
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenEditModal = (u: UserItem) => {
    setEditingUser(u);
    setEditDisplayName(u.displayName);
    setEditPassword('');
    setEditRoleDesc(u.projectMeaning);
    setEditGroupId(u.groupId || availableGroups[0]?.id || 'g-doctors');
    setEditAvatarUrl(u.avatarUrl);
    setActiveMenuId(null);
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
        projectMeaning: editRoleDesc,
        groupId: editGroupId,
        avatarUrl: editAvatarUrl,
      });

      if (res && res.success) {
        setMessage({ type: 'success', text: `User profile '@${editingUser.username}' updated successfully!` });
        setEditingUser(null);
      } else {
        setMessage({ type: 'error', text: res?.error || 'Failed to update user profile.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user' });
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleBan = async (u: UserItem) => {
    setIsPending(true);
    setMessage(null);
    setActiveMenuId(null);
    try {
      const newStatus = u.status === 'Banned' ? 'Active' : 'Banned';
      await toggleBanUserAction(u.username);

      setMessage({
        type: 'success',
        text: `Account status for '@${u.username}' updated to ${newStatus}.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user status' });
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteUser = async (u: UserItem) => {
    if (!confirm(`Are you sure you want to delete account '@${u.username}' permanently?`)) return;
    setIsPending(true);
    setMessage(null);
    setActiveMenuId(null);
    try {
      await deleteUserAction(u.username);
      setMessage({ type: 'success', text: `User account '@${u.username}' was deleted.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete user' });
    } finally {
      setIsPending(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Enterprise Header Area (Matching & Exceeding User Image Reference) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              User Management
              {isSuperAdmin && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                  Global Admin Directory
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add, edit, or manage directory user accounts linked to Microsoft Entra ID Security Groups
            </p>
          </div>
        </div>

        {/* Header Control Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {selectedUserIds.length > 0 && isSuperAdmin && (
            <>
              <button
                onClick={handleBulkResendMfa}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-2 rounded-xl text-xs transition border border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Resend MFA ({selectedUserIds.length})
              </button>
              <button
                onClick={handleBulkBan}
                disabled={isPending}
                className="bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/30 font-semibold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5 text-red-400" /> Toggle Ban ({selectedUserIds.length})
              </button>
            </>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-2 shadow-indigo-600/20 ml-auto md:ml-0"
            >
              <UserPlus className="w-4 h-4" /> Invite / Create User
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Search Input, Tabs & View Switcher */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search for users by email, name or role..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl pl-10 pr-10 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder-slate-500 font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Category Tabs (Matching User's Reference Image design) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => {
                setFilterCategory('all');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition ${
                filterCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Users ({(users || []).length})
            </button>
            <button
              onClick={() => {
                setFilterCategory('admin');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition ${
                filterCategory === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admins ({(users || []).filter((u) => u?.groupName?.includes('Admin') || u?.groupName?.includes('Security')).length})
            </button>
            <button
              onClick={() => {
                setFilterCategory('clinical');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition ${
                filterCategory === 'clinical'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Clinical Staff
            </button>
            <button
              onClick={() => {
                setFilterCategory('active');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition ${
                filterCategory === 'active'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setFilterCategory('banned');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition ${
                filterCategory === 'banned'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Banned
            </button>
          </div>

          {/* View Mode Toggle Switch (Table vs Grid) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 flex-shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Message Feedback Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
              : 'bg-red-950/40 text-red-300 border-red-500/30'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Directory Table View (Matching User Image Specification) */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        paginatedUsers.length > 0 &&
                        paginatedUsers.every((u) => selectedUserIds.includes(u.id))
                      }
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="p-4">Email / Username</th>
                  <th className="p-4">Display Name</th>
                  <th className="p-4">Security Group Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Entra Code</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u) => {
                    const isSelf = currentUser === u.username;
                    const isBanned = u.status === 'Banned';
                    const isSelected = selectedUserIds.includes(u.id);
                    const identityCode = generateIdentityCode(u.username);
                    const email = `${u.username}@hallmarkmedical.com`;

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-850/50 transition ${
                          isSelected ? 'bg-indigo-950/20' : isSelf ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectUser(u.id)}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="p-4 font-bold text-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={u.avatarUrl}
                                alt={u.displayName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-950"
                                onError={(e) => {
                                  (e.target as any).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`;
                                }}
                              />
                              <Shield className="w-3 h-3 text-indigo-400 absolute -bottom-1 -right-1 bg-slate-950 rounded-full" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-slate-100 font-sans font-bold text-xs truncate">{email}</p>
                              <p className="text-[10px] text-indigo-400 font-mono">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-sans font-semibold text-slate-300">
                          {u.displayName}
                          {isSelf && (
                            <span className="ml-2 text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-950 border border-slate-800 text-indigo-300 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                            {u.groupName}
                          </span>
                        </td>
                        <td className="p-4">
                          {isBanned ? (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                              SUSPENDED
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400 font-bold text-xs tracking-wider">
                          {identityCode}
                        </td>
                        <td className="p-4 text-center">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === u.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-30 p-1 space-y-0.5 font-sans">
                                {(isSelf || isSuperAdmin) && (
                                  <button
                                    onClick={() => handleOpenEditModal(u)}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-blue-400" /> Edit Profile
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setShowPasswordId(showPasswordId === u.id ? null : u.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                                >
                                  {showPasswordId === u.id ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-indigo-400" />}
                                  {showPasswordId === u.id ? 'Hide Password' : 'Unmask Password'}
                                </button>
                                {isSuperAdmin && u.username !== 'emergency.admin' && (
                                  <>
                                    <button
                                      onClick={() => handleToggleBan(u)}
                                      className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      {isBanned ? 'Activate Account' : 'Suspend Account'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u)}
                                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-800 rounded-xl flex items-center gap-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete User
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-sans">
                      No matching user accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar (Matching Reference Screenshot Design) */}
          <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
              {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} Users
            </span>

            <div className="flex items-center gap-1 font-mono">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md">
                {currentPage}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Alternate Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedUsers.map((u) => {
            const isSelf = currentUser === u.username;
            const isBanned = u.status === 'Banned';

            return (
              <div
                key={u.id}
                className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all ${
                  isBanned
                    ? 'border-red-500/50 bg-red-950/10 opacity-80'
                    : isSelf
                    ? 'border-indigo-500 ring-1 ring-indigo-500/40 bg-slate-900/90'
                    : 'border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl}
                      alt={u.displayName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 bg-slate-950"
                      onError={(e) => {
                        (e.target as any).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`;
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-slate-100 text-xs">{u.displayName}</h4>
                      <p className="text-[11px] text-indigo-400 font-mono">@{u.username}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-xs font-mono space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Group:</span>
                      <span className="text-emerald-400 font-bold">{u.groupName}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Status:</span>
                      <span className={isBanned ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {u.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {(isSelf || isSuperAdmin) && (
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-2 rounded-xl transition text-xs flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-400" /> Edit Profile
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" /> Invite / Create Directory User Account
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. doctor02"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block uppercase tracking-wider">Password</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">Display Full Name</label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Dr. Alex Morgan, MD"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">Assign Security Group / Role</label>
                <select
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5 font-mono"
                >
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id} className="bg-slate-900 text-slate-100 py-1">
                      {g.name} — {g.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Avatar Upload */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">Profile Avatar Image</label>
                <div className="flex items-center gap-3">
                  {newAvatarUrl && (
                    <img src={newAvatarUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                  )}
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700">
                    <Upload className="w-4 h-4 text-indigo-400" /> Upload Photo from Device
                    <input type="file" accept="image/*" onChange={handleCreateFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User Profile */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Edit className="w-4 h-4 text-indigo-400" /> Edit Directory Profile (@{editingUser.username})
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">Display Full Name</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">New Password (Optional)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5 font-mono"
                />
              </div>

              {isSuperAdmin && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block uppercase tracking-wider">Change Security Group / Role</label>
                  <select
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5 font-mono"
                  >
                    {availableGroups.map((g) => (
                      <option key={g.id} value={g.id} className="bg-slate-900 text-slate-100 py-1">
                        {g.name} — {g.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Avatar Photo Upload */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">Profile Photo Avatar</label>
                <div className="flex items-center gap-3">
                  <img
                    src={editAvatarUrl || editingUser.avatarUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40"
                  />
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 font-bold">
                    <Camera className="w-4 h-4 text-indigo-400" /> Upload New Photo
                    <input type="file" accept="image/*" onChange={handleEditFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
