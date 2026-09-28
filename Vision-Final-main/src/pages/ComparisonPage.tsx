import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/api';
import { BenchmarkScenario } from '../types/auth';
import {
  BarChart3,
  Play,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingDown,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const ComparisonPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<BenchmarkScenario[]>([]);
  const [totalBenchmarkRuns, setTotalBenchmarkRuns] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningBenchmark, setRunningBenchmark] = useState<boolean>(false);
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL');
  const [notice, setNotice] = useState<string | null>(null);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getComparison();
      setScenarios(res.scenarios);
      setTotalBenchmarkRuns(res.totalBenchmarkRuns);
    } catch (err) {
      console.error('Failed to load comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  const handleRunBenchmark = async () => {
    setRunningBenchmark(true);
    try {
      const res = await ApiClient.runBenchmark(selectedTarget);
      await fetchComparison();
      setNotice(res.message);
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice(`Benchmark error: ${err.message}`);
    } finally {
      setRunningBenchmark(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-cyan-600 dark:text-cyan-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Calculating authentication benchmarks...</span>
        </div>
      </div>
    );
  }

  const maxAvgDuration = Math.max(...scenarios.map((s) => s.avgDurationMs), 6500);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Multi-Mode Security Comparison
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  {totalBenchmarkRuns} Recorded Runs
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Comparative analysis measuring login latency, credential stuffing resistance, and verification steps across Scenarios A, B, and C.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Scenarios (Full Suite)</option>
              <option value="PASSWORD_ONLY">Scenario A (Password Only)</option>
              <option value="PASSWORD_OTP">Scenario B (Password + WhatsApp)</option>
              <option value="PASSWORD_OTP_EMAIL">Scenario C (Password + Multi-Factor)</option>
            </select>

            <button
              onClick={handleRunBenchmark}
              disabled={runningBenchmark}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
            >
              {runningBenchmark ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>{runningBenchmark ? 'Simulating...' : 'Run Simulation'}</span>
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

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((s, idx) => {
          const isA = s.id === 'PASSWORD_ONLY';
          const isB = s.id === 'PASSWORD_OTP';
          return (
            <div
              key={s.id}
              className={`rounded-3xl bg-white dark:bg-[#0c1424] border p-6 flex flex-col justify-between shadow-sm transition-all ${
                isA
                  ? 'border-amber-200 dark:border-amber-900/40'
                  : isB
                  ? 'border-cyan-200 dark:border-cyan-900/40'
                  : 'border-purple-200 dark:border-purple-900/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      isA
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : isB
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                    }`}
                  >
                    Scenario {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {s.totalRuns} Runs
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {s.stepNames?.join(' ➔ ') || s.securityLevel}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Avg Verification Latency</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {s.avgDurationMs}ms
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isA ? 'bg-amber-500' : isB ? 'bg-cyan-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min((s.avgDurationMs / maxAvgDuration) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Auth Steps
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {s.steps} Factor{s.steps > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Resistance Rating
                      </span>
                      <span
                        className={`font-extrabold text-xs ${
                          isA ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {s.resistanceRating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                <span>Security Assurance: </span>
                <strong className={isA ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {s.securityLevel}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
