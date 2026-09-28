import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthMode } from '../types/auth';
import { ApiClient } from '../services/api';
import {
  Terminal,
  Shield,
  Smartphone,
  Mail,
  Copy,
  Check,
  Zap,
  Clock,
  Lock,
  RefreshCw,
  X,
  Radio,
  ExternalLink,
  ChevronRight,
  AlertOctagon,
} from 'lucide-react';

export const InspectorDrawer: React.FC = () => {
  const {
    isInspectorOpen,
    setIsInspectorOpen,
    activeAuthMode,
    switchAuthMode,
    testDispatches,
    refreshTestDispatches,
    expireOtpForTest,
    user,
    session,
  } = useAuth();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showNotice(`Copied OTP code "${code}" to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExpireOtp = async () => {
    if (!testDispatches.length) {
      showNotice('No active OTP challenge to expire. Start login first!');
      return;
    }
    const latest = testDispatches[0];
    try {
      const res = await expireOtpForTest(latest.email, latest.type);
      showNotice(`Triggered T06 Expire: ${res.message}`);
    } catch (err: any) {
      showNotice(`Error: ${err.message}`);
    }
  };

  const handleSimulateLockout = async () => {
    setIsSimulating(true);
    showNotice('Executing 5 consecutive failed logins against student@test.local...');
    try {
      for (let i = 1; i <= 5; i++) {
        try {
          await ApiClient.loginStep1('student@test.local', `WrongPass#${i}`);
        } catch (e: any) {
          // Expected rejection
        }
      }
      showNotice('Threshold met! Account locked out. Check status in SOC logs / Test Matrix.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleInvalidateSession = async () => {
    const token = ApiClient.getToken();
    if (!token) {
      showNotice('No active session token to invalidate.');
      return;
    }
    // Manually revoke on server
    try {
      await ApiClient.logout();
      showNotice('Session revoked! Token invalidated on server. Try navigating to test T10.');
    } catch (err: any) {
      showNotice(`Error: ${err.message}`);
    }
  };

  if (!isInspectorOpen) {
    return (
      <button
        onClick={() => setIsInspectorOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-cyan-500/40 rounded-full shadow-2xl backdrop-blur-md transition-all group hover:scale-105"
        title="Open Identity Security Console & Live OTP Inbox"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
        </span>
        <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        <span className="font-sans text-xs font-bold tracking-wide text-slate-800 dark:text-slate-200">
          Security Console
        </span>
        {testDispatches.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 rounded-full border border-cyan-500/30">
            {testDispatches.length} OTPs
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white/95 dark:bg-slate-950/95 border-l border-slate-200 dark:border-cyan-500/30 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-200 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-sans text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>Identity Security Console</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">ACTIVE</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">AuthShield 360 Verification Center</p>
          </div>
        </div>
        <button
          onClick={() => setIsInspectorOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {actionNotice && (
        <div className="px-4 py-2 bg-cyan-500/20 border-b border-cyan-500/30 text-cyan-200 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Section 1: Active Mode Quick Switcher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3" />
              <span>Current Auth Mode</span>
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { id: 'PASSWORD_ONLY', label: '1. Password Only', desc: 'Baseline single-factor' },
              { id: 'PASSWORD_OTP', label: '2. Password + Mobile OTP', desc: 'Standard 2-Factor MFA' },
              { id: 'PASSWORD_OTP_EMAIL', label: '3. Password + OTP + Email', desc: '3-Factor Multi-Channel' },
            ].map(m => {
              const active = activeAuthMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => switchAuthMode(m.id as AuthMode)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-500/50 text-cyan-900 dark:text-cyan-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{m.label}</span>
                    {active && <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">ACTIVE</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{m.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Out-of-Band (OOB) OTP Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3 h-3" />
              <span>Simulated OTP Inbox</span>
            </span>
            <button
              onClick={() => refreshTestDispatches()}
              className="text-slate-400 hover:text-slate-200 p-1 rounded"
              title="Refresh OTP inbox"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {testDispatches.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 text-center text-slate-400">
                <p>No active OTP challenges yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Initiate a login in Mode 2 or 3 to inspect live dispatches.</p>
              </div>
            ) : (
              testDispatches.slice(0, 4).map(d => {
                const isMobile = d.type === 'MOBILE';
                const isExpired = new Date() > new Date(d.expiresAt);
                return (
                  <div
                    key={d.id}
                    className={`p-3 rounded-lg border ${
                      isExpired
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {isMobile ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            <Smartphone className="w-2.5 h-2.5" /> SMS OTP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Mail className="w-2.5 h-2.5" /> Email OTP
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{d.email}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400">Challenge Code:</div>
                        <div className="font-mono text-lg font-extrabold tracking-widest text-emerald-400">
                          {d.code}
                        </div>
                      </div>
                      <button
                        onClick={() => copyCode(d.code, d.id)}
                        className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        {copiedId === d.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-cyan-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Target: {d.destinationMasked}</span>
                      <span className={isExpired ? 'text-amber-400 font-mono' : 'text-slate-400'}>
                        {isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 3: Interactive Security Testing Triggers */}
        <div className="space-y-2">
          <span className="font-mono text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            <span>Interactive Security Triggers</span>
          </span>
          <div className="space-y-1.5">
            <button
              onClick={handleExpireOtp}
              className="w-full p-2.5 bg-slate-900/60 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/40 rounded-lg text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="font-medium text-slate-200 group-hover:text-amber-300">
                  Trigger T06: Expire Pending OTP
                </div>
                <div className="text-[10px] text-slate-400">Forces active OTP TTL to past timestamp</div>
              </div>
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            </button>

            <button
              onClick={handleSimulateLockout}
              disabled={isSimulating}
              className="w-full p-2.5 bg-slate-900/60 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/40 rounded-lg text-left transition-colors flex items-center justify-between group disabled:opacity-50"
            >
              <div>
                <div className="font-medium text-slate-200 group-hover:text-rose-300">
                  Trigger T07: Simulate 5 Bad Logins
                </div>
                <div className="text-[10px] text-slate-400">Tests failed-login protection & lockout</div>
              </div>
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            </button>

            <button
              onClick={handleInvalidateSession}
              className="w-full p-2.5 bg-slate-900/60 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-500/40 rounded-lg text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="font-medium text-slate-200 group-hover:text-purple-300">
                  Trigger T10: Revoke Session on Server
                </div>
                <div className="text-[10px] text-slate-400">Tests session invalidation & replay defense</div>
              </div>
              <AlertOctagon className="w-4 h-4 text-purple-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Section 4: Test Credentials Reference */}
        <div className="space-y-2">
          <span className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Test Accounts Reference
          </span>
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] space-y-2 font-mono">
            <div>
              <div className="text-cyan-400 font-semibold">Student Account</div>
              <div className="text-slate-300">student@test.local</div>
              <div className="text-slate-400">Password: <span className="text-slate-200 font-bold">Student@123</span></div>
            </div>
            <div className="border-t border-slate-800/80 pt-2">
              <div className="text-emerald-400 font-semibold">Teacher Account</div>
              <div className="text-slate-300">teacher@test.local</div>
              <div className="text-slate-400">Password: <span className="text-slate-200 font-bold">Teacher@123</span></div>
            </div>
            <div className="border-t border-slate-800/80 pt-2">
              <div className="text-purple-400 font-semibold">Administrator Account</div>
              <div className="text-slate-300">admin@test.local</div>
              <div className="text-slate-400">Password: <span className="text-slate-200 font-bold">Admin@123</span></div>
            </div>
          </div>
        </div>

        {/* Section 5: Current Session Info */}
        {session && (
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 font-mono text-[10px]">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Active User:</span>
              <span className="text-cyan-300 font-semibold">{user?.email}</span>
            </div>
            <div className="text-slate-400 flex items-center justify-between">
              <span>Role:</span>
              <span className="text-emerald-300 font-semibold">{user?.role}</span>
            </div>
            <div className="text-slate-400 flex items-center justify-between">
              <span>Session Mode:</span>
              <span className="text-purple-300">{session.authMode}</span>
            </div>
            <div className="text-slate-400 truncate">
              <span>Token: </span>
              <span className="text-slate-400">{session.token.slice(0, 16)}••••</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 text-center text-[10px] text-slate-400 font-mono">
        AuthShield 360 • VerifyVault Identity Engine
      </div>
    </div>
  );
};
