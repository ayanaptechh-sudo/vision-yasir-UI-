import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  Clock,
  ClipboardList,
  Award,
  Users,
  Activity,
  FileText,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Library,
  UserCheck,
  Laptop,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Shield,
  CircleUserRound,
  AlertTriangle,
} from 'lucide-react';
import { TwoFactorSetupModal } from './TwoFactorSetupModal';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  isChildOfPortal?: boolean;
}

interface PortalLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenResetModal?: () => void;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  currentTab,
  setCurrentTab,
  children,
}) => {
  const { user, logout, theme, toggleTheme } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Section 9: 2FA Warning Rule
  // Teacher without 2FA: SHOW WARNING
  // Admin without 2FA: SHOW WARNING
  // Teacher with 2FA: HIDE WARNING
  // Admin with 2FA: HIDE WARNING
  // Student: NEVER SHOW WARNING
  const showTwoFactorWarning = !!(user && user.role !== 'STUDENT' && !user.twoFactorEnabled);

  // =========================================================
  // LIVE CAMPUS CLOCK
  // =========================================================
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const month = now.getMonth() + 1;
      const day = now.getDate();
      const year = now.getFullYear();

      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');

      const ampm = hours >= 12 ? 'PM' : 'AM';

      hours = hours % 12;
      hours = hours || 12;

      setCurrentTime(
        `${month}/${day}/${year}, ${hours}:${minutes} ${ampm}`
      );
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // STUDENT NAVIGATION
  // =========================================================
  const studentNavItems: NavItem[] = [
    {
      id: 'portal',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'timetable',
      label: 'Schedule & Classes',
      icon: Clock,
      isChildOfPortal: true,
    },
    {
      id: 'assignments',
      label: 'Coursework & Labs',
      icon: FileText,
      isChildOfPortal: true,
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: Activity,
      isChildOfPortal: true,
    },
    {
      id: 'grades',
      label: 'Grades & GPA',
      icon: Award,
      isChildOfPortal: true,
    },
    {
      id: 'library',
      label: 'Digital Library',
      icon: Library,
      isChildOfPortal: true,
    },
    {
      id: 'messages',
      label: 'Announcements',
      icon: Bell,
      isChildOfPortal: true,
    },
    {
      id: 'profile',
      label: 'Student Profile',
      icon: GraduationCap,
    },
  ];

  // =========================================================
  // TEACHER NAVIGATION
  // =========================================================
  const teacherNavItems: NavItem[] = [
    {
      id: 'portal',
      label: 'Faculty Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'assignments',
      label: 'Coursework Evaluation',
      icon: ClipboardList,
      isChildOfPortal: true,
    },
    {
      id: 'students',
      label: 'Assigned Students',
      icon: Users,
      isChildOfPortal: true,
    },
    {
      id: 'grades',
      label: 'Gradebook & Exams',
      icon: Award,
      isChildOfPortal: true,
    },
    {
      id: 'profile',
      label: 'Faculty Profile',
      icon: UserCheck,
    },
  ];

  // =========================================================
  // ADMIN NAVIGATION
  // =========================================================
  const adminNavItems: NavItem[] = [
    {
      id: 'portal',
      label: 'Administration Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'users',
      label: 'User Directory',
      icon: Users,
    },
    {
      id: 'sessions',
      label: 'Active Sessions',
      icon: Laptop,
    },
    {
      id: 'reports',
      label: 'Institutional Reports',
      icon: FileText,
    },
    {
      id: 'tickets',
      label: 'Support & Inquiries',
      icon: MessageSquare,
    },
    {
      id: 'profile',
      label: 'Administrator Profile',
      icon: ShieldCheck,
    },
  ];

  // =========================================================
  // ROLE BASED NAVIGATION
  // =========================================================
  const currentNavItems =
    user?.role === 'STUDENT'
      ? studentNavItems
      : user?.role === 'TEACHER'
      ? teacherNavItems
      : adminNavItems;

  // =========================================================
  // NAVIGATION HANDLER
  // =========================================================
  const handleNavClick = (
    id: string,
    isChildOfPortal?: boolean
  ) => {
    if (isChildOfPortal) {
      setCurrentTab('portal');

      setTimeout(() => {
        const el = document.getElementById(`section-${id}`);

        if (el) {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100);
    } else {
      setCurrentTab(id);
    }

    setMobileMenuOpen(false);
  };

  // =========================================================
  // ROLE CONFIG
  // =========================================================
  const getRoleLabel = () => {
    switch (user?.role) {
      case 'ADMINISTRATOR':
        return 'Administrator';

      case 'TEACHER':
        return 'Faculty';

      case 'STUDENT':
      default:
        return 'Student';
    }
  };

  const getPortalLabel = () => {
    switch (user?.role) {
      case 'ADMINISTRATOR':
        return 'ADMIN CONTROL';

      case 'TEACHER':
        return 'FACULTY PORTAL';

      case 'STUDENT':
      default:
        return 'STUDENT PORTAL';
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return 'bg-amber-400/10 text-amber-300 border border-amber-400/20';

      case 'TEACHER':
        return 'bg-blue-400/10 text-blue-300 border border-blue-400/20';

      case 'STUDENT':
      default:
        return 'bg-violet-400/10 text-violet-300 border border-violet-400/20';
    }
  };

  return (
    <div
      className="
        min-h-screen
        flex
        flex-col
        lg:flex-row
        bg-[#070510]
        text-slate-100
        transition-colors
        duration-300
        overflow-hidden
      "
    >
      {/* ===================================================== */}
      {/* BACKGROUND AMBIENT GLOW                               */}
      {/* ===================================================== */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="
            absolute
            -top-32
            -left-32
            w-[420px]
            h-[420px]
            rounded-full
            bg-violet-700/10
            blur-[120px]
          "
        />

        <div
          className="
            absolute
            top-1/3
            right-0
            w-[380px]
            h-[380px]
            rounded-full
            bg-fuchsia-700/5
            blur-[120px]
          "
        />
      </div>

      {/* ===================================================== */}
      {/* DESKTOP SIDEBAR                                       */}
      {/* ===================================================== */}

      <aside
        className="
          hidden
          lg:flex
          lg:flex-col
          w-[272px]
          shrink-0
          relative
          z-30
          bg-[#0a0714]/95
          border-r
          border-violet-500/10
          backdrop-blur-2xl
          shadow-[20px_0_60px_rgba(0,0,0,0.25)]
        "
      >
        {/* ================================================= */}
        {/* BRAND                                              */}
        {/* ================================================= */}

        <div
          className="
            h-[82px]
            px-5
            flex
            items-center
            gap-3
            border-b
            border-violet-500/10
            relative
          "
        >
          {/* Logo */}
          <div
            className="
              relative
              w-11
              h-11
              rounded-2xl
              flex
              items-center
              justify-center
              bg-gradient-to-br
              from-violet-500
              via-purple-600
              to-fuchsia-600
              shadow-[0_0_28px_rgba(139,92,246,0.35)]
              ring-1
              ring-white/10
            "
          >
            <Shield className="w-5 h-5 text-white" />

            <div
              className="
                absolute
                -top-1
                -right-1
                w-3
                h-3
                rounded-full
                bg-emerald-400
                border-2
                border-[#0a0714]
                shadow-[0_0_10px_rgba(52,211,153,0.7)]
              "
            />
          </div>

          <div className="min-w-0">
            <div
              className="
                text-[15px]
                font-black
                tracking-[0.18em]
                text-white
              "
            >
              AUTH<span className="text-violet-400">360</span>
            </div>

            <div
              className="
                text-[9px]
                font-bold
                tracking-[0.22em]
                uppercase
                text-slate-500
                mt-0.5
              "
            >
              Vision Heights
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* SYSTEM STATUS                                     */}
        {/* ================================================= */}

        <div className="px-5 pt-5">
          <div
            className="
              flex
              items-center
              justify-between
              px-3
              py-2.5
              rounded-xl
              bg-violet-500/[0.06]
              border
              border-violet-500/10
            "
          >
            <div className="flex items-center gap-2">
              <span
                className="
                  relative
                  flex
                  w-2
                  h-2
                "
              >
                <span
                  className="
                    absolute
                    inline-flex
                    h-full
                    w-full
                    rounded-full
                    bg-emerald-400
                    opacity-60
                    animate-ping
                  "
                />

                <span
                  className="
                    relative
                    inline-flex
                    w-2
                    h-2
                    rounded-full
                    bg-emerald-400
                  "
                />
              </span>

              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                System Online
              </span>
            </div>

            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
        </div>

        {/* ================================================= */}
        {/* NAVIGATION                                        */}
        {/* ================================================= */}

        <div
          className="
            flex-1
            py-6
            px-4
            overflow-y-auto
            scrollbar-thin
            scrollbar-thumb-violet-500/20
          "
        >
          <div className="px-2 mb-3">
            <div
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.22em]
                text-slate-600
              "
            >
              {getPortalLabel()}
            </div>
          </div>

          <nav className="space-y-1">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    handleNavClick(
                      item.id,
                      item.isChildOfPortal
                    )
                  }
                  className={`
                    group
                    relative
                    w-full
                    flex
                    items-center
                    gap-3
                    px-3
                    py-3
                    rounded-xl
                    text-left
                    text-sm
                    transition-all
                    duration-200

                    ${
                      isActive
                        ? `
                          bg-gradient-to-r
                          from-violet-500/20
                          to-fuchsia-500/5
                          text-white
                          border
                          border-violet-500/20
                          shadow-[0_8px_25px_rgba(124,58,237,0.12)]
                        `
                        : `
                          text-slate-500
                          hover:text-slate-200
                          hover:bg-white/[0.035]
                          border
                          border-transparent
                        `
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span
                      className="
                        absolute
                        left-0
                        top-1/2
                        -translate-y-1/2
                        w-[3px]
                        h-7
                        rounded-r-full
                        bg-gradient-to-b
                        from-violet-400
                        to-fuchsia-500
                        shadow-[0_0_12px_rgba(167,139,250,0.8)]
                      "
                    />
                  )}

                  <div
                    className={`
                      w-8
                      h-8
                      rounded-lg
                      flex
                      items-center
                      justify-center
                      transition-all
                      ${
                        isActive
                          ? `
                            bg-violet-500/15
                            text-violet-300
                          `
                          : `
                            bg-white/[0.025]
                            text-slate-500
                            group-hover:bg-violet-500/10
                            group-hover:text-violet-300
                          `
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="truncate flex-1 font-medium">
                    {item.label}
                  </span>

                  {isActive && (
                    <span
                      className="
                        w-1.5
                        h-1.5
                        rounded-full
                        bg-violet-400
                        shadow-[0_0_8px_rgba(167,139,250,0.9)]
                      "
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ================================================= */}
        {/* USER CARD + LOGOUT                                */}
        {/* ================================================= */}

        <div
          className="
            p-4
            border-t
            border-violet-500/10
          "
        >
          {/* User card */}
          <div
            className="
              p-3
              rounded-2xl
              bg-white/[0.025]
              border
              border-white/[0.06]
              mb-3
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  relative
                  w-9
                  h-9
                  shrink-0
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  bg-gradient-to-br
                  from-violet-500
                  to-fuchsia-600
                  text-white
                  text-sm
                  font-black
                  uppercase
                  shadow-[0_0_18px_rgba(139,92,246,0.25)]
                "
              >
                {user?.name?.charAt(0) || 'U'}

                <span
                  className="
                    absolute
                    -right-0.5
                    -bottom-0.5
                    w-2.5
                    h-2.5
                    rounded-full
                    bg-emerald-400
                    border-2
                    border-[#0e0a18]
                  "
                />
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className="
                    text-xs
                    font-bold
                    text-slate-200
                    truncate
                  "
                >
                  {user?.name || 'User'}
                </div>

                <div
                  className="
                    text-[9px]
                    text-slate-500
                    uppercase
                    tracking-wider
                    mt-0.5
                  "
                >
                  {getRoleLabel()}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              text-xs
              font-bold
              text-slate-500
              border
              border-white/[0.06]
              bg-white/[0.02]
              hover:bg-rose-500/10
              hover:text-rose-300
              hover:border-rose-500/20
              transition-all
            "
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ===================================================== */}
      {/* MAIN VIEWPORT                                         */}
      {/* ===================================================== */}

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* ================================================= */}
        {/* TOPBAR                                            */}
        {/* ================================================= */}

        <header
          className="
            h-[72px]
            px-4
            sm:px-6
            lg:px-8
            flex
            items-center
            justify-between
            gap-4
            shrink-0
            bg-[#090611]/90
            border-b
            border-violet-500/10
            backdrop-blur-2xl
            relative
            z-40
          "
        >
          {/* Left */}
          <div
            className="
              flex
              items-center
              gap-3
              flex-1
              max-w-xl
            "
          >
            {/* Mobile menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="
                lg:hidden
                p-2.5
                rounded-xl
                text-slate-400
                bg-white/[0.03]
                border
                border-white/[0.06]
                hover:text-white
                hover:bg-violet-500/10
                transition-all
              "
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="relative w-full max-w-lg">
              <Search
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  w-4
                  h-4
                  text-slate-600
                  pointer-events-none
                "
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search portal..."
                className="
                  w-full
                  pl-11
                  pr-16
                  py-2.5
                  text-xs
                  rounded-xl
                  bg-white/[0.025]
                  border
                  border-white/[0.07]
                  text-slate-200
                  placeholder:text-slate-600
                  outline-none
                  focus:border-violet-500/40
                  focus:bg-violet-500/[0.04]
                  transition-all
                "
              />

              <div
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  hidden
                  sm:flex
                  items-center
                  gap-1
                "
              >
                <kbd
                  className="
                    px-1.5
                    py-0.5
                    rounded
                    bg-white/[0.05]
                    border
                    border-white/[0.06]
                    text-[9px]
                    text-slate-600
                    font-mono
                  "
                >
                  /
                </kbd>
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Time */}
            <div
              className="
                hidden
                xl:flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                bg-white/[0.025]
                border
                border-white/[0.05]
              "
            >
              <Clock className="w-3.5 h-3.5 text-violet-400" />

              <span
                className="
                  text-[10px]
                  font-mono
                  text-slate-500
                "
              >
                {currentTime || 'Loading...'}
              </span>
            </div>

            {/* Notification */}
            <button
              onClick={() => setCurrentTab('messages')}
              className="
                relative
                p-2.5
                rounded-xl
                text-slate-500
                bg-white/[0.025]
                border
                border-white/[0.06]
                hover:text-violet-300
                hover:bg-violet-500/10
                transition-all
              "
              title="Announcements"
            >
              <Bell className="w-4 h-4" />

              <span
                className="
                  absolute
                  top-1.5
                  right-1.5
                  w-1.5
                  h-1.5
                  rounded-full
                  bg-violet-400
                  shadow-[0_0_7px_rgba(167,139,250,0.9)]
                "
              />
            </button>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              className="
                p-2.5
                rounded-xl
                text-slate-500
                bg-white/[0.025]
                border
                border-white/[0.06]
                hover:text-violet-300
                hover:bg-violet-500/10
                transition-all
              "
              title={
                theme === 'dark'
                  ? 'Switch to Light Mode'
                  : 'Switch to Dark Mode'
              }
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() =>
                  setProfileDropdownOpen(
                    !profileDropdownOpen
                  )
                }
                className="
                  flex
                  items-center
                  gap-2
                  pl-1.5
                  pr-2.5
                  py-1.5
                  rounded-xl
                  bg-white/[0.025]
                  border
                  border-white/[0.07]
                  hover:border-violet-500/25
                  hover:bg-violet-500/[0.04]
                  transition-all
                "
              >
                <div
                  className="
                    w-8
                    h-8
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    bg-gradient-to-br
                    from-violet-500
                    to-fuchsia-600
                    text-white
                    text-xs
                    font-black
                    uppercase
                  "
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>

                <div className="text-left hidden sm:block">
                  <div
                    className="
                      text-[11px]
                      font-bold
                      text-slate-200
                      truncate
                      max-w-[100px]
                    "
                  >
                    {user?.name?.split(' ')[0] ||
                      'User'}
                  </div>

                  <div
                    className="
                      text-[9px]
                      text-slate-600
                      uppercase
                      tracking-wider
                    "
                  >
                    {getRoleLabel()}
                  </div>
                </div>

                <ChevronDown
                  className={`
                    w-3.5
                    h-3.5
                    text-slate-600
                    transition-transform
                    ${
                      profileDropdownOpen
                        ? 'rotate-180'
                        : ''
                    }
                  `}
                />
              </button>

              {/* Profile dropdown */}
              {profileDropdownOpen && (
                <div
                  className="
                    absolute
                    right-0
                    mt-2
                    w-72
                    bg-[#100b1b]
                    border
                    border-violet-500/15
                    rounded-2xl
                    shadow-[0_20px_70px_rgba(0,0,0,0.5)]
                    p-3
                    z-50
                    backdrop-blur-xl
                  "
                >
                  {/* Profile header */}
                  <div
                    className="
                      p-3
                      rounded-xl
                      bg-violet-500/[0.05]
                      border
                      border-violet-500/10
                      mb-2
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          w-10
                          h-10
                          rounded-xl
                          flex
                          items-center
                          justify-center
                          bg-gradient-to-br
                          from-violet-500
                          to-fuchsia-600
                          text-white
                          font-black
                        "
                      >
                        {user?.name?.charAt(0) ||
                          'U'}
                      </div>

                      <div className="min-w-0">
                        <p
                          className="
                            text-xs
                            font-bold
                            text-white
                            truncate
                          "
                        >
                          {user?.name || 'User'}
                        </p>

                        <p
                          className="
                            text-[10px]
                            text-slate-500
                            truncate
                            mt-0.5
                          "
                        >
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1.5
                        mt-3
                        px-2.5
                        py-1
                        text-[9px]
                        font-bold
                        rounded-lg
                        uppercase
                        tracking-wider
                        ${getRoleBadgeStyle(
                          user?.role
                        )}
                      `}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {user?.role}
                    </span>
                  </div>

                  {/* Profile action */}
                  <button
                    onClick={() => {
                      setCurrentTab('profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="
                      w-full
                      flex
                      items-center
                      gap-3
                      px-3
                      py-2.5
                      rounded-xl
                      text-xs
                      font-semibold
                      text-slate-400
                      hover:text-white
                      hover:bg-white/[0.04]
                      transition-all
                    "
                  >
                    <CircleUserRound className="w-4 h-4 text-violet-400" />

                    <span>View My Profile</span>
                  </button>

                  {/* Logout */}
                  <div
                    className="
                      mt-2
                      pt-2
                      border-t
                      border-white/[0.06]
                    "
                  >
                    <button
                      onClick={async () => {
                        setProfileDropdownOpen(false);
                        await logout();
                      }}
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2.5
                        rounded-xl
                        text-xs
                        font-bold
                        text-rose-400
                        hover:bg-rose-500/10
                        transition-all
                      "
                    >
                      <LogOut className="w-4 h-4" />

                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ===================================================== */}
        {/* MOBILE DRAWER                                          */}
        {/* ===================================================== */}

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden flex">
            {/* Overlay */}
            <div
              className="
                fixed
                inset-0
                bg-black/70
                backdrop-blur-md
              "
              onClick={() =>
                setMobileMenuOpen(false)
              }
            />

            {/* Drawer */}
            <div
              className="
                relative
                w-[290px]
                max-w-[85vw]
                bg-[#0a0714]
                border-r
                border-violet-500/15
                flex
                flex-col
                h-full
                z-10
                shadow-[20px_0_70px_rgba(0,0,0,0.5)]
              "
            >
              {/* Mobile brand */}
              <div
                className="
                  h-[76px]
                  px-5
                  flex
                  items-center
                  justify-between
                  border-b
                  border-violet-500/10
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      bg-gradient-to-br
                      from-violet-500
                      to-fuchsia-600
                      shadow-[0_0_20px_rgba(139,92,246,0.3)]
                    "
                  >
                    <Shield className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <div
                      className="
                        text-sm
                        font-black
                        tracking-[0.15em]
                        text-white
                      "
                    >
                      AUTH<span className="text-violet-400">
                        360
                      </span>
                    </div>

                    <div
                      className="
                        text-[8px]
                        text-slate-600
                        uppercase
                        tracking-[0.2em]
                      "
                    >
                      Vision Heights
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="
                    p-2
                    rounded-xl
                    text-slate-500
                    hover:text-white
                    hover:bg-white/[0.05]
                  "
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile system status */}
              <div className="px-4 pt-4">
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    rounded-xl
                    bg-violet-500/[0.05]
                    border
                    border-violet-500/10
                  "
                >
                  <span
                    className="
                      w-1.5
                      h-1.5
                      rounded-full
                      bg-emerald-400
                      shadow-[0_0_8px_rgba(52,211,153,0.8)]
                    "
                  />

                  <span
                    className="
                      text-[9px]
                      font-bold
                      text-slate-500
                      uppercase
                      tracking-wider
                    "
                  >
                    Secure System Online
                  </span>
                </div>
              </div>

              {/* Mobile nav */}
              <div
                className="
                  flex-1
                  py-5
                  px-4
                  overflow-y-auto
                "
              >
                <div
                  className="
                    px-2
                    mb-3
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.2em]
                    text-slate-600
                  "
                >
                  {getPortalLabel()}
                </div>

                <nav className="space-y-1">
                  {currentNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      currentTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() =>
                          handleNavClick(
                            item.id,
                            item.isChildOfPortal
                          )
                        }
                        className={`
                          relative
                          w-full
                          flex
                          items-center
                          gap-3
                          px-3
                          py-3
                          rounded-xl
                          text-left
                          text-xs
                          font-semibold
                          transition-all

                          ${
                            isActive
                              ? `
                                bg-violet-500/15
                                text-white
                                border
                                border-violet-500/20
                              `
                              : `
                                text-slate-500
                                hover:text-slate-200
                                hover:bg-white/[0.035]
                                border
                                border-transparent
                              `
                          }
                        `}
                      >
                        {isActive && (
                          <span
                            className="
                              absolute
                              left-0
                              top-1/2
                              -translate-y-1/2
                              w-[3px]
                              h-6
                              rounded-r-full
                              bg-violet-400
                              shadow-[0_0_10px_rgba(167,139,250,0.8)]
                            "
                          />
                        )}

                        <Icon
                          className={`
                            w-4
                            h-4
                            ${
                              isActive
                                ? 'text-violet-300'
                                : 'text-slate-600'
                            }
                          `}
                        />

                        <span className="truncate">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile user/logout */}
              <div
                className="
                  p-4
                  border-t
                  border-violet-500/10
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    p-3
                    mb-3
                    rounded-xl
                    bg-white/[0.025]
                    border
                    border-white/[0.05]
                  "
                >
                  <div
                    className="
                      w-8
                      h-8
                      rounded-lg
                      flex
                      items-center
                      justify-center
                      bg-gradient-to-br
                      from-violet-500
                      to-fuchsia-600
                      text-white
                      text-xs
                      font-black
                    "
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>

                  <div className="min-w-0">
                    <div
                      className="
                        text-xs
                        font-bold
                        text-slate-200
                        truncate
                      "
                    >
                      {user?.name || 'User'}
                    </div>

                    <div
                      className="
                        text-[9px]
                        text-slate-600
                        uppercase
                        tracking-wider
                      "
                    >
                      {getRoleLabel()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="
                    w-full
                    flex
                    items-center
                    justify-center
                    gap-2
                    px-3
                    py-2.5
                    rounded-xl
                    text-xs
                    font-bold
                    text-rose-400
                    border
                    border-rose-500/15
                    bg-rose-500/[0.03]
                    hover:bg-rose-500/10
                    transition-all
                  "
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* CONTENT                                                */}
        {/* ===================================================== */}

        <main className="flex-1 overflow-y-auto relative">
          {/* Section 9: 2FA Warning Banner at top of dashboard */}
          {showTwoFactorWarning && (
            <div className="bg-amber-500/[0.08] border-b border-amber-500/20 px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    Google Authenticator 2FA is not set up.
                  </div>
                  <div className="text-[11px] text-amber-200/80">
                    Your account requires 2FA. Complete setup to secure your account.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSetupModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Set Up 2FA</span>
              </button>
            </div>
          )}

          {children}

          {/* Two Factor Setup Modal for Teacher and Admin */}
          <TwoFactorSetupModal
            isOpen={setupModalOpen}
            onClose={() => setSetupModalOpen(false)}
          />
        </main>
      </div>
    </div>
  );
};