import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccessDeniedPageProps {
  onBack: () => void;
  attemptedResource?: string;
  requiredRole?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ onBack, attemptedResource, requiredRole }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto shadow-lg shadow-purple-950/50">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <div className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest">
            HTTP 403 Forbidden
          </div>
          <h2 className="font-mono text-xl font-bold text-slate-100">
            Access Denied: RBAC Violation
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          You are not authorized to access this resource. The system enforces strict server-side Role-Based Access Control under the principle of least privilege.
        </p>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-left font-mono text-[11px] space-y-1.5 text-slate-400">
          <div className="flex justify-between">
            <span>Current Role:</span>
            <span className="text-cyan-400 font-bold">{user?.role || 'UNAUTHENTICATED'}</span>
          </div>
          {requiredRole && (
            <div className="flex justify-between">
              <span>Required Role:</span>
              <span className="text-rose-400 font-bold">{requiredRole}</span>
            </div>
          )}
          {attemptedResource && (
            <div className="flex justify-between">
              <span>Target Resource:</span>
              <span className="text-slate-300 truncate max-w-[180px]">{attemptedResource}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-500">
            <span>Audit Trail:</span>
            <span className="text-emerald-400">Violation logged with IP & timestamp</span>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Authorized Dashboard</span>
        </button>
      </div>
    </div>
  );
};
