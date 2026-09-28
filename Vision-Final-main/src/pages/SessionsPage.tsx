import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { SessionItem } from '../types/auth';
import {
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Search,
  Filter,
  Clock,
  Laptop,
  Globe,
  User,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [notice, setNotice] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.listSessions();
      setSessions(res.sessions);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: string, email: string) => {
    if (!confirm(`Revoke active session for ${email}? The user will be immediately logged out.`)) {
      return;
    }
    try {
      setRevokingId(sessionId);
      const res = await ApiClient.revokeSession(sessionId);
      setNotice(res.message);
      await fetchSessions();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ipAddress.includes(searchQuery) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.isValid && !s.isExpired) ||
      (statusFilter === 'REVOKED' && !s.isValid) ||
      (statusFilter === 'EXPIRED' && s.isExpired && s.isValid);

    return matchesSearch && matchesStatus;
  });

  const activeCount = sessions.filter((s) => s.isValid && !s.isExpired).length;
  const revokedCount = sessions.filter((s) => !s.isValid).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Active Session Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Inspect live authentication sessions across all roles. Instant revocation invalidates server-side tokens in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSessions}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
              <span>Refresh Sessions</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Issued</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
              {sessions.length}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
            <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] font-bold uppercase">
              Currently Active
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {activeCount}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/40">
            <span className="text-rose-600 dark:text-rose-400 block text-[10px] font-bold uppercase">
              Revoked / Terminated
            </span>
            <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 block">
              {revokedCount}
            </span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user email, IP address, role..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-500 shadow-sm"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-cyan-500 shadow-sm"
          >
            <option value="ALL">All Session States</option>
            <option value="ACTIVE">Active & Valid</option>
            <option value="REVOKED">Revoked / Logged Out</option>
            <option value="EXPIRED">Naturally Expired</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">User / Account</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Token Preview</th>
                <th className="py-3.5 px-4">Auth Mode</th>
                <th className="py-3.5 px-4">IP & Device</th>
                <th className="py-3.5 px-4">Created / Expires</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Revoke Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredSessions.map((s) => {
                const isActive = s.isValid && !s.isExpired;
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{s.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.role === 'ADMINISTRATOR'
                            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                            : s.role === 'TEACHER'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                            : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                      {s.tokenMasked}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                      {s.authMode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{s.ipAddress}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.userAgent}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      <div>{new Date(s.createdAt).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400">
                        Exp: {new Date(s.expiresAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          VALID ACTIVE
                        </span>
                      ) : s.isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 w-max">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 w-max">
                          REVOKED ({s.revokedBy || 'ADMIN'})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isActive ? (
                        <button
                          onClick={() => handleRevoke(s.id, s.email)}
                          disabled={revokingId === s.id}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-[11px] font-bold transition-all"
                        >
                          Revoke Session
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Invalidated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
