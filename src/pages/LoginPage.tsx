import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiClient } from '../services/api';
import {
  Shield,
  Lock,
  Mail,
  Smartphone,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  GraduationCap,
  BookOpen,
  Sparkles,
  Eye,
  EyeOff,
  MessageSquare,
  X,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (role: string) => void;
  onBackToHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToHome }) => {
  const {
    activeAuthMode,
    loginStep1,
    verifyMobileOtp,
    verifyEmailOtp,
    verifyTotp,
    resendOtp,
    expireOtpForTest,
    settings,
  } = useAuth();

  // Steps: 'CREDENTIALS' | 'MOBILE_OTP' | 'EMAIL_OTP' | 'TOTP' | 'TOTP_SETUP'
  const [step, setStep] = useState<'CREDENTIALS' | 'MOBILE_OTP' | 'EMAIL_OTP' | 'TOTP' | 'TOTP_SETUP'>('CREDENTIALS');
  const [email, setEmail] = useState('student@test.local');
  const [password, setPassword] = useState('Student@123');
  const [showPassword, setShowPassword] = useState(false);

  // OTP inputs
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [totpManualKey, setTotpManualKey] = useState('');
  const [mobileDestination, setMobileDestination] = useState('+92 370 •••1226');
  const [emailDestination, setEmailDestination] = useState('ay••••@gmail.com');

  // Status & countdowns
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [otpTimerSeconds, setOtpTimerSeconds] = useState<number>(300);

  // Modals
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({
    email: '',
    name: '',
    category: 'ACCOUNT_LOCKED',
    subject: '',
    message: '',
  });
  const [supportNotice, setSupportNotice] = useState<string | null>(null);

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if ((step === 'MOBILE_OTP' || step === 'EMAIL_OTP') && otpTimerSeconds > 0) {
      interval = setInterval(() => {
        setOtpTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimerSeconds]);

  // Demo auto-fill helper
  const handleSelectDemoAccount = (accountType: 'ADMIN' | 'STUDENT' | 'TEACHER') => {
    setErrorMsg(null);
    setIsLocked(false);
    if (accountType === 'ADMIN') {
      setEmail('ayanaptechh@gmail.com');
      setPassword('Techwiz2254@');
    } else if (accountType === 'TEACHER') {
      setEmail('teacher@test.local');
      setPassword('Teacher@123');
    } else {
      setEmail('student@test.local');
      setPassword('Student@123');
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoNotice(null);
    setIsSubmitting(true);

    try {
      const res = await loginStep1(email, password);

      // Scenario 1: Password-only completed immediately (Student)
      if (res.sessionToken && res.user) {
        onLoginSuccess(res.user.role);
        return;
      }

      // Teacher -> WhatsApp Mobile OTP (Step 2)
      if (res.step === 'REQUIRE_MOBILE_OTP') {
        setStep('MOBILE_OTP');
        setMobileDestination(res.destinationMasked || '+92 370 •••1226');
        setOtpTimerSeconds(settings?.otpExpirySeconds || 300);
        setInfoNotice(
          `Mobile verification code dispatched to ${res.destinationMasked} via WhatsApp Gateway.`
        );
        return;
      }

      // Administrator -> Gmail OTP (Step 2)
      if (res.step === 'REQUIRE_EMAIL_OTP') {
        setStep('EMAIL_OTP');
        setEmailDestination(res.destinationMasked || email);
        setOtpTimerSeconds(settings?.emailOtpExpirySeconds || 300);
        setInfoNotice(
          `Verification code dispatched to ${res.destinationMasked} via Gmail SMTP.`
        );
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
      if (err.code === 'ACCOUNT_LOCKED') {
        setIsLocked(true);
        setLockoutMinutes(err.data?.lockoutRemainingMinutes || 5);
      } else if (err.data?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(err.data.attemptsRemaining);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMobileOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoNotice(null);
    setIsSubmitting(true);

    try {
      const res = await verifyMobileOtp(email, mobileOtp);

      if (res.completed && res.user) {
        onLoginSuccess(res.user.role);
        return;
      }

      if (res.step === 'REQUIRE_TOTP') {
        setStep('TOTP');
        setInfoNotice(res.message || 'WhatsApp OTP verified. Enter the 6-digit code from Google Authenticator.');
        return;
      }

      if (res.step === 'REQUIRE_TOTP_SETUP') {
        setStep('TOTP_SETUP');
        setTotpQrCode(res.qrCodeUrl || '');
        setTotpManualKey(res.manualKey || '');
        setInfoNotice(res.message || 'WhatsApp OTP verified. Scan the QR code in Google Authenticator to complete setup.');
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Mobile OTP verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoNotice(null);
    setIsSubmitting(true);

    try {
      const res = await verifyEmailOtp(email, emailOtp);
      if (res.completed && res.user) {
        onLoginSuccess(res.user.role);
        return;
      }

      if (res.step === 'REQUIRE_MOBILE_OTP') {
        setStep('MOBILE_OTP');
        setMobileDestination(res.destinationMasked || '+92 370 •••1226');
        setOtpTimerSeconds(settings?.otpExpirySeconds || 300);
        setInfoNotice(
          `Gmail OTP verified! Step 3: Out-of-band WhatsApp code dispatched to ${res.destinationMasked}.`
        );
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Email OTP verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoNotice(null);
    setIsSubmitting(true);

    try {
      const res = await verifyTotp(email, totpCode);
      if (res.completed && res.user) {
        onLoginSuccess(res.user.role);
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Authenticator verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (type: 'MOBILE' | 'EMAIL') => {
    try {
      const res = await resendOtp(email, type);
      setInfoNotice(res.message);
      setOtpTimerSeconds(type === 'MOBILE' ? settings?.otpExpirySeconds || 300 : settings?.emailOtpExpirySeconds || 300);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportNotice(null);
    try {
      const res = await ApiClient.submitSupportTicket(supportForm);
      setSupportNotice(
        `Ticket ${res.ticketNumber} submitted successfully. An administrator will review your appeal.`
      );
      setTimeout(() => {
        setSupportModalOpen(false);
        setSupportNotice(null);
      }, 3000);
    } catch (err: any) {
      setSupportNotice(`Error: ${err.message}`);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.requestPasswordReset(forgotEmail);
      setForgotStep('RESET');
      setForgotNotice(res.message);
    } catch (err: any) {
      setForgotNotice(`Error: ${err.message}`);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.completePasswordReset(forgotEmail, forgotOtp, forgotNewPass);
      setForgotNotice(res.message);
      setTimeout(() => {
        setForgotModalOpen(false);
        setForgotStep('REQUEST');
        setForgotNotice(null);
      }, 2500);
    } catch (err: any) {
      setForgotNotice(`Error: ${err.message}`);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

 return (
  <div className="min-h-screen bg-[#070b16] text-white relative overflow-hidden">

    {/* BACKGROUND */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-700/15 blur-[150px]" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[130px]" />

      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.7) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
    </div>

    {/* TOP BAR */}
    <header className="relative z-20 flex items-center justify-between px-5 sm:px-8 lg:px-12 py-5">

      {/* BRAND */}
      <button
        type="button"
        onClick={() => {
          if (onBackToHome) {
            onBackToHome();
          } else {
            handleSelectDemoAccount('STUDENT');
          }
        }}
        className="flex items-center gap-3 group"
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-purple-500/50 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.35)] group-hover:scale-105 group-hover:border-purple-400 transition-all">
          <img
            src="/favicon.png"
            alt="AuthShield Emblem"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="text-left">
          <div className="text-lg font-black tracking-tight text-white">
            AUTH<span className="text-purple-400">360</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-slate-500">
            Identity Security
          </div>
        </div>
      </button>
    </header>


    {/* MAIN */}
    <main className="relative z-10 min-h-[calc(100vh-90px)] flex items-center justify-center px-5 sm:px-8 pb-10">

      <div className="w-full max-w-6xl grid lg:grid-cols-[1fr_480px] gap-10 lg:gap-20 items-center">


        {/* ===================================================== */}
        {/* LEFT BRAND / SECURITY SECTION                         */}
        {/* ===================================================== */}

        <section className="hidden lg:block">

          <div className="max-w-xl">

            {/* Small badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              Secure Identity Gateway
            </div>

            {/* Heading */}
            <h1 className="text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">
              Your Identity.
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Fully Protected.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-400">
              AUTH360 provides secure identity verification and
              multi-factor authentication for modern digital platforms.
            </p>


            {/* SECURITY FEATURES */}
            <div className="mt-9 grid grid-cols-2 gap-3 max-w-lg">

              <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-purple-500/30 hover:bg-purple-500/[0.04] transition-all">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xs font-bold text-slate-200">
                  Zero Trust
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Identity-first security
                </div>
              </div>

              <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-cyan-500/30 hover:bg-cyan-500/[0.04] transition-all">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xs font-bold text-slate-200">
                  MFA Security
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Multiple verification layers
                </div>
              </div>

              <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-indigo-500/30 hover:bg-indigo-500/[0.04] transition-all">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xs font-bold text-slate-200">
                  Encrypted Access
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Protected authentication
                </div>
              </div>

              <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] transition-all">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-slate-200">
                  Real-Time Protection
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Continuous verification
                </div>
              </div>

            </div>


            {/* SECURITY STATUS */}
            <div className="mt-7 flex items-center gap-3 text-[10px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Security systems operational
              </div>

              <span className="text-slate-700">•</span>

              <span className="font-mono">
                AUTH360_GATEWAY
              </span>
            </div>

          </div>

        </section>


        {/* ===================================================== */}
        {/* LOGIN CARD                                             */}
        {/* ===================================================== */}

        <section className="w-full max-w-[480px] mx-auto">

          {/* Card header status */}
          <div className="flex items-center justify-between mb-3 px-1">

            <button
              type="button"
              onClick={() => {
                if (onBackToHome) {
                  onBackToHome();
                } else {
                  handleSelectDemoAccount('STUDENT');
                }
              }}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Secure Connection
            </div>

          </div>


          {/* MAIN CARD */}
          <div className="relative rounded-[28px] border border-white/[0.09] bg-[#0b1020]/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] overflow-hidden">

            {/* Top glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

            {/* inner glow */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />


            <div className="relative p-6 sm:p-8">


              {/* CARD BRAND */}
              <div className="text-center mb-7">

                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-400/25 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.18)]">
                  <Shield className="w-7 h-7 text-purple-400" />
                </div>

                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-2">
                  AUTH360
                </div>

                <h2 className="text-2xl font-black tracking-tight text-white">
                  {step === 'CREDENTIALS'
                    ? 'Welcome back'
                    : step === 'MOBILE_OTP'
                    ? 'Verify your mobile'
                    : 'Verify your email'}
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-500 max-w-xs mx-auto">
                  {step === 'CREDENTIALS'
                    ? 'Sign in to continue to your secure dashboard.'
                    : step === 'MOBILE_OTP'
                    ? `Enter the 6-digit code sent to ${mobileDestination}`
                    : `Enter the verification code sent to ${emailDestination}`}
                </p>

              </div>


              {/* POLICY */}
              <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-white/[0.025] border border-white/[0.06] mb-5">

                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />

                  <span>
                    {activeAuthMode === 'PASSWORD_ONLY'
                      ? 'Password Authentication'
                      : activeAuthMode === 'PASSWORD_OTP'
                      ? 'Two-Factor Authentication'
                      : 'Multi-Factor Authentication'}
                  </span>
                </div>

                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                  Protected
                </span>

              </div>


              {/* ERROR */}
              {errorMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />

                  <div>
                    <div>{errorMsg}</div>

                    {attemptsRemaining !== null && attemptsRemaining > 0 && (
                      <div className="mt-1 text-[10px] text-amber-300 font-bold">
                        {attemptsRemaining} attempt
                        {attemptsRemaining > 1 ? 's' : ''} remaining
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* INFO */}
              {infoNotice && (
                <div className="mb-4 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{infoNotice}</span>
                </div>
              )}


              {/* LOCKED */}
              {isLocked ? (

                <div className="text-center py-5">

                  <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-rose-400" />
                  </div>

                  <h3 className="text-base font-bold text-white">
                    Account temporarily locked
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Too many failed attempts. Identity protection is active
                    for {lockoutMinutes || 5} minutes.
                  </p>

                  <div className="flex gap-2 justify-center mt-6">

                    <button
                      type="button"
                      onClick={() => {
                        setSupportForm((prev) => ({
                          ...prev,
                          email,
                          category: 'ACCOUNT_LOCKED',
                          subject: 'Account Lockout Appeal',
                        }));
                        setSupportModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
                    >
                      Submit Appeal
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsLocked(false);
                        setErrorMsg(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 text-xs hover:bg-white/[0.08]"
                    >
                      Back
                    </button>

                  </div>

                </div>

              ) : step === 'CREDENTIALS' ? (

                /* ================================================= */
                /* LOGIN                                             */
                /* ================================================= */

                <form onSubmit={handleCredentialsSubmit} className="space-y-5">

                  {/* EMAIL */}
                  <div>

                    <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                      Email address
                    </label>

                    <div className="relative">

                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#080d1a] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 transition-all"
                        required
                      />

                    </div>

                  </div>


                  {/* PASSWORD */}
                  <div>

                    <div className="flex items-center justify-between mb-2">

                      <label className="text-[11px] font-semibold text-slate-400">
                        Password
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setForgotModalOpen(true);
                        }}
                        className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Forgot password?
                      </button>

                    </div>

                    <div className="relative">

                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full h-12 pl-11 pr-11 rounded-xl bg-[#080d1a] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 transition-all"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-400 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>

                    </div>

                  </div>


                  {/* LOGIN BUTTON */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white text-sm font-bold shadow-[0_0_30px_rgba(124,58,237,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>


                  {/* DEMO ACCOUNTS */}
                  <div className="pt-5 border-t border-white/[0.06]">

                    <div className="text-center text-[9px] uppercase tracking-[0.2em] text-slate-600 font-bold mb-3">
                      Demo access
                    </div>

                    <div className="grid grid-cols-3 gap-2">

                      <button
                        type="button"
                        onClick={() => handleSelectDemoAccount('STUDENT')}
                        className="py-3 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
                      >
                        <GraduationCap className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
                        <span className="text-[10px] font-semibold text-slate-400">
                          Student
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectDemoAccount('TEACHER')}
                        className="py-3 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                      >
                        <BookOpen className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                        <span className="text-[10px] font-semibold text-slate-400">
                          Faculty
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectDemoAccount('ADMIN')}
                        className="py-3 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
                      >
                        <Shield className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                        <span className="text-[10px] font-semibold text-slate-400">
                          Admin
                        </span>
                      </button>

                    </div>

                  </div>

                </form>


              ) : step === 'MOBILE_OTP' ? (

                /* ================================================= */
                /* MOBILE OTP                                        */
                /* ================================================= */

                <form onSubmit={handleMobileOtpSubmit} className="space-y-5">

                  <div className="p-4 rounded-2xl bg-cyan-500/[0.05] border border-cyan-500/15">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-cyan-400" />

                        <div>
                          <div className="text-xs font-bold text-cyan-300">
                            Mobile verification
                          </div>

                          <div className="text-[10px] text-slate-600 mt-0.5">
                            WhatsApp security code
                          </div>
                        </div>
                      </div>

                      <div className="font-mono text-xs font-bold text-cyan-400">
                        {formatSeconds(otpTimerSeconds)}
                      </div>

                    </div>

                  </div>


                  <div>

                    <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                      6-digit verification code
                    </label>

                    <input
                      type="text"
                      maxLength={6}
                      value={mobileOtp}
                      onChange={(e) =>
                        setMobileOtp(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="000000"
                      className="w-full h-14 rounded-xl bg-[#080d1a] border border-cyan-500/20 text-center tracking-[0.6em] font-mono text-xl font-bold text-cyan-300 placeholder:text-slate-700 outline-none focus:border-cyan-400 transition-all"
                      required
                      autoFocus
                    />

                  </div>


                  <button
                    type="submit"
                    disabled={isSubmitting || mobileOtp.length < 6}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Code
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>


                  <div className="flex justify-between text-xs pt-1">

                    <button
                      type="button"
                      onClick={() => handleResend('MOBILE')}
                      disabled={otpTimerSeconds > 240}
                      className="text-cyan-400 hover:text-cyan-300 disabled:opacity-30"
                    >
                      Resend code
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('CREDENTIALS')}
                      className="text-slate-500 hover:text-white"
                    >
                      Back to login
                    </button>

                  </div>

                </form>


              ) : step === 'EMAIL_OTP' ? (

                /* ================================================= */
                /* EMAIL OTP                                         */
                /* ================================================= */

                <form onSubmit={handleEmailOtpSubmit} className="space-y-5">

                  <div className="p-4 rounded-2xl bg-purple-500/[0.05] border border-purple-500/15">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-400" />

                        <div>
                          <div className="text-xs font-bold text-purple-300">
                            Email verification
                          </div>

                          <div className="text-[10px] text-slate-600 mt-0.5">
                            Gmail security code
                          </div>
                        </div>
                      </div>

                      <div className="font-mono text-xs font-bold text-purple-400">
                        {formatSeconds(otpTimerSeconds)}
                      </div>

                    </div>

                  </div>


                  <div>

                    <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                      6-digit verification code
                    </label>

                    <input
                      type="text"
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) =>
                        setEmailOtp(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="000000"
                      className="w-full h-14 rounded-xl bg-[#080d1a] border border-purple-500/20 text-center tracking-[0.6em] font-mono text-xl font-bold text-purple-300 placeholder:text-slate-700 outline-none focus:border-purple-400 transition-all"
                      required
                      autoFocus
                    />

                  </div>


                  <button
                    type="submit"
                    disabled={isSubmitting || emailOtp.length < 6}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Authorizing...
                      </>
                    ) : (
                      <>
                        Verify & Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>


                  <div className="flex justify-between text-xs pt-1">

                    <button
                      type="button"
                      onClick={() => handleResend('EMAIL')}
                      disabled={otpTimerSeconds > 240}
                      className="text-purple-400 hover:text-purple-300 disabled:opacity-30"
                    >
                      Resend code
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('CREDENTIALS')}
                      className="text-slate-500 hover:text-white"
                    >
                      Back to login
                    </button>

                  </div>

                </form>

              ) : step === 'TOTP_SETUP' ? (

                /* ================================================= */
                /* GOOGLE AUTHENTICATOR SETUP                        */
                /* ================================================= */

                <form onSubmit={handleTotpSubmit} className="space-y-5">

                  <div className="p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/15">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-emerald-300">
                          Google Authenticator 2FA Setup
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Required factor for account protection
                        </div>
                      </div>
                    </div>
                  </div>

                  {totpQrCode && (
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                      <img
                        src={totpQrCode}
                        alt="Google Authenticator QR Code"
                        className="w-44 h-44 rounded-xl p-2 bg-white shadow-md"
                      />
                      <div className="mt-3 text-center">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                          Manual Setup Key
                        </div>
                        <code className="text-xs font-mono font-bold text-emerald-400 tracking-wider select-all bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-500/20">
                          {totpManualKey}
                        </code>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                      Enter 6-digit Authenticator code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full h-14 rounded-xl bg-[#080d1a] border border-emerald-500/20 text-center tracking-[0.6em] font-mono text-xl font-bold text-emerald-300 placeholder:text-slate-700 outline-none focus:border-emerald-400 transition-all"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || totpCode.length < 6}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying 2FA...
                      </>
                    ) : (
                      <>
                        Verify & Complete Login
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex justify-end text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('CREDENTIALS')}
                      className="text-slate-500 hover:text-white"
                    >
                      Back to login
                    </button>
                  </div>

                </form>

              ) : (

                /* ================================================= */
                /* GOOGLE AUTHENTICATOR TOTP LOGIN                   */
                /* ================================================= */

                <form onSubmit={handleTotpSubmit} className="space-y-5">

                  <div className="p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/15">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-emerald-300">
                          Google Authenticator (2FA)
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Enter your 6-digit rolling authenticator code
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                      6-digit authenticator code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full h-14 rounded-xl bg-[#080d1a] border border-emerald-500/20 text-center tracking-[0.6em] font-mono text-xl font-bold text-emerald-300 placeholder:text-slate-700 outline-none focus:border-emerald-400 transition-all"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || totpCode.length < 6}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Enter Portal
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex justify-end text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('CREDENTIALS')}
                      className="text-slate-500 hover:text-white"
                    >
                      Back to login
                    </button>
                  </div>

                </form>

              )}


              {/* CARD FOOTER */}
              <div className="mt-7 pt-5 border-t border-white/[0.05] text-center">

                <div className="flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.18em] text-slate-600">
                  <Lock className="w-3 h-3" />
                  Protected by AUTH360 Security
                </div>

              </div>

            </div>

          </div>

          {/* FOOTER */}
          <div className="text-center mt-5 text-[10px] text-slate-600">
            AUTH360 · Zero-Trust Identity Gateway
          </div>

        </section>

      </div>

    </main>


    {/* ========================================================= */}
    {/* SUPPORT MODAL                                             */}
    {/* ========================================================= */}

    {supportModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={() => setSupportModalOpen(false)}
        />

        <div className="relative w-full max-w-md rounded-3xl bg-[#0c1222] border border-white/10 p-6 shadow-2xl z-10">

          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">

            <h3 className="text-sm font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Submit Account Appeal
            </h3>

            <button
              onClick={() => setSupportModalOpen(false)}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

          </div>


          {supportNotice && (
            <div className="my-4 p-3 rounded-xl bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">
              {supportNotice}
            </div>
          )}


          <form onSubmit={handleSupportSubmit} className="space-y-4 mt-5">

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Your Name
              </label>

              <input
                type="text"
                value={supportForm.name}
                onChange={(e) =>
                  setSupportForm({
                    ...supportForm,
                    name: e.target.value,
                  })
                }
                className="w-full h-11 px-3 rounded-xl bg-[#080d1a] border border-white/10 text-sm outline-none focus:border-purple-500"
                required
              />
            </div>


            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Subject
              </label>

              <input
                type="text"
                value={supportForm.subject}
                onChange={(e) =>
                  setSupportForm({
                    ...supportForm,
                    subject: e.target.value,
                  })
                }
                className="w-full h-11 px-3 rounded-xl bg-[#080d1a] border border-white/10 text-sm outline-none focus:border-purple-500"
                required
              />
            </div>


            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Appeal Reason / Message
              </label>

              <textarea
                rows={4}
                value={supportForm.message}
                onChange={(e) =>
                  setSupportForm({
                    ...supportForm,
                    message: e.target.value,
                  })
                }
                className="w-full px-3 py-3 rounded-xl bg-[#080d1a] border border-white/10 text-sm outline-none focus:border-purple-500 resize-none"
                required
              />
            </div>


            <div className="flex justify-end gap-2 pt-2">

              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                Submit Appeal
              </button>

            </div>

          </form>

        </div>
      </div>
    )}


    {/* ========================================================= */}
    {/* FORGOT PASSWORD MODAL                                     */}
    {/* ========================================================= */}

    {forgotModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={() => setForgotModalOpen(false)}
        />

        <div className="relative w-full max-w-md rounded-3xl bg-[#0c1222] border border-white/10 p-6 shadow-2xl z-10">

          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">

            <h3 className="text-sm font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              Reset Password
            </h3>

            <button
              onClick={() => setForgotModalOpen(false)}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

          </div>


          {forgotNotice && (
            <div className="my-4 p-3 rounded-xl bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">
              {forgotNotice}
            </div>
          )}


          {forgotStep === 'REQUEST' ? (

            <form onSubmit={handleForgotRequest} className="space-y-4 mt-5">

              <p className="text-xs leading-5 text-slate-500">
                Enter your registered institutional email to receive a password reset token.
              </p>

              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-11 px-3 rounded-xl bg-[#080d1a] border border-white/10 text-sm outline-none focus:border-purple-500"
                required
              />

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                Request Reset Code
              </button>

            </form>

          ) : (

            <form onSubmit={handleForgotReset} className="space-y-4 mt-5">

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Reset Code
                </label>

                <input
                  type="text"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  placeholder="Enter reset code"
                  className="w-full h-11 px-3 rounded-xl bg-[#080d1a] border border-white/10 text-sm outline-none focus:border-purple-500"
                  required
                />
              </div>


              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  New Password
                </label>

                <input
                  type="password"
                  value={forgotNewPass}
                  onChange={(e) => setForgotNewPass(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-11 px-3 rounded-xl bg-[#080d1a] border border-white/10 text-sm outline-none focus:border-purple-500"
                  required
                />
              </div>


              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                Confirm Password Change
              </button>

            </form>

          )}

        </div>

      </div>
    )}

  </div>
); 
};