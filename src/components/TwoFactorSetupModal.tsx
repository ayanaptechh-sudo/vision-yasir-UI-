import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiClient } from '../services/api';
import { Shield, KeyRound, CheckCircle2, AlertTriangle, RefreshCw, X, Copy, Check } from 'lucide-react';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, refreshCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && user && user.role !== 'STUDENT') {
      setCode('');
      setErrorMsg(null);
      setSuccessMsg(null);
      setLoading(true);
      ApiClient.setup2fa()
        .then((res) => {
          setQrCodeUrl(res.qrCodeUrl);
          setManualKey(res.manualKey);
        })
        .catch((err) => {
          setErrorMsg(err.message || 'Failed to initialize Google Authenticator setup.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    if (!manualKey) return;
    navigator.clipboard.writeText(manualKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await ApiClient.verify2faSetup(code);
      setSuccessMsg(res.message || 'Google Authenticator 2FA enabled successfully!');
      await refreshCurrentUser();
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid 6-digit code. Please verify the code in your authenticator app.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0d121f] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.6)] text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Set Up Google Authenticator
              </h2>
              <p className="text-[11px] text-slate-400">
                RFC 6238 Time-Based One-Time Password (TOTP)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* QR Code & Manual Key */}
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
            {loading && !qrCodeUrl ? (
              <div className="w-44 h-44 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-xs">Generating secure TOTP key...</span>
              </div>
            ) : qrCodeUrl ? (
              <>
                <img
                  src={qrCodeUrl}
                  alt="Google Authenticator QR Code"
                  className="w-44 h-44 rounded-xl p-2 bg-white shadow-md select-none"
                />
                <span className="text-[11px] text-slate-400 mt-2">
                  Scan this QR code with Google Authenticator or Microsoft Authenticator
                </span>
              </>
            ) : null}
          </div>

          {manualKey && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                  Manual Entry Key
                </div>
                <div className="font-mono text-xs font-bold text-emerald-400 tracking-wider truncate select-all">
                  {manualKey}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyKey}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors shrink-0"
                title="Copy manual key"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Enter 6-Digit Authenticator Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full h-12 rounded-xl bg-[#070b14] border border-emerald-500/25 text-center tracking-[0.5em] font-mono text-lg font-bold text-emerald-300 placeholder:text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-40 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable 2FA'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
