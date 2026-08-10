'use client';

import React, { useState } from 'react';
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
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsPending(true);
    setMessage(null);
    try {
      const res = await updateUserAction(editingUser.id, {
        displayName: editDisplayName,
        password: editPassword || undefined,
        projectMeaning: editRoleDesc || undefined,
        groupId: editGroupId || undefined,
        avatarUrl: editAvatarUrl || undefined,
      });

      if (res && res.success) {
        setMessage({ type: 'success', text: `Profile for '@${editingUser.username}' updated!` });
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
    try {
      const res = await toggleBanUserAction(u.id);
      if (res && res.success && res.newStatus) {
        setMessage({
          type: 'success',
          text: `User '@${u.username}' status is now ${res.newStatus.toUpperCase()}`,
        });
      } else {
        setMessage({ type: 'error', text: res?.error || 'Failed to change ban status' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change ban status' });
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteUser = async (u: UserItem) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE user @${u.username}?`)) return;

    setIsPending(true);
    setMessage(null);
    try {
      const res = await deleteUserAction(u.id);
      if (res && res.success) {
        setMessage({ type: 'success', text: `User '@${u.username}' deleted.` });
      } else {
        setMessage({ type: 'error', text: res?.error || 'Failed to delete user' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete user' });
    } finally {
      setIsPending(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Enter ID Directory User & Role Management Suite
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Super Admins can create, edit, ban/unban, and delete users. All users can upload device images or update avatar URLs.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-lg flex items-center gap-1.5 flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Create New Directory User
          </button>
        )}
      </div>

      {/* Message Feedback Banner */}
      {message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-green-950/40 text-green-300 border-green-500/30'
              : 'bg-red-950/40 text-red-300 border-red-500/30'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-xs">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((u) => {
          const isSelf = currentUser === u.username;
          const isBanned = u.status === 'Banned';

          return (
            <div
              key={u.id}
              className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all ${
                isBanned
                  ? 'border-red-500/50 bg-red-950/10 opacity-80'
                  : isSelf
                  ? 'border-blue-500 ring-1 ring-blue-500/40 bg-slate-900/90'
                  : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                {/* Avatar & User Header */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={u.avatarUrl}
                      alt={u.displayName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 bg-slate-950"
                      onError={(e) => {
                        (e.target as any).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`;
                      }}
                    />
                    {isSelf && (
                      <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 shadow">
                        <UserCheck className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-100 text-xs truncate">{u.displayName}</h4>
                      {isBanned && (
                        <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-bold border border-red-500/30">
                          BANNED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-blue-400 font-mono font-semibold truncate">@{u.username}</p>
                  </div>
                </div>

                {/* Assigned Security Group & Role */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 font-bold">Group:</span>
                    <span className="text-emerald-400 font-semibold truncate max-w-[130px]">{u.groupName}</span>
                  </div>
                  <div className="flex justify-between text-[10px] items-center">
                    <span className="text-slate-500 font-bold">Password:</span>
                    <span className="text-slate-400 font-mono italic text-[9px]">•••••••• (Protected)</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">{u.projectMeaning}</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-850 flex items-center justify-between gap-2 text-xs">
                {(isSelf || isSuperAdmin) && (
                  <button
                    onClick={() => handleOpenEditModal(u)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-400" /> Edit Profile
                  </button>
                )}

                {isSuperAdmin && u.username !== 'emergency.admin' && (
                  <>
                    <button
                      onClick={() => handleToggleBan(u)}
                      disabled={isPending}
                      className={`p-1.5 rounded-lg border transition ${
                        isBanned
                          ? 'bg-green-950/40 text-green-300 border-green-500/30 hover:bg-green-900/50'
                          : 'bg-red-950/40 text-red-300 border-red-500/30 hover:bg-red-900/50'
                      }`}
                      title={isBanned ? 'Unban User Account' : 'Ban / Suspend User Account'}
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteUser(u)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition"
                      title="Delete User Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" /> Create New Directory User Account
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

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block uppercase tracking-wider">Role Access Description</label>
                <input
                  type="text"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="e.g. Clinical staff member for cardiology EHR"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5"
                />
              </div>

              {/* Profile Avatar Upload */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300 block uppercase tracking-wider text-[10px]">
                  Profile Picture Avatar
                </label>
                <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <img
                    src={newAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUsername || 'user'}`}
                    alt="Avatar Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 bg-slate-900 flex-shrink-0"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <input
                      type="text"
                      value={newAvatarUrl}
                      onChange={(e) => setNewAvatarUrl(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-2 text-xs font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5" /> Upload from Device
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCreateFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-500">PNG, JPG, WEBP</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-400" /> Edit Profile for @{editingUser.username}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 text-xs">
              {/* Profile Avatar Upload */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300 block uppercase tracking-wider text-[10px]">
                  Profile Picture Avatar
                </label>
                <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <img
                    src={editAvatarUrl || editingUser.avatarUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-700 bg-slate-900 flex-shrink-0"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <input
                      type="text"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-2 text-xs font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5" /> Upload from Device
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-500">PNG, JPG, WEBP</span>
                    </div>
                  </div>
                </div>
              </div>

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

              {isSuperAdmin && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block uppercase tracking-wider">Password</label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave blank to keep unchanged"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block uppercase tracking-wider">Security Group / Role</label>
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

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block uppercase tracking-wider">Role Access Description</label>
                    <input
                      type="text"
                      value={editRoleDesc}
                      onChange={(e) => setEditRoleDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-2.5"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
