import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiClient } from '../services/api';
import { StudentRecord, Assignment, ExamResult } from '../types/auth';

import {
  GraduationCap,
  BookOpen,
  Award,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  FileText,
  Activity,
  Library,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Target,
  Brain,
  TrendingUp,
  Zap,
  UserRound,
} from 'lucide-react';

import { StatusBadge } from '../components/StatusBadge';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const [studentRecord, setStudentRecord] =
    useState<StudentRecord | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // ==================================================
  // FETCH STUDENT DATA
  // ==================================================

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      const data = await ApiClient.getStudentPortal(user?.email);

      setStudentRecord(data.studentRecord);
      setAssignments(data.assignments);
      setExamResults(data.examResults);
    } catch (err: any) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  // ==================================================
  // SUBMIT ASSIGNMENT
  // ==================================================

  const handleSubmitAssignment = async (assignmentId: string) => {
    setSubmittingId(assignmentId);

    try {
      const res = await ApiClient.submitAssignment(assignmentId);

      setNotice(res.message);

      await fetchStudentData();

      setTimeout(() => {
        setNotice(null);
      }, 3500);
    } catch (err: any) {
      setNotice(`Submission error: ${err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  // ==================================================
  // TODAY'S SCHEDULE
  // ==================================================

  const todaySchedule = [
    {
      time: '10:00 AM',
      title: 'Physics Lab',
      room: 'Room 301',
      instructor: 'Dr. Aris Thorne',
      status: 'Current Class',
      current: true,
    },
    {
      time: '11:30 AM',
      title: 'Mathematics Advanced',
      room: 'Room 301',
      instructor: 'Prof. Marcus Vance',
      status: 'Upcoming',
      current: false,
    },
    {
      time: '12:30 PM',
      title: 'Computer Science & Security',
      room: 'Room 302',
      instructor: 'Dr. Sarah Jenkins',
      status: 'Upcoming',
      current: false,
    },
    {
      time: '02:00 PM',
      title: 'Modern World History',
      room: 'Room 305',
      instructor: 'Prof. Helen Clark',
      status: 'Upcoming',
      current: false,
    },
  ];

  // ==================================================
  // ANNOUNCEMENTS
  // ==================================================

  const announcements = [
    {
      id: 'ann-1',
      title: 'History Symposium Registration Open',
      source: 'Academic Council · Today at 09:30 AM',
      summary:
        'Register for the Annual Fall Research Showcase before the October deadline.',
    },
    {
      id: 'ann-2',
      title: 'Library Extended Hours for Midterms',
      source: 'Central Library Services · Yesterday',
      summary:
        'Study halls and digital labs will remain accessible 24/7 during exam week.',
    },
    {
      id: 'ann-3',
      title: 'Campus Portal Maintenance Window',
      source: 'IT Support Directorate · 2 days ago',
      summary:
        'Scheduled routine updates will occur Saturday between 02:00 AM - 04:00 AM.',
    },
  ];

  // ==================================================
  // LIBRARY RESOURCES
  // ==================================================

  const libraryResources = [
    {
      title: 'Network Security Principles & Protocols',
      author: 'Dr. Sarah Jenkins · 4th Edition',
      tag: 'Course Textbook',
    },
    {
      title: 'Advanced Discrete Mathematics & Automata',
      author: 'Prof. Marcus Vance',
      tag: 'Core Reading',
    },
    {
      title: 'Applied Cryptography & Authentication Models',
      author: 'AUTH360 Academic Press',
      tag: 'E-Journal',
    },
  ];

  // ==================================================
  // DERIVED DATA
  // ==================================================

  const studentName =
    studentRecord?.fullName || user?.name || 'Student';

  const firstName = studentName.split(' ')[0];

  const attendanceRate = studentRecord?.attendanceRate ?? 0;

  const currentGpa = studentRecord?.gpa ?? 0;

  const pendingAssignments = assignments.filter(
    (assignment) =>
      assignment.status !== 'SUBMITTED' &&
      assignment.status !== 'GRADED'
  ).length;

  const submittedAssignments = assignments.filter(
    (assignment) => assignment.status === 'SUBMITTED'
  ).length;

  const gradedAssignments = assignments.filter(
    (assignment) => assignment.status === 'GRADED'
  ).length;

  const nextClass =
    todaySchedule.find((item) => !item.current) ||
    todaySchedule[0];

  const academicHealth =
    attendanceRate >= 90
      ? 'Excellent'
      : attendanceRate >= 85
        ? 'Good'
        : 'Needs Attention';

  const studyFocus =
    pendingAssignments > 0
      ? `${pendingAssignments} assignment${
          pendingAssignments > 1 ? 's' : ''
        } need your attention`
      : 'Your coursework is currently up to date';

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#07040f] text-white">
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />

        <div className="relative flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-400/20 bg-violet-500/10 shadow-2xl shadow-violet-900/40">
              <RefreshCw className="h-9 w-9 animate-spin text-violet-300" />
            </div>

            <div className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-violet-300">
              AUTH360
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              Preparing your academic workspace
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Loading your latest student information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // MAIN DASHBOARD
  // ==================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07040f] text-white">
      {/* BACKGROUND */}

      <div className="pointer-events-none absolute -left-56 -top-48 h-[520px] w-[520px] rounded-full bg-violet-700/20 blur-[130px]" />

      <div className="pointer-events-none absolute right-[-180px] top-[20%] h-[460px] w-[460px] rounded-full bg-fuchsia-700/15 blur-[130px]" />

      <div className="pointer-events-none absolute bottom-[-220px] left-[35%] h-[500px] w-[500px] rounded-full bg-indigo-700/10 blur-[140px]" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />

      <div className="relative z-10">
        {/* ==================================================
            TOP BRAND BAR
        ================================================== */}

        <header className="border-b border-white/[0.06] bg-[#080511]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 shadow-lg shadow-violet-900/20">
                <GraduationCap className="h-6 w-6 text-violet-300" />
              </div>

              <div>
                <div className="text-sm font-black tracking-[0.22em] text-white">
                  AUTH360
                </div>

                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                  Student Intelligence Portal
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/5 px-3 py-2 text-xs font-medium text-emerald-300 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Academic systems online
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
          {/* ==================================================
              HERO
          ================================================== */}

          <section className="relative mb-6 overflow-hidden rounded-[30px] border border-violet-400/10 bg-gradient-to-br from-[#171027] via-[#0f0a1d] to-[#0b0715] p-6 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-[90px]" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-[90px]" />

            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Student Command Center
                </div>

                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                    {firstName}
                  </span>
                  .
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                  Your academic workspace is ready. Track your progress,
                  manage coursework, review performance, and stay ahead of
                  your schedule from one place.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#section-assignments"
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-400"
                  >
                    View assignments
                    <ArrowUpRight className="h-4 w-4" />
                  </a>

                  <a
                    href="#section-timetable"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-violet-400/20 hover:bg-white/[0.07]"
                  >
                    Today's schedule
                    <CalendarIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* STUDENT IDENTITY */}

              <div className="shrink-0">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:min-w-[310px]">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                      <ShieldCheck className="h-6 w-6 text-violet-300" />
                    </div>

                    <span className="rounded-full border border-emerald-400/10 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      Verified
                    </span>
                  </div>

                  <div className="text-lg font-bold text-white">
                    {studentName}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {studentRecord?.studentId || 'Student ID'}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">
                        GPA
                      </div>

                      <div className="mt-1 text-lg font-black text-violet-300">
                        {currentGpa.toFixed(2)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">
                        Attendance
                      </div>

                      <div className="mt-1 text-lg font-black text-fuchsia-300">
                        {attendanceRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              ACADEMIC PULSE
          ================================================== */}

          <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Academic Pulse */}

            <div className="relative overflow-hidden rounded-2xl border border-violet-400/10 bg-[#0d0918]/90 p-5 lg:col-span-7">
              <div className="pointer-events-none absolute right-[-50px] top-[-60px] h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />

              <div className="relative">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-violet-300" />

                      <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">
                        Academic Pulse
                      </h2>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      A live snapshot generated from your academic records.
                    </p>
                  </div>

                  <div className="rounded-xl border border-violet-400/10 bg-violet-500/10 p-2">
                    <Activity className="h-4 w-4 text-violet-300" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                      <TrendingUp className="h-4 w-4 text-violet-300" />
                    </div>

                    <div className="text-xl font-black text-white">
                      {academicHealth}
                    </div>

                    <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                      Academic health
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                      <Target className="h-4 w-4 text-amber-300" />
                    </div>

                    <div className="text-xl font-black text-white">
                      {pendingAssignments}
                    </div>

                    <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                      Pending
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/10">
                      <Send className="h-4 w-4 text-fuchsia-300" />
                    </div>

                    <div className="text-xl font-black text-white">
                      {submittedAssignments}
                    </div>

                    <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                      Submitted
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Award className="h-4 w-4 text-emerald-300" />
                    </div>

                    <div className="text-xl font-black text-white">
                      {gradedAssignments}
                    </div>

                    <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                      Graded
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Focus */}

            <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/10 bg-gradient-to-br from-[#180d22] to-[#0d0918] p-5 lg:col-span-5">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-600/15 blur-3xl" />

              <div className="relative">
                <div className="mb-5 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-fuchsia-300" />

                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">
                    Today's Focus
                  </h2>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10">
                      <Target className="h-4 w-4 text-fuchsia-300" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">
                        Priority
                      </div>

                      <div className="mt-1 text-sm font-bold text-white">
                        {studyFocus}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                      <CalendarIcon className="h-4 w-4 text-violet-300" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
                        Next class
                      </div>

                      <div className="mt-1 truncate text-sm font-bold text-white">
                        {nextClass.title}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {nextClass.time} · {nextClass.room}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              NOTICE
          ================================================== */}

          {notice && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 shadow-lg shadow-violet-900/10">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-300" />
              <span>{notice}</span>
            </div>
          )}

          {/* ==================================================
              QUICK STATS
          ================================================== */}

          <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-4 backdrop-blur-xl">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                <GraduationCap className="h-4 w-4 text-violet-300" />
              </div>

              <div className="truncate text-2xl font-black text-white">
                {studentRecord?.studentId || '—'}
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                Student ID
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-4 backdrop-blur-xl">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/10">
                <BookOpen className="h-4 w-4 text-fuchsia-300" />
              </div>

              <div className="text-2xl font-black text-white">
                {assignments.length}
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                Assignments
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-4 backdrop-blur-xl">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <Award className="h-4 w-4 text-emerald-300" />
              </div>

              <div className="text-2xl font-black text-white">
                {examResults.length}
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                Exam results
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-4 backdrop-blur-xl">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                <Activity className="h-4 w-4 text-indigo-300" />
              </div>

              <div className="text-2xl font-black text-white">
                {attendanceRate.toFixed(1)}%
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                Attendance
              </div>
            </div>
          </section>

          {/* ==================================================
              MAIN DASHBOARD GRID
          ================================================== */}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* ==================================================
                TIMETABLE
            ================================================== */}

            <section
              id="section-timetable"
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 xl:col-span-7"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-violet-300" />

                    <h2 className="font-black text-white">
                      Today's Timetable
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Your scheduled academic sessions
                  </p>
                </div>

                <span className="rounded-full border border-violet-400/10 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  {todaySchedule.length} sessions
                </span>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {todaySchedule.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className={`group flex gap-4 px-5 py-4 transition ${
                      item.current
                        ? 'bg-violet-500/[0.06]'
                        : 'hover:bg-white/[0.025]'
                    }`}
                  >
                    <div className="w-20 shrink-0">
                      <div
                        className={`text-xs font-bold ${
                          item.current
                            ? 'text-violet-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.time}
                      </div>
                    </div>

                    <div
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        item.current
                          ? 'bg-violet-400 shadow-lg shadow-violet-500/50'
                          : 'bg-slate-700'
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white">
                          {item.title}
                        </h3>

                        {item.current && (
                          <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300">
                            Live
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {item.instructor} · {item.room}
                      </div>
                    </div>

                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-700 transition group-hover:text-violet-300" />
                  </div>
                ))}
              </div>
            </section>

            {/* ==================================================
                ATTENDANCE
            ================================================== */}

            <section
              id="section-attendance"
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 xl:col-span-5"
            >
              <div className="border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-fuchsia-300" />

                  <h2 className="font-black text-white">
                    Attendance Overview
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Your current attendance performance
                </p>
              </div>

              <div className="p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-4xl font-black text-white">
                      {attendanceRate.toFixed(1)}%
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Overall attendance
                    </div>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      attendanceRate >= 90
                        ? 'bg-emerald-400/10 text-emerald-300'
                        : attendanceRate >= 85
                          ? 'bg-amber-400/10 text-amber-300'
                          : 'bg-rose-400/10 text-rose-300'
                    }`}
                  >
                    {academicHealth}
                  </div>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        Math.max(attendanceRate, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-[10px] text-slate-500">
                  <span>0%</span>
                  <span>Target: 85%</span>
                  <span>100%</span>
                </div>
              </div>
            </section>

            {/* ==================================================
                ASSIGNMENTS
            ================================================== */}

            <section
              id="section-assignments"
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 xl:col-span-7"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-violet-300" />

                    <h2 className="font-black text-white">
                      Assignments
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Coursework requiring your attention
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold text-slate-400">
                  {assignments.length} total
                </span>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {assignments.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" />

                    <p className="mt-3 text-sm font-bold text-white">
                      No assignments available
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Your coursework list is currently clear.
                    </p>
                  </div>
                ) : (
                  assignments.map((assignment) => {
                    const isSubmitting =
                      submittingId === assignment._id;

                    const isCompleted =
                      assignment.status === 'SUBMITTED' ||
                      assignment.status === 'GRADED';

                    return (
                      <div
                        key={assignment._id}
                        className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.025] sm:flex-row sm:items-center"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                          <BookOpen className="h-5 w-5 text-violet-300" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-white">
                              {assignment.title}
                            </h3>

                            <StatusBadge
                              status={assignment.status}
                              size="sm"
                            />
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {assignment.courseCode} ·{' '}
                            {assignment.courseName}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>
                              Instructor: {assignment.instructor}
                            </span>

                            {assignment.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due {assignment.dueDate}
                              </span>
                            )}
                          </div>

                          {assignment.status === 'GRADED' &&
                            assignment.score !== undefined && (
                              <div className="mt-2 text-xs font-bold text-emerald-300">
                                Score: {assignment.score}/
                                {assignment.maxScore}
                                {assignment.grade
                                  ? ` · Grade ${assignment.grade}`
                                  : ''}
                              </div>
                            )}
                        </div>

                        {!isCompleted && (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleSubmitAssignment(
                                assignment._id
                              )
                            }
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-300 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                Submitting
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5" />
                                Submit
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* ==================================================
                GRADES
            ================================================== */}

            <section
              id="section-grades"
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 xl:col-span-5"
            >
              <div className="border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-300" />

                  <h2 className="font-black text-white">
                    Latest Results
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Recent examination performance
                </p>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {examResults.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Award className="mx-auto h-8 w-8 text-slate-600" />

                    <p className="mt-3 text-sm font-bold text-white">
                      No results available
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Results will appear here once published.
                    </p>
                  </div>
                ) : (
                  examResults.map((exam) => (
                    <div
                      key={exam._id}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-white">
                          {exam.examName}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {exam.courseCode} · {exam.courseName}
                        </div>

                        <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                          {exam.date}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-lg font-black text-violet-300">
                          {exam.score}
                        </div>

                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Grade {exam.grade}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* ==================================================
                STUDENT PROFILE SNAPSHOT
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-violet-400/10 bg-gradient-to-br from-[#120b20] to-[#0d0918] xl:col-span-5">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-violet-300" />

                  <h2 className="font-black text-white">
                    Academic Profile
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Your current academic information
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    Grade Level
                  </div>

                  <div className="mt-2 text-sm font-bold text-white">
                    {studentRecord?.gradeLevel || '—'}
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    Major
                  </div>

                  <div className="mt-2 text-sm font-bold text-white">
                    {studentRecord?.major || '—'}
                  </div>
                </div>

                <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    Academic Advisor
                  </div>

                  <div className="mt-2 text-sm font-bold text-white">
                    {studentRecord?.advisor || '—'}
                  </div>
                </div>
              </div>
            </section>

            {/* ==================================================
                ANNOUNCEMENTS
            ================================================== */}

            <section
              id="section-messages"
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 xl:col-span-7"
            >
              <div className="border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-fuchsia-300" />

                  <h2 className="font-black text-white">
                    Academic Announcements
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Important updates from your academic community
                </p>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {announcements.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="px-5 py-4 transition hover:bg-white/[0.025]"
                  >
                    <div className="flex gap-4">
                      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-fuchsia-400 shadow-lg shadow-fuchsia-500/30" />

                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {announcement.title}
                        </h3>

                        <div className="mt-1 text-[10px] uppercase tracking-wider text-violet-300/70">
                          {announcement.source}
                        </div>

                        <p className="mt-2 text-xs leading-6 text-slate-500">
                          {announcement.summary}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ==================================================
                LIBRARY
            ================================================== */}

            <section
              id="section-library"
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 xl:col-span-5"
            >
              <div className="border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Library className="h-5 w-5 text-indigo-300" />

                  <h2 className="font-black text-white">
                    Learning Library
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Recommended academic resources
                </p>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {libraryResources.map((resource, index) => (
                  <div
                    key={`${resource.title}-${index}`}
                    className="group px-5 py-4 transition hover:bg-white/[0.025]"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                        <BookOpen className="h-4 w-4 text-indigo-300" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white">
                          {resource.title}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {resource.author}
                        </div>

                        <span className="mt-2 inline-flex rounded-full border border-indigo-400/10 bg-indigo-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-300">
                          {resource.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <footer className="mt-10 border-t border-white/[0.06] pt-6">
            <div className="flex flex-col gap-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <div>
                © {new Date().getFullYear()} AUTH360 · Vision Heights
                Academy
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                Secure Student Workspace
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export { StudentDashboard };