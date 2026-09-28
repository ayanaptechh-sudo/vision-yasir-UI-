import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiClient } from '../services/api';
import { StudentRecord, Assignment, ExamResult } from '../types/auth';
import {
  BookOpen,
  Users,
  CheckCircle2,
  FileEdit,
  RefreshCw,
  Award,
  Clock,
  GraduationCap,
  X,
  Send,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{
    teacherInfo: any;
    students: StudentRecord[];
    assignments: Assignment[];
    examResults: ExamResult[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [gradingModalOpen, setGradingModalOpen] = useState<boolean>(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [gradeInput, setGradeInput] = useState<string>('A');
  const [scoreInput, setScoreInput] = useState<number>(95);
  const [isSavingGrade, setIsSavingGrade] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getTeacherPortal();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load teacher portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const openGradingModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setScoreInput(assignment.score || 90);
    setGradeInput(assignment.grade || 'A');
    setGradingModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setIsSavingGrade(true);
    try {
      await ApiClient.updateGrade(selectedAssignment._id, scoreInput, gradeInput);
      setNotice(`Grade updated for "${selectedAssignment.title}"!`);
      setGradingModalOpen(false);
      await fetchTeacherData();
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice(`Grading error: ${err.message}`);
    } finally {
      setIsSavingGrade(false);
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-[#07040f] text-white">
        <div className="flex items-center gap-3 text-violet-300">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Loading faculty portal records...</span>
        </div>
      </div>
    );
  }

  const teacherName = data?.teacherInfo?.name || user?.name || 'Prof. Marcus Vance';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Faculty Welcome Banner */}
      <div className="relative overflow-hidden rounded-[30px] border border-violet-400/10 bg-gradient-to-br from-[#171027] via-[#0f0a1d] to-[#0b0715] p-6 text-white shadow-2xl shadow-black/30 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-white shadow-lg shadow-violet-900/20">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">{teacherName}</h1>
                <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  Faculty
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Department: {data?.teacherInfo?.department || 'Computer Science & Mathematics'} · Fall Semester 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-500">Assigned Cohort</div>
              <div className="text-lg font-extrabold text-violet-300">
                {data?.students.length || 1} Students
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-500">Active Coursework</div>
              <div className="text-lg font-extrabold text-fuchsia-300">
                {data?.assignments.length || 4} Labs
              </div>
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-xs font-semibold text-violet-100 shadow-lg shadow-violet-900/10 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-300" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Faculty Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Coursework & Grading Queue */}
        <div
          id="section-assignments"
          className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-6 shadow-xl shadow-black/10"
        >
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-violet-300" />
              <h3 className="text-sm font-bold text-white">
                Coursework Evaluation Queue
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {data?.assignments.length || 0} Total
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[480px]">
            {data?.assignments.map((a) => (
              <div
                key={a._id}
                className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 transition-all hover:border-violet-400/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-violet-300">
                      {a.courseCode}
                    </span>
                    <h4 className="text-xs font-bold text-white">{a.title}</h4>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                      {a.description}
                    </p>
                  </div>
                  <StatusBadge status={a.status} size="sm" />
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-xs">
                  <span className="text-[11px] text-slate-500">Due: {a.dueDate}</span>
                  <div className="flex items-center gap-2">
                    {a.status === 'GRADED' && (
                      <span className="text-xs font-bold text-emerald-300">
                        {a.grade} ({a.score}/{a.maxScore})
                      </span>
                    )}
                    <button
                      onClick={() => openGradingModal(a)}
                      className="flex items-center gap-1.5 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
                    >
                      <FileEdit className="w-3 h-3" />
                      <span>{a.status === 'GRADED' ? 'Edit Grade' : 'Grade Submission'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Assigned Student Cohort */}
        <div
          id="section-students"
          className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#0d0918]/80 p-6 shadow-xl shadow-black/10"
        >
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-fuchsia-300" />
              <h3 className="text-sm font-bold text-white">
                Assigned Student Cohort
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Class Registry</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[480px]">
            {data?.students.map((s) => (
              <div
                key={s.studentId}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {s.fullName}
                    </span>
                    <span className="rounded-full border border-violet-400/10 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                      {s.studentId}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {s.studentEmail} · {s.major}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-white">
                    GPA {s.gpa.toFixed(2)}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-300">
                    {s.attendanceRate}% Attendance
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade Entry Modal */}
      {gradingModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/[0.08] bg-[#0d0918] p-6 text-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Evaluate Coursework</h3>
                <p className="text-xs text-slate-400 truncate">{selectedAssignment.title}</p>
              </div>
              <button
                onClick={() => setGradingModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">
                  Score (out of {selectedAssignment.maxScore})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedAssignment.maxScore}
                  value={scoreInput}
                  onChange={(e) => setScoreInput(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-bold text-white focus:border-violet-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">
                  Letter Grade
                </label>
                <select
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-bold text-white focus:border-violet-400 focus:outline-none"
                >
                  <option value="A+">A+ (Superior)</option>
                  <option value="A">A (Excellent)</option>
                  <option value="A-">A- (Very Good)</option>
                  <option value="B+">B+ (Good)</option>
                  <option value="B">B (Satisfactory)</option>
                  <option value="C">C (Pass)</option>
                  <option value="F">F (Fail)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-3">
                <button
                  type="button"
                  onClick={() => setGradingModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGrade}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white shadow-lg shadow-violet-900/30 hover:bg-violet-400 disabled:opacity-50"
                >
                  {isSavingGrade ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Save Evaluation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
