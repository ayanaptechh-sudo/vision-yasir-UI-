/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortalLayout } from './components/PortalLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserManagementPage } from './pages/UserManagementPage';
import { SessionsPage } from './pages/SessionsPage';
import { TicketsPage } from './pages/TicketsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SecurityTestingPage } from './pages/SecurityTestingPage';
import { TestMatrixPage } from './pages/TestMatrixPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ProfilePage } from './pages/ProfilePage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { RefreshCw, GraduationCap } from 'lucide-react';
import SplashScreen from './components/splash/SplashScreen';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('portal');
  // State for public / unauthenticated navigation: 'home' | 'login'
  const [unauthPage, setUnauthPage] = useState<'home' | 'login'>('home');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans text-slate-800 dark:text-slate-100 transition-colors">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 animate-pulse">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-3 text-cyan-600 dark:text-cyan-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-xs font-bold tracking-wider uppercase">Loading Vision Heights Academy Portal...</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 1. PUBLIC UNAUTHENTICATED FLOW:
  // Root URL -> PUBLIC HOMEPAGE (Landing Page)
  // Clicking Login -> LOGIN PAGE (with Cadet/Faculty/Admin credentials & OTP)
  // Back to Academy Home -> Returns to PUBLIC HOMEPAGE
  // =========================================================================
  if (!user) {
    if (unauthPage === 'home') {
      return <HomePage onNavigateToLogin={() => setUnauthPage('login')} />;
    }

    return (
      <LoginPage
        onLoginSuccess={() => {
          setCurrentTab('portal');
          setUnauthPage('home');
        }}
        onBackToHome={() => setUnauthPage('home')}
      />
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED ROLE-BASED DASHBOARD FLOW:
  // After Login -> PortalLayout with Role-based Dashboard (Student / Faculty / Admin)
  // =========================================================================
  const renderTabContent = () => {
    switch (currentTab) {
      case 'portal':
        if (user.role === 'STUDENT') return <StudentDashboard />;
        if (user.role === 'TEACHER') return <TeacherDashboard />;
        return <AdminDashboard onNavigateTab={setCurrentTab} />;

      case 'monitoring':
        if (user.role === 'STUDENT') {
          return (
            <AccessDeniedPage
              onBack={() => setCurrentTab('portal')}
              attemptedResource="Authentication Monitoring Dashboard"
              requiredRole="TEACHER or ADMINISTRATOR"
            />
          );
        }
        return <AdminDashboard onNavigateTab={setCurrentTab} />;

      case 'logs':
        if (user.role === 'STUDENT') {
          return (
            <AccessDeniedPage
              onBack={() => setCurrentTab('portal')}
              attemptedResource="Activity & Audit Logs"
              requiredRole="TEACHER or ADMINISTRATOR"
            />
          );
        }
        return <AuditLogsPage />;

      case 'testing':
        return <SecurityTestingPage />;

      case 'matrix':
        return <TestMatrixPage />;

      case 'comparison':
        return <ComparisonPage />;

      case 'users':
        if (user.role !== 'ADMINISTRATOR') {
          return (
            <AccessDeniedPage
              onBack={() => setCurrentTab('portal')}
              attemptedResource="User Management & Role Directory"
              requiredRole="ADMINISTRATOR"
            />
          );
        }
        return <UserManagementPage />;

      case 'sessions':
        if (user.role !== 'ADMINISTRATOR') {
          return (
            <AccessDeniedPage
              onBack={() => setCurrentTab('portal')}
              attemptedResource="Active Session Management & Revocation"
              requiredRole="ADMINISTRATOR"
            />
          );
        }
        return <SessionsPage />;

      case 'tickets':
        if (user.role !== 'ADMINISTRATOR') {
          return (
            <AccessDeniedPage
              onBack={() => setCurrentTab('portal')}
              attemptedResource="Support Appeals & Complaint Desk"
              requiredRole="ADMINISTRATOR"
            />
          );
        }
        return <TicketsPage />;

      case 'reports':
        if (user.role !== 'ADMINISTRATOR') {
          return (
            <AccessDeniedPage
              onBack={() => setCurrentTab('portal')}
              attemptedResource="System Security Report & Analytics"
              requiredRole="ADMINISTRATOR"
            />
          );
        }
        return <ReportsPage />;

      case 'profile':
        return <ProfilePage />;

      default:
        if (user.role === 'STUDENT') return <StudentDashboard />;
        if (user.role === 'TEACHER') return <TeacherDashboard />;
        return <AdminDashboard onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <PortalLayout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderTabContent()}
    </PortalLayout>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleSplashFinished = () => {
      setShowSplash(false);
    };

    window.addEventListener(
      'auth360-splash-finished',
      handleSplashFinished
    );

    return () => {
      window.removeEventListener(
        'auth360-splash-finished',
        handleSplashFinished
      );
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen />}

      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </>
  );
}