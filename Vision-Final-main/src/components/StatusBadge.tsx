import React from 'react';
import { CheckCircle2, XCircle, Clock, Lock, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'LOCKED' | 'VERIFIED' | 'UNAUTHORIZED' | 'PASS' | 'FAIL' | 'PENDING' | 'ACTIVE' | 'DISABLED' | 'SUBMITTED' | 'GRADED' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status ? status.toUpperCase() : 'PENDING';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs px-3 py-1 gap-2',
  }[size];

  switch (normalized) {
    case 'SUCCESS':
    case 'PASS':
    case 'VERIFIED':
    case 'ACTIVE':
    case 'GRADED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{normalized}</span>
        </span>
      );

    case 'FAILED':
    case 'FAIL':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 ${sizeClasses}`}>
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{normalized}</span>
        </span>
      );

    case 'EXPIRED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{normalized}</span>
        </span>
      );

    case 'LOCKED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/40 ${sizeClasses}`}>
          <Lock className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />
          <span>{normalized}</span>
        </span>
      );

    case 'UNAUTHORIZED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 ${sizeClasses}`}>
          <ShieldAlert className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
          <span>{normalized}</span>
        </span>
      );

    case 'SUBMITTED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>SUBMITTED</span>
        </span>
      );

    case 'PENDING':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
          <span>{normalized}</span>
        </span>
      );

    case 'DISABLED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${sizeClasses}`}>
          <AlertTriangle className="w-3 h-3 text-slate-500 shrink-0" />
          <span>{normalized}</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 ${sizeClasses}`}>
          <ShieldCheck className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>{normalized}</span>
        </span>
      );
  }
};
