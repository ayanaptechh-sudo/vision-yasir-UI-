import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import {
  GraduationCap,
  Shield,
  ShieldCheck,
  Lock,
  ArrowRight,
  BookOpen,
  Sparkles,
  Smartphone,
  ChevronRight,
  Terminal,
  Activity,
  Award,
  Laptop,
  Compass,
  FileCheck,
  CheckCircle2,
  Cpu,
  Layers,
  ExternalLink,
} from 'lucide-react';

interface HomePageProps {
  onNavigateToLogin: () => void;
}

const HeroSentinelModel: React.FC = () => {
  const { scene } = useGLTF(
    '/models/Meshy_AI_Neon_Sentinel_0927171108_texture.glb'
  );
  const heroScene = useMemo(() => scene.clone(true), [scene]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    heroScene.position.y = -0.95 + Math.sin(time * 0.45) * 0.005;
  });

  return (
    <primitive
      object={heroScene}
      scale={1.55}
      position={[0, 0, 0]}
    />
  );
};

const HeroModelFallback: React.FC = () => (
  <mesh position={[0, -1.5, 0]}>
    <sphereGeometry args={[0.15, 32, 32]} />
    <meshStandardMaterial
      color="#a855f7"
      emissive="#7c3aed"
      emissiveIntensity={2}
    />
  </mesh>
);

const HeroModelControls: React.FC = () => {
  const [autoRotate, setAutoRotate] = useState(true);
  const [userStopped, setUserStopped] = useState(false);

  useEffect(() => {
    if (userStopped) return;

    let pauseTimer: ReturnType<typeof setTimeout>;
    let resumeTimer: ReturnType<typeof setTimeout>;

    const cycleRotation = () => {
      setAutoRotate(true);
      pauseTimer = setTimeout(() => {
        setAutoRotate(false);
        resumeTimer = setTimeout(cycleRotation, 1400);
      }, 3600);
    };

    cycleRotation();

    return () => {
      clearTimeout(pauseTimer);
      clearTimeout(resumeTimer);
    };
  }, [userStopped]);

  return (
    <OrbitControls
      autoRotate={autoRotate}
      autoRotateSpeed={0.16}
      enableDamping
      dampingFactor={0.08}
      enableZoom={false}
      enablePan={false}
      minPolarAngle={Math.PI / 2.4}
      maxPolarAngle={Math.PI / 1.8}
      rotateSpeed={0.7}
      onStart={() => {
        setUserStopped(true);
        setAutoRotate(false);
      }}
    />
  );
};

