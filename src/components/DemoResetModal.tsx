import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RotateCcw, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface DemoResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoResetModal: React.FC<DemoResetModalProps> = ({ isOpen, onClose }) => {
  const { triggerDemoReset } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  if (!isOpen) return null;

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await triggerDemoReset();
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-rose-500/40 rounded-3xl p-6 shadow-2xl relative text-slate-800 dark:text-slate-200 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4">
          <RotateCcw className="w-6 h-6" />
        </div>

        <h3 className="font-sans text-base font-bold text-slate-900 dark:text-slate-100 tracking-wide">
          Reset System Environment
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          This operation will restore the entire AuthShield 360 testbed back to its clean baseline.
        </p>

        <div className="my-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-xs space-y-2">
          <div className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>The following data will be reset:</span>
          </div>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 text-[11px]">
            <li>Test user accounts unlocked & passwords reset to defaults</li>
            <li>Authentication audit log purged & reset to initial seed state</li>
            <li>All active sessions & OTP tokens invalidated</li>
            <li>Identity Security Test Matrix (T01 - T12) reset to initial status</li>
            <li>Active authentication policy reset to 1-Factor (Password-Only)</li>
          </ul>
        </div>

        {successNotice ? (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>System environment restored successfully!</span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isResetting}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReset}
              disabled={isResetting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting System...' : 'Confirm System Reset'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
