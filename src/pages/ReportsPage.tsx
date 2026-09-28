import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { SystemReport } from '../types/auth';
import {
  FileText,
  Download,
  Printer,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
  ListCheck,
  MessageSquare,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<SystemReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getSystemReport();
      setReport(res.report);
    } catch (err: any) {
      console.error('Failed to load system report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportJson = () => {
    if (!report) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `authshield360_security_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-cyan-600 dark:text-cyan-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Generating system compliance and security report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Institutional Security & Compliance Report
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                AuthShield 360 System-Wide Identity Assurance & Evaluation Audit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-500" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>Report Generated: <strong className="text-slate-800 dark:text-slate-200">{new Date(report.generatedAt).toLocaleString()}</strong></div>
          <div>Auditor / Evaluator: <strong className="text-cyan-600 dark:text-cyan-400">{report.generatedBy}</strong></div>
          <div>System Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{report.systemStatus}</span></div>
        </div>
      </div>

      {/* Grid of Report Summary Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
        {/* Module 1: Identity Directory Summary */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
            <Users className="w-5 h-5" />
            <span>Identity Directory Breakdown</span>
          </div>
          <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Total Provisioned Users:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{report.users.total}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Students:</span>
              <span className="text-cyan-600 dark:text-cyan-300 font-medium">{report.users.students}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Teachers / Faculty:</span>
              <span className="text-emerald-600 dark:text-emerald-300 font-medium">{report.users.teachers}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Administrators:</span>
              <span className="text-purple-600 dark:text-purple-300 font-medium">{report.users.administrators}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Active Accounts:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{report.users.active}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Locked Out Accounts:</span>
              <span className={report.users.locked > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400'}>
                {report.users.locked}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Suspended / Banned:</span>
              <span className={report.users.suspended + report.users.banned > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400'}>
                {report.users.suspended + report.users.banned}
              </span>
            </div>
          </div>
        </div>

        {/* Module 2: Authentication Activity & Audit */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
            <Shield className="w-5 h-5" />
            <span>Authentication Events</span>
          </div>
          <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Total Forensic Logs:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{report.authenticationAudit.totalEvents}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Successful Logins:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{report.authenticationAudit.successfulLogins}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Failed Password Attempts:</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">{report.authenticationAudit.failedLogins}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">OTP Verification Failures:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{report.authenticationAudit.otpFailures}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Enforced Account Lockouts:</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">{report.authenticationAudit.accountLockouts}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Unauthorized RBAC Attempts:</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">{report.authenticationAudit.rbacViolations}</span>
            </div>
          </div>
        </div>

        {/* Module 3: Session Security & Test Matrix */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
            <ListCheck className="w-5 h-5" />
            <span>Sessions & Test Matrix</span>
          </div>
          <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Total Sessions Issued:</span>
              <span className="text-slate-900 dark:text-slate-100">{report.sessions.totalIssued}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Currently Valid Sessions:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{report.sessions.active}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Revoked / Invalidation Rate:</span>
              <span className="text-amber-600 dark:text-amber-400">{report.sessions.revoked} revoked</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Test Matrix Total Cases:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{report.testMatrix.totalTests}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Tests Passed:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{report.testMatrix.passed}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Tests Pending Execution:</span>
              <span className="text-slate-400">{report.testMatrix.pending}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
