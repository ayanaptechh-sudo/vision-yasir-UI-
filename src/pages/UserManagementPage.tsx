import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { User, Role, UserStatus } from '../types/auth';
import {
  Users,
  Search,
  Filter,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Mail,
  UserCheck,
  UserPlus,
  Edit,
  KeyRound,
  Ban,
  PauseCircle,
  PlayCircle,
  Trash2,
  Eye,
  X,
  Clock,
  Calendar,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [notice, setNotice] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    email: '',
    role: 'STUDENT' as Role,
    password: '',
    phoneNumber: '+92',
    department: 'Cybersecurity',
    studentId: '',
    teacherId: '',
  });

  const [detailsModalUser, setDetailsModalUser] = useState<User | null>(null);

  const [editModalUser, setEditModalUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phoneNumber: '',
    department: '',
    role: 'STUDENT' as Role,
  });

  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const [suspendModalUser, setSuspendModalUser] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState('Suspicious authentication activity detected.');
  const [suspendDuration, setSuspendDuration] = useState('24 Hours');

  const [banModalUser, setBanModalUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('Permanent ban: Malicious intrusion testing violation.');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.listUsers();
      setUsers(res.users);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.createUser(createUserForm);
      setNotice(res.message);
      setCreateModalOpen(false);
      setCreateUserForm({
        name: '',
        email: '',
        role: 'STUDENT',
        password: '',
        phoneNumber: '+92',
        department: 'Cybersecurity',
        studentId: '',
        teacherId: '',
      });
      await fetchUsers();
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    try {
      await ApiClient.updateUser({
        userId: editModalUser.id,
        name: editForm.name,
        phoneNumber: editForm.phoneNumber,
        department: editForm.department,
        role: editForm.role,
      });
      setNotice(`Updated account details for ${editModalUser.email}.`);
      setEditModalUser(null);
      await fetchUsers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    try {
      await ApiClient.adminResetPassword(passwordResetUser.id, newAdminPassword);
      setNotice(`Password successfully updated for ${passwordResetUser.email}.`);
      setPasswordResetUser(null);
      setNewAdminPassword('');
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    }
  };

  const handleSuspendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendModalUser) return;
    try {
      await ApiClient.suspendUser(suspendModalUser.id, suspendReason, suspendDuration);
      setNotice(`User ${suspendModalUser.email} has been suspended.`);
      setSuspendModalUser(null);
      await fetchUsers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    }
  };

  const handleBanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banModalUser) return;
    try {
      await ApiClient.banUser(banModalUser.id, banReason);
      setNotice(`User ${banModalUser.email} has been permanently banned.`);
      setBanModalUser(null);
      await fetchUsers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    }
  };

  const handleUnban = async (userId: string, email: string) => {
    setActionLoadingId(userId);
    try {
      await ApiClient.unbanUser(userId);
      setNotice(`Account ${email} restored to ACTIVE.`);
      await fetchUsers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to permanently delete user ${user.email}? This action cannot be undone.`)) {
      return;
    }
    setActionLoadingId(user.id);
    try {
      await ApiClient.deleteUser(user.id);
      setNotice(`User ${user.email} deleted successfully.`);
      await fetchUsers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnlockUser = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const res = await ApiClient.unlockUser(userId);
      setNotice(res.message);
      await fetchUsers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReset2fa = async (userId: string, email: string) => {
    if (!window.confirm(`Reset Google Authenticator 2FA for ${email}? They will be required to reconfigure a new authenticator.`)) {
      return;
    }
    setActionLoadingId(userId);
    try {
      const res = await ApiClient.adminResetUser2fa(userId);
      setNotice(res.message);
      await fetchUsers();
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    setActionLoadingId(userId);
    const newStatus = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    try {
      await ApiClient.toggleUserStatus(userId, newStatus);
      setNotice(`Account status updated to ${newStatus}.`);
      await fetchUsers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.teacherId && u.teacherId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                User Directory & Identity Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Administer student and faculty roles, manage verified mobile numbers, and enforce institutional security policies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New User</span>
            </button>

            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email, name, student/teacher ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-500 shadow-sm"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-cyan-500 shadow-sm"
          >
            <option value="ALL">Filter by Role: All Roles</option>
            <option value="STUDENT">STUDENT</option>
            <option value="TEACHER">TEACHER</option>
            <option value="ADMINISTRATOR">ADMINISTRATOR</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-cyan-500 shadow-sm"
          >
            <option value="ALL">Filter by Status: All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="LOCKED">LOCKED (Threshold Exceeded)</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BANNED">BANNED</option>
            <option value="DISABLED">DISABLED</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">User / Account</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Failed Logins</th>
                <th className="py-3.5 px-4">WhatsApp / Mobile</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredUsers.map((u) => {
                const isInitialAdmin = u.email === 'ayanaptechh@gmail.com';
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</span>
                        {isInitialAdmin && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold">
                            Root Administrator
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</div>
                      {(u.studentId || u.teacherId || u.department) && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {u.studentId || u.teacherId ? `[${u.studentId || u.teacherId}] ` : ''}
                          {u.department}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'ADMINISTRATOR'
                            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                            : u.role === 'TEACHER'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                            : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={u.status} size="sm" />
                      {u.status === 'SUSPENDED' && (
                        <div className="text-[10px] text-amber-500 mt-1">
                          Suspended: {u.suspensionDuration || 'Indefinite'}
                        </div>
                      )}
                      {u.status === 'BANNED' && (
                        <div className="text-[10px] text-rose-500 mt-1">Banned</div>
                      )}
                      {u.status === 'LOCKED' && (
                        <div className="text-[10px] text-rose-500 mt-1">Threshold Exceeded</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${u.failedLoginAttempts > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {u.failedLoginAttempts} / 5
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-[11px]">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Smartphone className="w-3.5 h-3.5 text-cyan-500" />
                        <span>{u.phoneNumberMasked || u.phoneNumber || 'N/A'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {/* Security Dossier */}
                      <button
                        onClick={() => setDetailsModalUser(u)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        title="View Full Profile Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Profile */}
                      <button
                        onClick={() => {
                          setEditModalUser(u);
                          setEditForm({
                            name: u.name,
                            phoneNumber: u.phoneNumber || '',
                            department: u.department || '',
                            role: u.role,
                          });
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Edit Account Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Password Reset */}
                      <button
                        onClick={() => {
                          setPasswordResetUser(u);
                          setNewAdminPassword('');
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 transition-colors"
                        title="Admin Credential Reset"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      {/* Admin Reset 2FA (Teacher & Admin Only) */}
                      {u.role !== 'STUDENT' && (
                        <button
                          onClick={() => handleReset2fa(u.id, u.email)}
                          disabled={actionLoadingId === u.id}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.twoFactorEnabled
                              ? 'bg-emerald-500/10 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 border-emerald-500/30 hover:border-rose-500/40'
                              : 'bg-slate-800 text-slate-500 hover:text-slate-400 border-slate-700'
                          }`}
                          title={u.twoFactorEnabled ? 'Reset Google Authenticator 2FA' : '2FA Not Yet Configured'}
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Unlock Action if Locked */}
                      {u.status === 'LOCKED' && (
                        <button
                          onClick={() => handleUnlockUser(u.id)}
                          disabled={actionLoadingId === u.id}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold"
                          title="Unlock account and reset failed counters"
                        >
                          Unlock
                        </button>
                      )}

                      {/* Suspend / Ban Controls (not permitted for initial root admin) */}
                      {!isInitialAdmin && (
                        <>
                          {u.status === 'SUSPENDED' || u.status === 'BANNED' ? (
                            <button
                              onClick={() => handleUnban(u.id, u.email)}
                              disabled={actionLoadingId === u.id}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setSuspendModalUser(u)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/40 text-slate-400 hover:text-amber-400 border border-slate-700 transition-colors"
                                title="Suspend Account"
                              >
                                <PauseCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setBanModalUser(u)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                                title="Ban Account"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={actionLoadingId === u.id}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW USER MODAL (Section 12) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-cyan-500" />
              <span>Provision New User</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Create an institutional account for a Student, Teacher, or Administrator.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={createUserForm.name}
                    onChange={e => setCreateUserForm({ ...createUserForm, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={createUserForm.email}
                    onChange={e => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                    placeholder="s.jenkins@academy.local"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Assign Role</label>
                  <select
                    value={createUserForm.role}
                    onChange={e => setCreateUserForm({ ...createUserForm, role: e.target.value as Role })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="STUDENT">STUDENT (Baseline Password-Only)</option>
                    <option value="TEACHER">TEACHER (WhatsApp OTP MFA)</option>
                    <option value="ADMINISTRATOR">ADMINISTRATOR (WhatsApp + Email OTP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">WhatsApp / Phone Number</label>
                  <input
                    type="text"
                    required
                    value={createUserForm.phoneNumber}
                    onChange={e => setCreateUserForm({ ...createUserForm, phoneNumber: e.target.value })}
                    placeholder="+923709001226"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Temporary Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createUserForm.password}
                  onChange={e => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                  placeholder="At least 8 characters (Hashed with Scrypt)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={createUserForm.department}
                    onChange={e => setCreateUserForm({ ...createUserForm, department: e.target.value })}
                    placeholder="Cyber Defense"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Student / Teacher ID</label>
                  <input
                    type="text"
                    value={createUserForm.studentId}
                    onChange={e => setCreateUserForm({ ...createUserForm, studentId: e.target.value })}
                    placeholder="Optional ID code"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER SECURITY DOSSIER MODAL (Section 15) */}
      {detailsModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setDetailsModalUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-mono text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span>Identity Security Dossier</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Comprehensive telemetry, lockout status, and multi-factor configuration.
            </p>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Account Identity:</span>
                  <span className="text-slate-200 font-bold">{detailsModalUser.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-cyan-300">{detailsModalUser.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Assigned RBAC Role:</span>
                  <span className="text-purple-300 font-bold">{detailsModalUser.role}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Status:</span>
                  <StatusBadge status={detailsModalUser.status} size="sm" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">WhatsApp / Mobile OTP:</span>
                  <span className="text-slate-200">{detailsModalUser.phoneNumber || detailsModalUser.phoneNumberMasked}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">MFA Policy State:</span>
                  <span className={detailsModalUser.mfaEnabled ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {detailsModalUser.mfaEnabled ? 'ENFORCED' : 'OPTIONAL (Password-Only)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Failed Login Counter:</span>
                  <span className={detailsModalUser.failedLoginAttempts > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {detailsModalUser.failedLoginAttempts} / 5 Attempts
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Lockout Expiration:</span>
                  <span className="text-slate-300">
                    {detailsModalUser.lockoutUntil ? new Date(detailsModalUser.lockoutUntil).toLocaleString() : 'None (Active)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Authentication:</span>
                  <span className="text-slate-300">
                    {detailsModalUser.lastLogin ? new Date(detailsModalUser.lastLogin).toLocaleString() : 'Never Recorded'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Account Created:</span>
                  <span className="text-slate-300">
                    {detailsModalUser.createdAt ? new Date(detailsModalUser.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {detailsModalUser.statusReason && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <strong>Restriction Reason:</strong> {detailsModalUser.statusReason}
                  {detailsModalUser.actionByAdmin && (
                    <div className="text-[10px] text-slate-400 mt-1">Enforced by: {detailsModalUser.actionByAdmin}</div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setEditModalUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-mono text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <Edit className="w-5 h-5 text-cyan-400" />
              <span>Modify User Details</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">{editModalUser.email}</p>

            <form onSubmit={handleUpdateUser} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">WhatsApp / Phone Number</label>
                <input
                  type="text"
                  required
                  value={editForm.phoneNumber}
                  onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">RBAC Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value as Role })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="TEACHER">TEACHER</option>
                  <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setPasswordResetUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-mono text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>Admin Credential Reset</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Directly assign a new password for <strong className="text-slate-200">{passwordResetUser.email}</strong>. Active sessions will be revoked immediately.
            </p>

            <form onSubmit={handleAdminResetPassword} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Update & Invalidate Sessions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUSPEND USER MODAL (Section 17) */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setSuspendModalUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-mono text-base font-bold text-amber-400 flex items-center gap-2 mb-1">
              <PauseCircle className="w-5 h-5" />
              <span>Suspend Account Access</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Suspending <strong className="text-slate-200">{suspendModalUser.email}</strong> will terminate all active sessions and block further sign-in attempts.
            </p>

            <form onSubmit={handleSuspendSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Suspension Reason</label>
                <input
                  type="text"
                  required
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Duration</label>
                <select
                  value={suspendDuration}
                  onChange={e => setSuspendDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="24 Hours">24 Hours</option>
                  <option value="7 Days">7 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="Indefinite">Indefinite (Pending Review)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendModalUser(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Confirm Suspension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BAN USER MODAL (Section 17) */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setBanModalUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-mono text-base font-bold text-rose-400 flex items-center gap-2 mb-1">
              <Ban className="w-5 h-5" />
              <span>Enforce Permanent Ban</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Banning <strong className="text-slate-200">{banModalUser.email}</strong> permanently revokes identity privileges.
            </p>

            <form onSubmit={handleBanSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Official Ban Reason</label>
                <input
                  type="text"
                  required
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBanModalUser(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Enforce Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
