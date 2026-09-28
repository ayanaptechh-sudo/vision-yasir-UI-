import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiClient } from '../services/api';
import {
  User,
  Shield,
  Smartphone,
  Mail,
  KeyRound,
  Clock,
  CheckCircle2,
  Lock,
  LogOut,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  RefreshCw,
  X,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { TwoFactorSetupModal } from '../components/TwoFactorSetupModal';

export const ProfilePage: React.FC = () => {
  const { user, session, logout, activeAuthMode, refreshCurrentUser } = useAuth();
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!user) return null;

  const isStudent = user.role === 'STUDENT';
  const isTeacher = user.role === 'TEACHER';
  const isAdmin = user.role === 'ADMINISTRATOR';

  const handleReset2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);

    try {
      const res = await ApiClient.reset2fa(currentPassword);
      setNotice(res.message);
      setResetModalOpen(false);
      setCurrentPassword('');
      await refreshCurrentUser();
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset 2FA.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {user.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 uppercase">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ========================================================= */}
        {/* SECURITY & AUTHENTICATION DETAILS (ROLE-SPECIFIC)         */}
        {/* ========================================================= */}
        {isStudent ? (
          /* STUDENT: Password-Only Identity Card (NO OTP, NO 2FA) */
          <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-cyan-500" />
              <span>Student Profile & Credentials</span>
            </h3>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Student ID</span>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {user.studentId || 'STU-DEMO-9041'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Institutional Email</span>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {user.email}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Department</span>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {user.department || 'Cybersecurity & Information Assurance'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 space-y-1 text-xs">
                <div className="text-slate-500 dark:text-slate-400 font-semibold">Authentication Model:</div>
                <div className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Standard Password Authentication</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TEACHER & ADMINISTRATOR: Multi-Factor & Google Authenticator 2FA Card */
          <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-500" />
              <span>Multi-Factor Authentication & 2FA</span>
            </h3>

            <div className="space-y-3 pt-2">
              {/* WhatsApp Device (Teacher & Admin) */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-cyan-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Registered WhatsApp Gateway
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{user.phoneNumberMasked}</div>
                  </div>
                </div>
                <StatusBadge status="VERIFIED" size="sm" />
              </div>

              {/* Gmail Channel (Administrator Only - Teacher does NOT use Gmail OTP) */}
              {isAdmin && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Admin Step-Up Gmail Channel
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    </div>
                  </div>
                  <StatusBadge status="VERIFIED" size="sm" />
                </div>
              )}

              {/* Google Authenticator 2FA Component (Section 6 & 7) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <KeyRound className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Google Authenticator (RFC 6238 TOTP)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {user.twoFactorEnabled ? 'Rolling 6-digit cryptographic codes' : 'Required factor not yet configured'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      user.twoFactorEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {user.twoFactorEnabled ? 'ENABLED' : 'NOT SET UP'}
                  </span>
                </div>

                <div className="pt-1">
                  {user.twoFactorEnabled ? (
                    <button
                      onClick={() => setResetModalOpen(true)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Re-enroll / Reset Google Authenticator</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSetupModalOpen(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Set Up Google Authenticator</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 space-y-1 text-xs">
                <div className="text-slate-500 dark:text-slate-400 font-semibold">Active Policy:</div>
                <div className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isAdmin
                      ? '4-Factor Policy: Password + Gmail OTP + WhatsApp OTP + Google Authenticator'
                      : '3-Factor Policy: Password + WhatsApp OTP + Google Authenticator'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Session Metadata */}
        <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>Active Session State</span>
          </h3>

          {session ? (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Bearer Session Token</span>
                <div className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 truncate">
                  {session.token}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Session Timeout</span>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(session.expiresAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Session Assurance Level</span>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {session.authMode}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active session token detected.</p>
          )}
        </div>
      </div>

      {/* Two Factor Setup Modal */}
      <TwoFactorSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
      />

      {/* Reset 2FA Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#0d121f] border border-white/[0.1] rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Confirm 2FA Reset</h3>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Resetting Google Authenticator will invalidate your existing TOTP secret. You must enter your current password to proceed.
            </p>

            {resetError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                {resetError}
              </div>
            )}

            <form onSubmit={handleReset2fa} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#080d1a] border border-white/[0.08] text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-400"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || !currentPassword}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  {resetLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Reset 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
