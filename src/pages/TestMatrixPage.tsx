import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { TestMatrixItem } from '../types/auth';
import {
  ListCheck,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Edit3,
  FileText,
  Shield,
  ExternalLink,
  X,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const TestMatrixPage: React.FC = () => {
  const [matrix, setMatrix] = useState<TestMatrixItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningAll, setRunningAll] = useState<boolean>(false);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [editModalTest, setEditModalTest] = useState<TestMatrixItem | null>(null);
  const [editActualResult, setEditActualResult] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('PASS');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editEvidence, setEditEvidence] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getTestMatrix();
      setMatrix(res.matrix);
    } catch (err) {
      console.error('Failed to load test matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleRunSingleTest = async (testId: string) => {
    setRunningTestId(testId);
    try {
      await ApiClient.runSingleTest(testId);
      await fetchMatrix();
      setNotice(`Executed test case ${testId} successfully!`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Test execution error: ${err.message}`);
    } finally {
      setRunningTestId(null);
    }
  };

  const handleRunAllTests = async () => {
    setRunningAll(true);
    try {
      const res = await ApiClient.runAllTests();
      setMatrix(res.matrix);
      setNotice('Executed all automated identity security test cases!');
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice(`Batch execution error: ${err.message}`);
    } finally {
      setRunningAll(false);
    }
  };

  const openEditModal = (item: TestMatrixItem) => {
    setEditModalTest(item);
    setEditActualResult(item.actualResult);
    setEditStatus(item.status);
    setEditNotes(item.notes || '');
    setEditEvidence(item.evidence || '');
  };

  const handleSaveManualEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalTest) return;
    setIsSavingEdit(true);
    try {
      await ApiClient.updateManualTest({
        testId: editModalTest.testId,
        actualResult: editActualResult,
        status: editStatus,
        notes: editNotes,
        evidence: editEvidence,
      });
      await fetchMatrix();
      setEditModalTest(null);
      setNotice(`Updated notes for ${editModalTest.testId}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(`Save error: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const totalCount = matrix.length;
  const passCount = matrix.filter((m) => m.status === 'PASS').length;
  const failCount = matrix.filter((m) => m.status === 'FAIL').length;
  const pendingCount = matrix.filter((m) => m.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <ListCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Identity Security Test Matrix
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  SRS COMPLIANT
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Formal test matrix verifying single-factor baseline, out-of-band OTP validation, token expiration, lockout protection, and RBAC boundary enforcement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAllTests}
              disabled={runningAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
            >
              {runningAll ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>{runningAll ? 'Running All Tests...' : 'Run All Automated Tests'}</span>
            </button>
            <button
              onClick={fetchMatrix}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Refresh Matrix"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Test Cases</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{totalCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
            <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
              Passed Verifications
            </div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {passCount}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/40">
            <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Failed Tests</div>
            <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{failCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
            <div className="text-[10px] uppercase font-bold text-slate-400">Pending Execution</div>
            <div className="text-xl font-extrabold text-slate-500 dark:text-slate-400 mt-1">
              {pendingCount}
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Test Matrix Table */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Test ID</th>
                <th className="py-3.5 px-4">Context</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Expected Result</th>
                <th className="py-3.5 px-4">Actual Result</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Tested At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {matrix.map((row) => (
                <tr
                  key={row.testId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-[11px]">
                    {row.testId}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {row.role}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                    {row.testAction}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    {row.expectedResult}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs leading-relaxed font-mono text-[11px]">
                    {row.actualResult}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={row.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                    {row.testedAt ? new Date(row.testedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => handleRunSingleTest(row.testId)}
                      disabled={runningTestId === row.testId}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold text-[10px] transition-colors disabled:opacity-50"
                      title="Run single test case"
                    >
                      {runningTestId === row.testId ? 'Testing...' : 'Execute'}
                    </button>
                    <button
                      onClick={() => openEditModal(row)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-[10px] transition-colors"
                      title="Add manual notes"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Edit Modal */}
      {editModalTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditModalTest(null)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-10 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Test Record: {editModalTest.testId}
              </h3>
              <button onClick={() => setEditModalTest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Actual Result
                </label>
                <textarea
                  rows={2}
                  value={editActualResult}
                  onChange={(e) => setEditActualResult(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Verification Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Evaluator Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalTest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
