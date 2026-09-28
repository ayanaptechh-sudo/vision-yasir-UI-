import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface SentinelModelProps {
  onLoaded?: () => void;
}

/* =========================================================
   3D NEON SENTINEL
   ========================================================= */

const SentinelModel: React.FC<SentinelModelProps> = ({ onLoaded }) => {
  const { scene } = useGLTF(
    '/models/Meshy_AI_Neon_Sentinel_0927171108_texture.glb'
  );
  const splashScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.frustumCulled = false;
      }
    });

    return clone;
  }, [scene]);

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    /*
      VERY subtle cinematic movement.
      Character does NOT spin.
    */

    splashScene.position.y = Math.sin(time * 0.45) * 0.025;

    splashScene.rotation.y = Math.sin(time * 0.22) * 0.025;

    splashScene.rotation.x = Math.sin(time * 0.18) * 0.008;
  });

  return (
    <primitive
      object={splashScene}
      scale={2.15}
      position={[0, -1.55, 0]}
    />
  );
};

/* =========================================================
   LOADING FALLBACK
   ========================================================= */

const LoadingModel: React.FC = () => {
  return (
    <mesh position={[0, -1.5, 0]}>
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial
        color="#a855f7"
        emissive="#7c3aed"
        emissiveIntensity={2}
      />
    </mesh>
  );
};

/* =========================================================
   MAIN SPLASH SCREEN
   ========================================================= */

const SplashScreen: React.FC = () => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  /* ---------------------------------------------------------
     Fake cinematic loading progress
     --------------------------------------------------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 100) {
          clearInterval(interval);
          return 100;
        }

        return Math.min(previous + Math.random() * 4 + 1, 100);
      });
    }, 70);

    return () => clearInterval(interval);
  }, []);

  /* ---------------------------------------------------------
     Finish splash after 3.8 seconds
     --------------------------------------------------------- */

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3800);

    return () => clearTimeout(fadeTimer);
  }, []);

  /* ---------------------------------------------------------
     Remove splash after fade
     --------------------------------------------------------- */

  useEffect(() => {
    if (!fadeOut) return;

    const removeTimer = setTimeout(() => {
      /*
        This event lets the parent App know
        that splash is finished.
      */
      window.dispatchEvent(new Event('auth360-splash-finished'));
    }, 700);

    return () => clearTimeout(removeTimer);
  }, [fadeOut]);

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#05010d] transition-all duration-700 ${
        fadeOut
          ? 'opacity-0 scale-[1.02] pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* =====================================================
          BACKGROUND IMAGE
          ===================================================== */}

      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/images/splash-background.jpg')",
        }}
      />

      {/* =====================================================
          DARK PURPLE OVERLAY
          ===================================================== */}

      <div className="absolute inset-0 bg-[#090313]/55" />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(139,92,246,0.22), transparent 42%), linear-gradient(180deg, rgba(5,1,13,0.15), rgba(5,1,13,0.88))',
        }}
      />

      {/* =====================================================
          AMBIENT PURPLE GLOW
          ===================================================== */}

      <div
        className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{
          width: '420px',
          height: '420px',
          background: 'rgba(168,85,247,0.18)',
        }}
      />

      <div
        className="absolute left-[20%] top-[20%] rounded-full blur-[90px]"
        style={{
          width: '180px',
          height: '180px',
          background: 'rgba(124,58,237,0.12)',
        }}
      />

      <div
        className="absolute right-[15%] bottom-[20%] rounded-full blur-[100px]"
        style={{
          width: '220px',
          height: '220px',
          background: 'rgba(217,70,239,0.10)',
        }}
      />

      {/* =====================================================
          SUBTLE GRID
          ===================================================== */}

      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.35) 1px, transparent 1px)',
          backgroundSize: '70px 70px',
          maskImage:
            'radial-gradient(circle at center, black, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(circle at center, black, transparent 75%)',
        }}
      />

      {/* =====================================================
          TOP BRAND
          ===================================================== */}

      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-center pt-8 sm:pt-10">
        <div className="text-center">
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.45em] text-purple-300/80"
          >
            Identity Security System
          </div>

          <div
            className="mt-2 text-2xl sm:text-3xl font-black tracking-[0.16em] text-white"
            style={{
              textShadow:
                '0 0 24px rgba(168,85,247,0.45)',
            }}
          >
            AUTH<span className="text-purple-400">360</span>
          </div>
        </div>
      </div>

      {/* =====================================================
          3D SCENE
          ===================================================== */}

      <div className="absolute inset-0 z-10">
        <Canvas
          camera={{
            position: [0, 0.25, 6.5],
            fov: 35,
          }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
        >
          {/* Ambient */}
          <ambientLight intensity={2.4} />

          {/* Main purple light */}
          <pointLight
            position={[2.5, 3.5, 3]}
            intensity={12}
            distance={10}
            color="#a855f7"
          />

          {/* Blue/purple rim */}
          <pointLight
            position={[-3, 1.5, 1]}
            intensity={9}
            distance={9}
            color="#6366f1"
          />

          {/* Front soft light */}
          <pointLight
            position={[0, 2, 5]}
            intensity={10}
            distance={10}
            color="#ffffff"
          />

          {/* White face and foot fill lights */}
          <pointLight
            position={[0, 2.8, 2.5]}
            intensity={8}
            distance={9}
            color="#ffffff"
          />
          <pointLight
            position={[0, -2.2, 2]}
            intensity={6}
            distance={8}
            color="#ffffff"
          />

          <Suspense fallback={<LoadingModel />}>
            <SentinelModel
              onLoaded={() => setModelLoaded(true)}
            />
          </Suspense>

          {/* Locked camera — no user interaction */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            rotateSpeed={0.45}
          />
        </Canvas>
      </div>

      {/* =====================================================
          BOTTOM STATUS
          ===================================================== */}

      <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center px-6 pb-9 sm:pb-11">
        <div className="w-full max-w-[360px] text-center">

          {/* Status */}
          <div className="flex items-center justify-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                modelLoaded
                  ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                  : 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.9)] animate-pulse'
              }`}
            />

            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">
              {modelLoaded
                ? 'SECURE ENVIRONMENT READY'
                : 'INITIALIZING SECURE ENVIRONMENT'}
            </span>
          </div>

          {/* Progress */}
          <div className="mt-4 h-[2px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progress}%`,
                background:
                  'linear-gradient(90deg, #6d28d9, #a855f7, #d946ef)',
                boxShadow:
                  '0 0 14px rgba(168,85,247,0.8)',
              }}
            />
          </div>

          {/* Percentage */}
          <div className="mt-2 flex items-center justify-between text-[9px] font-mono tracking-wider text-white/35">
            <span>AUTH360 CORE</span>
            <span>{Math.floor(progress)}%</span>
          </div>
        </div>
      </div>

      {/* =====================================================
          CORNER HUD DETAILS
          ===================================================== */}

      <div className="absolute left-5 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
        <div className="flex flex-col gap-2 text-[8px] font-mono uppercase tracking-[0.25em] text-purple-300/25">
          <span>SEC // 360</span>
          <span>NODE // ACTIVE</span>
          <span>AUTH // ONLINE</span>
        </div>
      </div>

      <div className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
        <div className="flex flex-col items-end gap-2 text-[8px] font-mono uppercase tracking-[0.25em] text-purple-300/25">
          <span>ENCRYPTED</span>
          <span>VERIFY // OK</span>
          <span>ACCESS // READY</span>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   PRELOAD GLB
   ========================================================= */

useGLTF.preload(
  '/models/Meshy_AI_Neon_Sentinel_0927171108_texture.glb'
);

export default SplashScreen;