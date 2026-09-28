import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiClient } from '../services/api';
import { SecurityMetrics, AuthLog, SecurityAlert } from '../types/auth';
import {
  Users,
  GraduationCap,
  BookOpen,
  Laptop,
  CheckCircle2,
  RefreshCw,
  FileText,
  Clock,
  ChevronRight,
  MessageSquare,
  Building,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { settings } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [roleDistribution, setRoleDistribution] = useState<Record<string, number>>({});
  const [recentEvents, setRecentEvents] = useState<AuthLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchAdminData = async () => {
    try {
      setIsRefreshing(true);
      const [resMetrics, resAlerts] = await Promise.all([
        ApiClient.getSecurityMetrics(),
        ApiClient.listAlerts().catch(() => ({ alerts: [] })),
      ]);
      setMetrics(resMetrics.metrics);
      setRoleDistribution(resMetrics.roleDistribution || {});
      setRecentEvents(resMetrics.recentEvents || []);
      setAlerts(resAlerts.alerts || []);
    } catch (err: any) {
      console.error('Failed to load campus administration data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await ApiClient.acknowledgeAlert(alertId);
      await fetchAdminData();
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-[#07040f] text-white">
        <div className="flex items-center gap-3 text-violet-300">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Loading campus administration portal...</span>
        </div>
      </div>
    );
  }

  const studentCount = metrics?.studentsCount ?? (roleDistribution.STUDENT || 1);
  const facultyCount = metrics?.teachersCount ?? (roleDistribution.TEACHER || 1);
  const adminCount = metrics?.adminsCount ?? (roleDistribution.ADMINISTRATOR || 1);
  const totalUsers = metrics?.totalUsers ?? (studentCount + facultyCount + adminCount);
  const activeSessionsCount = totalUsers;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Admin Header Banner */}
      <div className="relative overflow-hidden rounded-[30px] border border-violet-400/10 bg-gradient-to-br from-[#171027] via-[#0f0a1d] to-[#0b0715] p-6 text-white shadow-2xl shadow-black/30 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                Campus Administration
              </span>
              <span className="text-xs text-slate-500">· Fall Semester 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Institutional Governance & Operations
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              Campus administration overview, user account directories, active sessions, and student support inquiries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-200 transition-all hover:bg-violet-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Updating...' : 'Refresh Portal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Academic Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Students */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-6 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {studentCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Active in Academic Programs
          </div>
        </div>

        {/* Card 2: Faculty */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-6 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Faculty Members</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-300">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {facultyCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Instructional & Research Staff
          </div>
        </div>

        {/* Card 3: Active Sessions */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-6 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Sessions</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <Laptop className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {activeSessionsCount}
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-300">
            Authenticated Users Online
          </div>
        </div>

        {/* Card 4: System Status */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-6 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Portal Status</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-2xl font-extrabold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            AuthShield 360 Gateway Online
          </div>
        </div>
      </div>

      {/* Campus Management Hub - Clean 4-card navigation */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-6 shadow-xl shadow-black/10 sm:p-8">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          Campus Administrative Management
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: 'users',
              label: 'User Directory',
              icon: Users,
              desc: 'Manage student and faculty accounts, assignments, and roles',
            },
            {
              id: 'sessions',
              label: 'Active Sessions',
              icon: Laptop,
              desc: 'View real-time active user sessions and sign-in activities',
            },
            {
              id: 'reports',
              label: 'Institutional Reports',
              icon: FileText,
              desc: 'Generate school compliance, attendance, and activity reports',
            },
            {
              id: 'tickets',
              label: 'Support & Inquiries',
              icon: MessageSquare,
              desc: 'Review student support tickets, account appeals, and inquiries',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateTab(item.id)}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-left transition-all hover:border-violet-400/20 hover:bg-violet-500/[0.06]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/10 text-violet-300 transition-transform group-hover:scale-105">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="mt-3 flex items-center justify-between text-sm font-bold text-white">
                  <span>{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:translate-x-0.5" />
                </h4>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Column Administration Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Recent Activity Feed */}
        <div className="space-y-4 rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-6 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-300" />
              <h3 className="text-sm font-bold text-white">
                Recent Portal Activity
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Live Feed</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[380px]">
            {recentEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No recent activity recorded.
              </div>
            ) : (
              recentEvents.slice(0, 6).map((log) => (
                <div
                  key={log._id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-white">
                        {log.userEmail}
                      </span>
                      <span className="rounded bg-violet-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-violet-300">
                        {log.role}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {log.details || log.action}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Institutional Notices & Alerts */}
        <div className="space-y-4 rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-6 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-white">
                Administrative Notices & Alerts
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {alerts.length} Pending
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[380px]">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <span>All campus parameters and security thresholds are within normal baseline.</span>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert._id}
                  className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                        {alert.description}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 uppercase ${
                        alert.severity === 'CRITICAL'
                          ? 'border border-rose-400/20 bg-rose-500/15 text-rose-300'
                          : 'border border-amber-400/20 bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-[10px] text-slate-500">
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    <button
                      onClick={() => handleAcknowledgeAlert(alert._id)}
                      className="font-bold text-violet-300 hover:underline"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
