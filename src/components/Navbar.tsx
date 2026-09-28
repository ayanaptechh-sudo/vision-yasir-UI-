import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthMode } from '../types/auth';
import {
  Shield,
  Radio,
  Activity,
  FileText,
  FlaskConical,
  ListCheck,
  BarChart3,
  Users,
  LogOut,
  RotateCcw,
  Terminal,
  ChevronDown,
  User as UserIcon,
  GraduationCap,
  BookOpen,
  Lock,
  Laptop,
  MessageSquare,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenResetModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenResetModal }) => {
  const { user, logout, activeAuthMode, switchAuthMode, toggleInspector, testDispatches } = useAuth();
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);

  const getModeLabel = (mode: AuthMode) => {
    switch (mode) {
      case 'PASSWORD_ONLY':
        return 'Password Only';
      case 'PASSWORD_OTP':
        return 'Password + OTP MFA';
      case 'PASSWORD_OTP_EMAIL':
        return 'Password + OTP + Email OTP';
    }
  };

  const navItems = [
    {
      id: 'portal',
      label: user ? `${user.role.charAt(0) + user.role.slice(1).toLowerCase()} Portal` : 'Portal',
      icon: user?.role === 'STUDENT' ? GraduationCap : user?.role === 'TEACHER' ? BookOpen : Lock,
      roles: ['STUDENT', 'TEACHER', 'ADMINISTRATOR'],
    },
    {
      id: 'monitoring',
      label: 'SOC Dashboard',
      icon: Activity,
      roles: ['TEACHER', 'ADMINISTRATOR'],
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      roles: ['ADMINISTRATOR'],
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: Laptop,
      roles: ['ADMINISTRATOR'],
    },
    {
      id: 'tickets',
      label: 'Support Desk',
      icon: MessageSquare,
      roles: ['ADMINISTRATOR'],
    },
    {
      id: 'logs',
      label: 'Audit Logs',
      icon: FileText,
      roles: ['TEACHER', 'ADMINISTRATOR'],
    },
    {
      id: 'testing',
      label: 'Security Testing',
      icon: FlaskConical,
      roles: ['STUDENT', 'TEACHER', 'ADMINISTRATOR'],
    },
    {
      id: 'matrix',
      label: 'Test Matrix',
      icon: ListCheck,
      roles: ['STUDENT', 'TEACHER', 'ADMINISTRATOR'],
    },
    {
      id: 'comparison',
      label: 'Comparison',
      icon: BarChart3,
      roles: ['STUDENT', 'TEACHER', 'ADMINISTRATOR'],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      roles: ['ADMINISTRATOR'],
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md">
      {/* Top Bar with Mode Status Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-slate-400 uppercase tracking-wider text-[11px]">
            Current Authentication Mode:
          </span>
          <div className="relative inline-block">
            <button
              onClick={() => setModeDropdownOpen(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/25 transition-all text-xs font-bold font-mono"
            >
              <span>{getModeLabel(activeAuthMode)}</span>
              <ChevronDown className="w-3 h-3 text-cyan-400" />
            </button>

            {modeDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 rounded-lg bg-slate-900 border border-cyan-500/40 shadow-2xl py-1 z-50 font-sans text-xs">
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase border-b border-slate-800">
                  Select Demonstration Mode
                </div>
                {[
                  { id: 'PASSWORD_ONLY', label: '1. Password Only', desc: 'Baseline single-factor' },
                  { id: 'PASSWORD_OTP', label: '2. Password + OTP MFA', desc: 'Mobile/App 2-factor OTP' },
                  { id: 'PASSWORD_OTP_EMAIL', label: '3. Password + OTP + Email OTP', desc: '3-factor multi-channel' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      switchAuthMode(opt.id as AuthMode);
                      setModeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors ${
                      activeAuthMode === opt.id ? 'bg-cyan-950/40 text-cyan-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] text-slate-400">
            Category: <strong className="text-slate-200">Ethical Cyber Horizons</strong>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SOC Subsystem Armed
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        {/* Brand */}
<div
  className="flex items-center gap-3 cursor-pointer group"
  onClick={() => setCurrentTab('portal')}
>
  {/* AUTH360 Logo Icon */}
  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-violet-400/50 flex items-center justify-center shadow-lg shadow-violet-950/40 group-hover:border-violet-400/80 group-hover:shadow-violet-500/25 transition-all duration-300">
    <img
      src="/favicon.png"
      alt="AuthShield Emblem"
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
    />
    {/* Security Dot */}
    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] border border-slate-900" />
  </div>

  {/* Brand Text */}
  <div>
    <div className="flex items-center gap-2">
      <span className="font-sans text-lg font-extrabold tracking-wider bg-gradient-to-r from-white via-violet-200 to-cyan-400 bg-clip-text text-transparent">
        AUTH360
      </span>

      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-500/10 text-violet-300 border border-violet-500/30">
        v2.6
      </span>
    </div>

    <div className="text-[11px] text-slate-400 tracking-wide font-sans">
      Secure Identity & Authentication
    </div>
  </div>
</div>
        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isAccessible = !user || item.roles.includes(user.role);
            if (!isAccessible) return null;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Evaluator Terminal Button */}
          <button
            onClick={toggleInspector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500/40 text-xs font-mono transition-all"
            title="Toggle Live OTP & Testing Inspector"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Inspector</span>
            {testDispatches.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center justify-center">
                {testDispatches.length}
              </span>
            )}
          </button>

          {/* Reset Demo button for Admin / Evaluator */}
          {user?.role === 'ADMINISTRATOR' && (
            <button
              onClick={onOpenResetModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono transition-all"
              title="Reset Demonstration Environment to Seed State"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xl:inline">Reset Demo</span>
            </button>
          )}

          {/* User Badge / Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div
                onClick={() => setCurrentTab('profile')}
                className="cursor-pointer text-right hidden sm:block"
              >
                <div className="text-xs font-medium text-slate-200 truncate max-w-[140px]">{user.name}</div>
                <div className="text-[10px] font-mono text-cyan-400">{user.role}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                title="Logout & Invalidate Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentTab('login')}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav Scroller */}
      <div className="lg:hidden px-4 py-2 border-t border-slate-800/80 bg-slate-950 flex items-center gap-1.5 overflow-x-auto text-xs">
        {navItems.map(item => {
          const Icon = item.icon;
          const isAccessible = !user || item.roles.includes(user.role);
          if (!isAccessible) return null;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md shrink-0 text-xs ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
