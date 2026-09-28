import React, { useState } from 'react';
import { ApiClient } from '../services/api';
import {
  FlaskConical,
  Terminal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Send,
  Code,
  FileCode,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Layers,
  Lock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const SecurityTestingPage: React.FC = () => {
  const [activeToolTab, setActiveToolTab] = useState<'devtools' | 'zap' | 'burp' | 'kali'>('devtools');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Security Probe Playground State
  const [probeEndpoint, setProbeEndpoint] = useState<string>('/portal/teacher');
  const [probeMethod, setProbeMethod] = useState<string>('GET');
  const [probeHeaders, setProbeHeaders] = useState<string>('{}');
  const [probeBody, setProbeBody] = useState<string>('');
  const [probeRunning, setProbeRunning] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<any>(null);

  const copySnippet = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSelectPresetProbe = (preset: string) => {
    setProbeResult(null);
    if (preset === 'RBAC_STUDENT_TEACHER') {
      setProbeEndpoint('/portal/teacher');
      setProbeMethod('GET');
      setProbeHeaders('{}');
      setProbeBody('');
    } else if (preset === 'RBAC_TEACHER_ADMIN') {
      setProbeEndpoint('/portal/admin/privileged-probe');
      setProbeMethod('GET');
      setProbeHeaders('{}');
      setProbeBody('');
    } else if (preset === 'TAMPERED_TOKEN') {
      setProbeEndpoint('/portal/student');
      setProbeMethod('GET');
      setProbeHeaders(JSON.stringify({ Authorization: 'Bearer invalid_forged_token_0x9999' }, null, 2));
      setProbeBody('');
    } else if (preset === 'BAD_OTP_BRUTE') {
      setProbeEndpoint('/auth/verify-mobile-otp');
      setProbeMethod('POST');
      setProbeHeaders('{}');
      setProbeBody(JSON.stringify({ email: 'student@test.local', code: '000000' }, null, 2));
    }
  };

  const handleExecuteProbe = async () => {
    setProbeRunning(true);
    setProbeResult(null);

    let parsedHeaders = {};
    try {
      if (probeHeaders.trim()) {
        parsedHeaders = JSON.parse(probeHeaders);
      }
    } catch {
      setProbeResult({
        status: 400,
        statusText: 'Bad Request',
        data: { error: 'Invalid JSON in custom headers' },
        durationMs: 0,
      });
      setProbeRunning(false);
      return;
    }

    let parsedBody = undefined;
    if (probeMethod !== 'GET' && probeBody.trim()) {
      try {
        parsedBody = JSON.parse(probeBody);
      } catch {
        setProbeResult({
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid JSON in request body' },
          durationMs: 0,
        });
        setProbeRunning(false);
        return;
      }
    }

    const res = await ApiClient.sendCustomProbe(probeEndpoint, probeMethod, parsedHeaders, parsedBody);
    setProbeResult(res);
    setProbeRunning(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Identity Security Testing Lab
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  LOCAL INSTANCE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Educational security verification procedures using standard penetration testing tools against the local AuthShield 360 endpoints.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scope Limitation Warning */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 space-y-1">
        <div className="font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>ETHICAL TESTING MANDATE & LEGAL BOUNDARY:</span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
          All penetration testing activities must be confined strictly to the authorized local AuthShield 360 development instance. Testing against third-party systems or external websites is strictly prohibited.
        </p>
      </div>

      {/* Interactive Hands-on Probe Playground */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
            <Terminal className="w-4 h-4" />
            <span>Interactive Security Probe Console</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="text-slate-400 self-center text-[11px] mr-1">Load Preset:</span>
            {[
              { id: 'RBAC_STUDENT_TEACHER', label: 'T08: Student → Teacher' },
              { id: 'RBAC_TEACHER_ADMIN', label: 'T09: Teacher → Admin' },
              { id: 'TAMPERED_TOKEN', label: 'Forged Session Token' },
              { id: 'BAD_OTP_BRUTE', label: 'T05: Invalid OTP' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPresetProbe(p.id)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-semibold">
              HTTP Method
            </label>
            <select
              value={probeMethod}
              onChange={(e) => setProbeMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div className="md:col-span-8">
            <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-semibold">
              Target API Endpoint (Relative to /api)
            </label>
            <input
              type="text"
              value={probeEndpoint}
              onChange={(e) => setProbeEndpoint(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              placeholder="/portal/teacher"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={handleExecuteProbe}
              disabled={probeRunning}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50"
            >
              {probeRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{probeRunning ? 'Testing...' : 'Send Probe'}</span>
            </button>
          </div>
        </div>

        {probeResult && (
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Response Code:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    probeResult.status < 400
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : probeResult.status === 403
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  HTTP {probeResult.status} {probeResult.statusText}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Duration: {probeResult.durationMs}ms</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
              <pre>{JSON.stringify(probeResult.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Tool Payloads Guide */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Code className="w-4 h-4 text-cyan-500" />
            <span>Standard Penetration Testing Tool Commands</span>
          </div>

          <div className="flex gap-1">
            {(['devtools', 'zap', 'burp', 'kali'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveToolTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  activeToolTab === tab
                    ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
          {activeToolTab === 'devtools' && (
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
{`// DevTools Console: Test vertical privilege escalation (T08)
fetch('/api/portal/teacher', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authshield_session_token')
  }
}).then(r => r.json()).then(console.log);`}
            </pre>
          )}

          {activeToolTab === 'zap' && (
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
{`# OWASP ZAP Active Scan / Quick Attack against AuthShield 360
zap-cli quick-scan --self-contained \\
  --spider \\
  http://localhost:3000/api/portal/student`}
            </pre>
          )}

          {activeToolTab === 'burp' && (
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
{`GET /api/portal/teacher HTTP/1.1
Host: localhost:3000
Authorization: Bearer <STUDENT_TOKEN>
Accept: application/json`}
            </pre>
          )}

          {activeToolTab === 'kali' && (
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
{`# Hydra Brute-Force Password Verification Test
hydra -l student@test.local -P /usr/share/wordlists/rockyou.txt \\
  localhost http-post-form \\
  "/api/auth/login-step-1:{\\"email\\":\\"^USER^\\",\\"password\\":\\"^PASS^\\"}:Login failed"`}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
