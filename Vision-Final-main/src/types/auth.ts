export type Role = 'STUDENT' | 'TEACHER' | 'ADMINISTRATOR';

export type AuthMode = 'PASSWORD_ONLY' | 'PASSWORD_OTP' | 'PASSWORD_OTP_EMAIL';

export type UserStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'BANNED' | 'DISABLED';

export type LogResult = 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'LOCKED' | 'UNAUTHORIZED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  statusReason?: string;
  suspensionDuration?: string;
  suspendedUntil?: string | null;
  bannedAt?: string | null;
  actionByAdmin?: string;
  failedLoginAttempts: number;
  lockoutUntil: string | null;
  mfaEnabled: boolean;
  phoneNumber?: string;
  phoneNumberMasked: string;
  studentId?: string;
  teacherId?: string;
  department?: string;
  lastLogin?: string | null;
  lastActivity?: string | null;
  isTestAccount?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionInfo {
  token: string;
  authMode: string;
  expiresAt: string;
}

export interface SessionItem {
  id: string;
  tokenMasked: string;
  email: string;
  role: string;
  isValid: boolean;
  authMode: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  revokedAt?: string;
  revokedBy?: string;
  isExpired: boolean;
}

export interface SystemSettings {
  activeAuthMode: AuthMode;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  otpExpirySeconds: number;
  emailOtpExpirySeconds: number;
  sessionTimeoutMinutes: number;
  gateways?: {
    ultraMsg: { configured: boolean; provider: string; instanceIdMasked?: string };
    email: { configured: boolean; provider: string; userMasked?: string };
  };
}

export interface AuthLog {
  _id: string;
  timestamp: string;
  userEmail: string;
  role: string;
  event: string;
  factor: 'PASSWORD' | 'MOBILE_OTP' | 'EMAIL_OTP' | 'SESSION' | 'SYSTEM';
  action: string;
  result: LogResult;
  details: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
}

export interface SecurityEvent {
  _id: string;
  timestamp: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actorEmail: string;
  description: string;
  resolved: boolean;
}

export interface SecurityAlert {
  _id: string;
  title: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  actorEmail: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  userId?: string;
  email: string;
  name: string;
  role?: string;
  category: 'ACCOUNT_LOCKED' | 'SUSPENSION_APPEAL' | 'MFA_ISSUE' | 'GENERAL_INQUIRY';
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  adminReply?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface SystemReport {
  generatedAt: string;
  generatedBy: string;
  systemStatus: string;
  users: {
    total: number;
    students: number;
    teachers: number;
    administrators: number;
    active: number;
    locked: number;
    suspended: number;
    banned: number;
    disabled: number;
  };
  sessions: {
    totalIssued: number;
    active: number;
    revoked: number;
  };
  authenticationAudit: {
    totalEvents: number;
    successfulLogins: number;
    failedLogins: number;
    otpFailures: number;
    rbacViolations: number;
    accountLockouts: number;
  };
  testMatrix: {
    totalTests: number;
    passed: number;
    failed: number;
    pending: number;
  };
  supportTickets: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  securityAlerts: {
    total: number;
    unacknowledged: number;
    critical: number;
    high: number;
  };
}

export interface SecurityMetrics {
  totalUsers: number;
  studentsCount: number;
  teachersCount: number;
  adminsCount: number;
  successfulLogins: number;
  failedLogins: number;
  mfaSuccesses: number;
  mfaFailures: number;
  accountLockouts: number;
  unauthorizedAttempts: number;
}

export interface TestMatrixItem {
  _id?: string;
  testId: string;
  title: string;
  role: string;
  testAction: string;
  expectedResult: string;
  actualResult: string;
  status: 'PENDING' | 'PASS' | 'FAIL';
  evidence: string;
  testedAt: string | null;
  notes?: string;
}

export interface TestRun {
  _id?: string;
  runId: string;
  scenario: AuthMode;
  runNumber: number;
  durationMs: number;
  stepsCompleted: number;
  totalSteps: number;
  success: boolean;
  timestamp: string;
  details: string;
}

export interface BenchmarkScenario {
  id: AuthMode;
  name: string;
  steps: number;
  stepNames: string[];
  securityLevel: string;
  resistanceRating: string;
  totalRuns: number;
  successfulRuns: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  otpFailures: number;
  expiredOtps: number;
  lockouts: number;
  runs: TestRun[];
}

export interface TestDispatch {
  id: string;
  type: 'MOBILE' | 'EMAIL';
  email: string;
  destinationMasked: string;
  code: string;
  timestamp: string;
  expiresAt: string;
  providerStatus?: string;
}

export interface StudentRecord {
  studentId: string;
  studentEmail: string;
  fullName: string;
  gradeLevel: string;
  gpa: number;
  attendanceRate: number;
  major: string;
  advisor: string;
}

export interface Assignment {
  _id: string;
  title: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  dueDate: string;
  status: 'SUBMITTED' | 'PENDING' | 'GRADED';
  grade?: string;
  maxScore: number;
  score?: number;
  description: string;
}

export interface ExamResult {
  _id: string;
  studentEmail: string;
  courseCode: string;
  courseName: string;
  examName: string;
  date: string;
  score: number;
  grade: string;
  status: 'PASSED' | 'FAILED';
  percentile: number;
}