useGLTF.preload('/models/Meshy_AI_Neon_Sentinel_0927171108_texture.glb');

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToLogin }) => {
  const [activeNav, setActiveNav] = useState('home');

  const scrollTo = (id: string, tab: string) => {
    setActiveNav(tab);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const academicPrograms = [
    {
      code: 'SEC-410',
      title: 'Modern Identity & Cryptography',
      desc: 'Exploring public key infrastructure, time-based OTP protocols, and zero-trust perimeter defense.',
      icon: ShieldCheck,
      badge: 'Core Track',
    },
    {
      code: 'CS-302',
      title: 'Computer Science & Systems',
      desc: 'Advanced software engineering, distributed systems, and real-time backend architecture.',
      icon: Laptop,
      badge: 'STEM Certified',
    },
    {
      code: 'NET-301',
      title: 'Network Defense & Infrastructure',
      desc: 'Packet inspection, secure routing, intrusion prevention, and TLS communication handshakes.',
      icon: Compass,
      badge: 'Lab Intensive',
    },
    {
      code: 'MATH-210',
      title: 'Discrete Mathematics & Algorithms',
      desc: 'Boolean algebra, graph theory, state machines, and algorithmic complexity modeling.',
      icon: Award,
      badge: 'Honors',
    },
  ];

  const securityFeatures = [
    {
      title: 'Zero-Trust Role-Based Access',
      desc: 'Strict segregation between Cadets, Faculty, and Administration with server-enforced authorization policies.',
      icon: Shield,
    },
    {
      title: 'Out-of-Band Multi-Factor MFA',
      desc: 'Dynamic WhatsApp OTP via UltraMsg gateway coupled with Gmail step-up challenge verification.',
      icon: Smartphone,
    },
    {
      title: 'Automated Account Lockout & Alerts',
      desc: 'Defends against credential guessing with adaptive attempt thresholds and instant audit logging.',
      icon: Lock,
    },
    {
      title: 'Complete Audit Trail & Verification',
      desc: 'Real-time telemetry and cryptographic test matrices verifying identity posture and academic integrity.',
      icon: FileCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-[#080411] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200 relative overflow-x-hidden">
      {/* ========================================================= */}
      {/* PURPLE AMBIENT NEON GLOWS & BACKGROUND ATMOSPHERE        */}
      {/* ========================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-left violet aura */}
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-purple-600/15 rounded-full blur-[160px]" />
        {/* Center glowing orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[550px] bg-purple-800/10 rounded-full blur-[180px]" />
        {/* Center-right glow */}
        <div className="absolute top-20 right-0 w-[550px] h-[550px] bg-indigo-600/12 rounded-full blur-[170px]" />
        {/* Lower ambient glow */}
        <div className="absolute bottom-10 left-1/3 w-[700px] h-[450px] bg-purple-900/15 rounded-full blur-[180px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #c084fc 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* TOP FLOATING NAVBAR                                       */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 w-full py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo - AuthShield */}
<div
  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
  className="flex items-center gap-2.5 cursor-pointer group"
>
  {/* Logo Icon */}
  <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-950 border border-purple-500/50 flex items-center justify-center text-white font-extrabold shadow-[0_0_18px_rgba(168,85,247,0.55)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.8)] transition-all">
    <img
      src="/favicon.png"
      alt="AuthShield Emblem"
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
    />
  </div>

  {/* Brand Name */}
  <div className="flex items-center gap-1.5">
    <span className="font-syne font-extrabold text-lg sm:text-xl tracking-tight text-white">
      AuthShield 360
    </span>
  </div>
</div>

          {/* Center Floating Pill Menu */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-[#130826]/85 backdrop-blur-xl border border-purple-500/25 shadow-[0_0_25px_rgba(147,51,234,0.18)]">
            <button
              onClick={() => {
                setActiveNav('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeNav === 'home'
                  ? 'bg-white text-slate-950 shadow-[0_0_16px_rgba(255,255,255,0.45)]'
                  : 'text-purple-200/70 hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => scrollTo('security', 'security')}
              className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeNav === 'security'
                  ? 'bg-white text-slate-950 shadow-[0_0_16px_rgba(255,255,255,0.45)]'
                  : 'text-purple-200/70 hover:text-white'
              }`}
            >
              Security Lab
            </button>
            <button
              onClick={() => scrollTo('curriculum', 'curriculum')}
              className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeNav === 'curriculum'
                  ? 'bg-white text-slate-950 shadow-[0_0_16px_rgba(255,255,255,0.45)]'
                  : 'text-purple-200/70 hover:text-white'
              }`}
            >
              Test Cases
            </button>
            <button
              onClick={() => scrollTo('security', 'benchmarks')}
              className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeNav === 'benchmarks'
                  ? 'bg-white text-slate-950 shadow-[0_0_16px_rgba(255,255,255,0.45)]'
                  : 'text-purple-200/70 hover:text-white'
              }`}
            >
              MFA Benchmarks
            </button>
            <button
              onClick={() => scrollTo('audit', 'audit')}
              className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeNav === 'audit'
                  ? 'bg-white text-slate-950 shadow-[0_0_16px_rgba(255,255,255,0.45)]'
                  : 'text-purple-200/70 hover:text-white'
              }`}
            >
              Audit Trail
            </button>
          </nav>

          {/* Right Action: Sign In Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToLogin}
              className="px-5 py-1.5 rounded-full border border-purple-500/40 text-purple-200 hover:text-white hover:border-purple-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] text-xs font-semibold tracking-wide transition-all bg-[#120726]/60 backdrop-blur-md cursor-pointer active:scale-95"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* HERO SECTION: 3-COLUMN EXACT REPLICA                      */}
      {/* ========================================================= */}
      <section className="relative z-10 pt-6 pb-16 sm:pt-12 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* COLUMN 1: LEFT HERO HEADLINE & ACTIONS */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col justify-center text-left">
            {/* Massive 3-Line Heading */}
            <div className="font-syne font-black text-6xl sm:text-7xl lg:text-7xl xl:text-[84px] tracking-tight leading-[0.88] select-none">
              <span className="block text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)]">
                AUTH 
              </span>
              <span className="block text-[#c4b5fd] drop-shadow-[0_4px_24px_rgba(196,181,253,0.3)]">
                360
              </span>
            </div>

            {/* Uppercase Eyebrow / Tagline */}
            <div className="mt-5">
              <span className="font-tech text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-purple-300/80 uppercase">
                CYBER DEFENSE &amp; HIGH-ASSURANCE LMS
              </span>
            </div>

            {/* Description Text */}
            <p className="text-slate-300/80 text-xs sm:text-sm leading-relaxed max-w-sm mt-4 font-normal">
              No templates. Only strategy &amp; results. Multi-factor authentication, rigorous penetration testing, and continuous zero-trust defense.
            </p>

            {/* Buttons Row */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                onClick={onNavigateToLogin}
                className="bg-[#f3e8ff] hover:bg-white text-[#0f0728] font-black text-xs tracking-wider uppercase px-6 sm:px-7 py-3 sm:py-3.5 rounded-full shadow-[0_0_30px_rgba(192,132,252,0.65)] hover:shadow-[0_0_45px_rgba(192,132,252,0.9)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>GET A PORTAL</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => scrollTo('security', 'security')}
                className="bg-white/5 hover:bg-white/10 border border-purple-500/30 hover:border-purple-400 text-white font-bold text-xs tracking-wider uppercase px-5 sm:px-6 py-3 sm:py-3.5 rounded-full hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
              >
                VIEW CASES
              </button>
            </div>

            {/* Footnote / Compliance Status */}
            <div className="mt-8 sm:mt-10 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>Zero-Trust Kernel</span>
              <span className="text-purple-400/60">•</span>
              <span>NIST SP 800-63B Compliant</span>
            </div>
          </div>

          {/* COLUMN 2: CENTER HERO CYBER OPERATIVE VISUAL */}
          <div className="lg:col-span-4 xl:col-span-4 flex items-center justify-center">
            <div className="relative rounded-[2.3rem] p-[1.5px] bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-purple-700/50 shadow-[0_0_70px_rgba(168,85,247,0.3)] max-w-sm sm:max-w-md w-full group">
              <div className="relative rounded-[2.2rem] overflow-hidden bg-[#0d061c] border border-purple-500/30 aspect-[3/4.3] flex flex-col items-center justify-between">
                {/* Floating Tag at Top */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-purple-400/40 text-[10px] font-mono tracking-widest text-purple-200 flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.35)]">
                  <span className="text-purple-400">⬡</span>
                  <span>NEXFORM CORE 2.0</span>
                </div>

                {/* Meshy 3D hero model */}
                <div className="absolute inset-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/images/splash-background.jpg')" }}
                  />
                  <div className="absolute inset-0 bg-[#090313]/45" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-[#0d061c]/70" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#08030f] via-[#21112b]/80 to-transparent" />
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-60"
                    style={{
                      backgroundImage:
                        'linear-gradient(112deg, transparent 47%, rgba(192,132,252,0.32) 48%, transparent 49%), linear-gradient(72deg, transparent 45%, rgba(15,7,28,0.95) 46%, transparent 48%), radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.9), transparent 62%)',
                      backgroundSize: '95px 58px, 130px 72px, 100% 100%',
                    }}
                  />
                  <div className="pointer-events-none absolute bottom-9 left-1/2 h-6 w-40 -translate-x-1/2 rounded-[50%] bg-black/75 blur-xl" />
                  <div className="pointer-events-none absolute bottom-8 left-[28%] h-3 w-8 rotate-[-18deg] rounded-full bg-[#3b1e4d] shadow-[0_0_12px_rgba(192,132,252,0.2)]" />
                  <div className="pointer-events-none absolute bottom-12 right-[24%] h-2.5 w-12 rotate-[22deg] rounded-full bg-[#2a153a]" />
                  <Canvas
                    camera={{ position: [0, 0.25, 6.5], fov: 35 }}
                    dpr={[1, 2]}
                    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                  >
                    <ambientLight intensity={1.8} color="#c4b5fd" />
                    <pointLight position={[2.5, 3.5, 3]} intensity={7} distance={10} color="#c084fc" />
                    <pointLight position={[-3, 1.5, 1]} intensity={7} distance={9} color="#818cf8" />
                    <pointLight position={[0, 2.6, 3.5]} intensity={10} distance={10} color="#ffffff" />
                    <pointLight position={[0, 1.9, 3.2]} intensity={12} distance={6} color="#ffffff" />
                    <pointLight position={[0.2, -2, 2.5]} intensity={7} distance={8} color="#ffffff" />
                    <Suspense fallback={<HeroModelFallback />}>
                      <HeroSentinelModel />
                    </Suspense>
                    <HeroModelControls />
                  </Canvas>
                </div>

                {/* Subtle gradient vignette at bottom */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0d061c] via-transparent to-transparent opacity-50" />
              </div>
            </div>
          </div>

          {/* COLUMN 3: RIGHT VALUE PROPOSITION & METRICS */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col justify-center space-y-4">
            <div>
              <h2 className="font-syne text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                We Turn Attention Into Clients
              </h2>
              <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed mt-2.5 mb-6">
                We create high-converting websites and battle-tested defense architectures that turn visitors into real clients.
              </p>
            </div>

            {/* Stacked Metric Cards */}
            <div className="space-y-3.5">
              {/* Card 1 */}
              <div className="p-5 rounded-2xl bg-[#110724]/80 backdrop-blur-md border border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all">
                <div className="font-syne text-3xl sm:text-4xl font-black text-white tracking-tight">
                  +180%
                </div>
                <div className="text-xs text-purple-200/60 font-medium mt-1">
                  conversion growth
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-5 rounded-2xl bg-[#110724]/80 backdrop-blur-md border border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all">
                <div className="font-syne text-3xl sm:text-4xl font-black text-white tracking-tight">
                  $2M+
                </div>
                <div className="text-xs text-purple-200/60 font-medium mt-1">
                  generated
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-5 rounded-2xl bg-[#110724]/80 backdrop-blur-md border border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all">
                <div className="font-syne text-3xl sm:text-4xl font-black text-white tracking-tight">
                  12 / 12
                </div>
                <div className="text-xs text-purple-200/60 font-medium mt-1">
                  mandatory security tests passed
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FAST PORTAL ACCESS DIRECTORIES (ROLE LAUNCHER)           */}
      {/* ========================================================= */}
      <section className="relative z-10 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl p-6 sm:p-8 bg-[#120726]/60 backdrop-blur-md border border-purple-500/20 shadow-[0_0_35px_rgba(168,85,247,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-500/15">
            <div>
              <span className="font-tech text-[10px] font-bold tracking-widest text-purple-400 uppercase">
                AUTHENTICATED ACCESS CHANNELS
              </span>
              <h3 className="font-syne text-xl sm:text-2xl font-bold text-white mt-1">
                Select Your Role Portal
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Step-up multi-factor authentication with WhatsApp OTP &amp; Gmail verification guards all institutional workspaces.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div
              onClick={onNavigateToLogin}
              className="p-5 rounded-2xl bg-[#170932]/60 hover:bg-[#1f0c43]/80 border border-purple-500/20 hover:border-purple-400/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-syne font-bold text-white text-base">Cadet Portal</h4>
                  <p className="text-xs text-purple-200/60 mt-1 leading-relaxed">
                    View coursework, attendance metrics, lab terminal runs, and grades.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-purple-500/15 flex items-center justify-between text-xs text-purple-300 font-semibold">
                <span>Enter Cadet Session</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={onNavigateToLogin}
              className="p-5 rounded-2xl bg-[#170932]/60 hover:bg-[#1f0c43]/80 border border-purple-500/20 hover:border-purple-400/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-syne font-bold text-white text-base">Faculty Portal</h4>
                  <p className="text-xs text-purple-200/60 mt-1 leading-relaxed">
                    Manage student submissions, verify identity tokens, and publish scores.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-purple-500/15 flex items-center justify-between text-xs text-indigo-300 font-semibold">
                <span>Enter Faculty Session</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={onNavigateToLogin}
              className="p-5 rounded-2xl bg-[#170932]/60 hover:bg-[#1f0c43]/80 border border-purple-500/20 hover:border-purple-400/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h4 className="font-syne font-bold text-white text-base">Admin Portal</h4>
                  <p className="text-xs text-purple-200/60 mt-1 leading-relaxed">
                    System lockout thresholds, security testing matrices, and audit logging.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-purple-500/15 flex items-center justify-between text-xs text-pink-300 font-semibold">
                <span>Enter Admin Console</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECURITY LAB & ZERO-TRUST FEATURES SECTION               */}
      {/* ========================================================= */}
      <section id="security" className="relative z-10 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="font-tech text-xs font-bold uppercase tracking-widest text-[#c084fc]">
              VERIFYVAULT ARCHITECTURE
            </span>
            <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-white">
              Institutional Zero-Trust Protection
            </h2>
            <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed">
              AuthShield 360 guarantees tamper-proof student records, automated lockout safeguards against credential stuffing, and cryptographic session authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl bg-[#110724]/70 backdrop-blur-md border border-purple-500/20 p-6 shadow-sm hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all space-y-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-syne text-sm font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-300/70 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CURRICULUM SECTION                                        */}
      {/* ========================================================= */}
      <section id="curriculum" className="relative z-10 py-16 sm:py-24 border-t border-purple-500/15 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="font-tech text-xs font-bold uppercase tracking-widest text-[#c084fc]">
              ACADEMIC DISCIPLINE
            </span>
            <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-white">
              Specialized Programs &amp; Cyber Disciplines
            </h2>
            <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed">
              Students master rigorous STEM fundamentals, applied cryptography, and defensive network systems designed for tomorrow&apos;s digital leaders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {academicPrograms.map((prog, idx) => {
              const Icon = prog.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl bg-[#110724]/70 backdrop-blur-md border border-purple-500/20 p-6 shadow-sm hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/20">
                        {prog.badge}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-bold text-purple-400 uppercase">
                        {prog.code}
                      </span>
                      <h3 className="font-syne text-sm font-bold text-white mt-0.5">
                        {prog.title}
                      </h3>
                      <p className="text-xs text-slate-300/70 mt-2 leading-relaxed">
                        {prog.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-purple-500/15 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-purple-300/60 font-semibold">Semester Lab Included</span>
                    <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* AUDIT TRAIL PREVIEW SECTION                               */}
      {/* ========================================================= */}
      <section id="audit" className="relative z-10 py-16 sm:py-20 border-t border-purple-500/15 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#14082c] via-[#1a0a38] to-[#14082c] border border-purple-500/30 text-white shadow-[0_0_50px_rgba(168,85,247,0.2)] text-center space-y-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="font-tech text-[11px] font-bold uppercase tracking-widest text-[#c084fc]">
              ACTIVE ACADEMIC QUARTER
            </span>
            <h2 className="font-syne text-2xl sm:text-3xl font-extrabold text-white">
              Ready to Access Your Academy Portal?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300/80">
              Sign in with your Cadet, Faculty, or Administrator credentials to view assignments, timetable, and security telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-3.5 rounded-full bg-[#f3e8ff] hover:bg-white text-[#0f0728] font-black text-xs tracking-wider uppercase shadow-[0_0_30px_rgba(192,132,252,0.6)] hover:shadow-[0_0_40px_rgba(192,132,252,0.85)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Portal Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FLOATING STATUS PILL (>_ CONSOLE | 2 OTPs)                */}
      {/* ========================================================= */}
      <div
        onClick={onNavigateToLogin}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-8 z-50 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#160830]/95 border border-purple-500/40 text-purple-200 text-xs font-mono shadow-[0_0_25px_rgba(168,85,247,0.4)] backdrop-blur-md cursor-pointer hover:border-purple-300 hover:scale-105 active:scale-95 transition-all"
        title="Quick Access: Security Console & Multi-Factor OTP"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] animate-pulse" />
        <span className="font-bold tracking-wider">&gt;_ CONSOLE</span>
        <span className="px-2 py-0.5 rounded-full bg-white text-slate-950 font-bold text-[10px]">
          2 OTPs
        </span>
      </div>

      {/* ========================================================= */}
      {/* FOOTER                                                    */}
      {/* ========================================================= */}
      <footer className="mt-auto border-t border-purple-500/15 bg-[#090414] py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-purple-200/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black font-syne shadow-[0_0_12px_rgba(168,85,247,0.4)]">
              N
            </div>
            <div>
              <span className="font-syne font-bold text-white text-sm">
                Nexcyber · AuthShield 360
              </span>
              <p className="text-[10px] text-purple-300/60">
                Vision Heights Academy · Zero-Trust High-Assurance Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span>Main Campus · Cyber Defense Lab 301</span>
            <span>•</span>
            <span>Identity Protocol 2026-2027</span>
          </div>

          <div>
            © 2026 Nexcyber / AuthShield 360 · All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
