import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Shield,
  Smartphone,
  Mail,
  Key,
  Clock,
  CheckCircle2,
  Lock,
  LogOut,
  Radio,
  GraduationCap,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const ProfilePage: React.FC = () => {
  const { user, session, logout, activeAuthMode } = useAuth();

  if (!user) return null;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity & MFA Enrollment Details */}
        <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-500" />
            <span>Multi-Factor Authentication Details</span>
          </h3>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-cyan-500" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Registered WhatsApp Device
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{user.phoneNumberMasked}</div>
                </div>
              </div>
              <StatusBadge status="VERIFIED" size="sm" />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Institutional Email Channel
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                </div>
              </div>
              <StatusBadge status="VERIFIED" size="sm" />
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 space-y-1 text-xs">
              <div className="text-slate-500 dark:text-slate-400 font-semibold">Active Policy:</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Authenticated under {activeAuthMode}</span>
              </div>
            </div>
          </div>
        </div>

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
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active session token detected.</p>
          )}
        </div>
      </div>
    </div>
  );
};
