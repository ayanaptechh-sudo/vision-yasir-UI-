import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Collection interface matching MongoDB semantics
export interface Document {
  _id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type UserStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'BANNED' | 'DISABLED';
export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMINISTRATOR';

export interface UserDoc extends Document {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string; // scrypt hash
  passwordSalt: string;
  status: UserStatus;
  statusReason?: string;
  suspensionDuration?: string;
  suspendedUntil?: string | null;
  bannedAt?: string | null;
  actionByAdmin?: string;
  failedLoginAttempts: number;
  lockoutUntil: string | null;
  mfaEnabled: boolean;
  twoFactorEnabled?: boolean;
  totpSecretEncrypted?: string | null;
  totpTempSecretEncrypted?: string | null;
  lastVerifiedTotpStep?: number | null;
  failedTotpAttempts?: number;
  totpLockoutUntil?: string | null;
  phoneNumber: string;
  phoneNumberMasked: string;
  lastLogin?: string | null;
  lastActivity?: string | null;
  studentId?: string;
  teacherId?: string;
  department?: string;
  isTestAccount?: boolean;
}

export interface SessionDoc extends Document {
  token: string;
  userId: string;
  email: string;
  role: string;
  expiresAt: string;
  isValid: boolean;
  revokedAt?: string | null;
  revokedBy?: string | null;
  authMode: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
}

export interface OtpRecordDoc extends Document {
  userId: string;
  email: string;
  codeHash: string;
  codeSalt: string;
  type: 'MOBILE' | 'EMAIL';
  destinationMasked: string;
  expiresAt: string;
  verified: boolean;
  attempts: number;
  maxAttempts: number;
}

export interface AuthLogDoc extends Document {
  timestamp: string;
  userId?: string;
  userEmail: string;
  role: string;
  event: string;
  factor: 'PASSWORD' | 'MOBILE_OTP' | 'EMAIL_OTP' | 'SESSION' | 'SYSTEM';
  action: string;
  result: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'LOCKED' | 'UNAUTHORIZED';
  details: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
}

export interface SecurityEventDoc extends Document {
  timestamp: string;
  type: 'BRUTE_FORCE' | 'LOCKOUT' | 'UNAUTHORIZED_ACCESS' | 'MFA_BYPASS_ATTEMPT' | 'SESSION_TAMPERING' | 'CONFIG_CHANGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actorEmail: string;
  description: string;
  resolved: boolean;
}

export interface SecurityAlertDoc extends Document {
  title: string;
  type: 'FAILED_LOGINS' | 'ACCOUNT_LOCKOUT' | 'OTP_ABUSE' | 'RBAC_VIOLATION' | 'ADMIN_EVENT' | 'SESSION_TAMPERING';
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  actorEmail: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface SupportTicketDoc extends Document {
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
  resolvedAt?: string | null;
}

export interface TestMatrixDoc extends Document {
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

export interface TestRunDoc extends Document {
  runId: string;
  scenario: 'PASSWORD_ONLY' | 'PASSWORD_OTP' | 'PASSWORD_OTP_EMAIL';
  runNumber: number;
  durationMs: number;
  stepsCompleted: number;
  totalSteps: number;
  success: boolean;
  timestamp: string;
  details: string;
}

export interface SchoolRecordDoc extends Document {
  studentId: string;
  studentEmail: string;
  fullName: string;
  gradeLevel: string;
  gpa: number;
  attendanceRate: number;
  major: string;
  advisor: string;
}

export interface AssignmentDoc extends Document {
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

export interface ExamResultDoc extends Document {
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

export interface SystemSettingsDoc extends Document {
  key: string;
  activeAuthMode: 'PASSWORD_ONLY' | 'PASSWORD_OTP' | 'PASSWORD_OTP_EMAIL';
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  otpExpirySeconds: number;
  sessionTimeoutMinutes: number;
  emailOtpExpirySeconds: number;
  requireRiskVerification: boolean;
}

// In-Memory & File-Backed Storage implementing MongoDB query semantics
class Collection<T extends Document> {
  private items: Map<string, T> = new Map();

  constructor(private name: string) {}

  public load(docs: T[]) {
    this.items.clear();
    docs.forEach(doc => this.items.set(doc._id, doc));
  }

  public getAll(): T[] {
    return Array.from(this.items.values());
  }

  public async findOne(query: Partial<T> | ((item: T) => boolean)): Promise<T | null> {
    if (typeof query === 'function') {
      for (const item of this.items.values()) {
        if (query(item)) return JSON.parse(JSON.stringify(item));
      }
      return null;
    }

    for (const item of this.items.values()) {
      let match = true;
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) return JSON.parse(JSON.stringify(item));
    }
    return null;
  }

  public async find(query?: Partial<T> | ((item: T) => boolean)): Promise<T[]> {
    const all = Array.from(this.items.values());
    if (!query) {
      return JSON.parse(JSON.stringify(all));
    }

    if (typeof query === 'function') {
      return JSON.parse(JSON.stringify(all.filter(query)));
    }

    const filtered = all.filter(item => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val) return false;
      }
      return true;
    });

    return JSON.parse(JSON.stringify(filtered));
  }

  public async insertOne(doc: Omit<T, '_id' | 'createdAt' | 'updatedAt'> & Partial<Document>): Promise<T> {
    const now = new Date().toISOString();
    const _id = doc._id || crypto.randomUUID();
    const newDoc = {
      ...doc,
      _id,
      createdAt: doc.createdAt || now,
      updatedAt: now,
    } as T;

    this.items.set(_id, newDoc);
    return JSON.parse(JSON.stringify(newDoc));
  }

  public async insertMany(docs: Array<Omit<T, '_id' | 'createdAt' | 'updatedAt'> & Partial<Document>>): Promise<T[]> {
    const results: T[] = [];
    for (const d of docs) {
      results.push(await this.insertOne(d));
    }
    return results;
  }

  public async updateOne(
    filter: Partial<T> | ((item: T) => boolean),
    update: Partial<T> | { $set?: Partial<T>; $inc?: Record<string, number> }
  ): Promise<boolean> {
    const existing = await this.findOne(filter);
    if (!existing) return false;

    const target = this.items.get(existing._id)!;
    const now = new Date().toISOString();

    if ('$set' in update || '$inc' in update) {
      if (update.$set) {
        Object.assign(target, update.$set);
      }
      if (update.$inc) {
        for (const [key, incVal] of Object.entries(update.$inc)) {
          (target as any)[key] = (Number((target as any)[key]) || 0) + incVal;
        }
      }
    } else {
      Object.assign(target, update);
    }

    target.updatedAt = now;
    return true;
  }

  public async deleteOne(filter: Partial<T> | ((item: T) => boolean)): Promise<boolean> {
    const existing = await this.findOne(filter);
    if (!existing) return false;
    return this.items.delete(existing._id);
  }

  public async deleteMany(filter?: Partial<T> | ((item: T) => boolean)): Promise<number> {
    if (!filter) {
      const count = this.items.size;
      this.items.clear();
      return count;
    }

    const matches = await this.find(filter);
    for (const m of matches) {
      this.items.delete(m._id);
    }
    return matches.length;
  }

  public async countDocuments(query?: Partial<T> | ((item: T) => boolean)): Promise<number> {
    const items = await this.find(query);
    return items.length;
  }
}

// Password hashing using Node.js crypto scrypt
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, actualSalt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt: actualSalt,
  };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    if (keyBuffer.length !== hashBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, hashBuffer);
  } catch {
    return false;
  }
}

// Database instance containing all collections
export class Database {
  public users = new Collection<UserDoc>('users');
  public sessions = new Collection<SessionDoc>('sessions');
  public otp_records = new Collection<OtpRecordDoc>('otp_records');
  public authentication_logs = new Collection<AuthLogDoc>('authentication_logs');
  public security_events = new Collection<SecurityEventDoc>('security_events');
  public security_alerts = new Collection<SecurityAlertDoc>('security_alerts');
  public support_tickets = new Collection<SupportTicketDoc>('support_tickets');
  public test_matrix = new Collection<TestMatrixDoc>('test_matrix');
  public test_runs = new Collection<TestRunDoc>('test_runs');
  public school_records = new Collection<SchoolRecordDoc>('school_records');
  public assignments = new Collection<AssignmentDoc>('assignments');
  public exam_results = new Collection<ExamResultDoc>('exam_results');
  public system_settings = new Collection<SystemSettingsDoc>('system_settings');

  constructor() {
    this.seedDefaultData();
  }

  public seedDefaultData(force: boolean = false) {
    // Clear collections
    this.users.deleteMany();
    this.sessions.deleteMany();
    this.otp_records.deleteMany();
    this.authentication_logs.deleteMany();
    this.security_events.deleteMany();
    this.security_alerts.deleteMany();
    this.support_tickets.deleteMany();
    this.test_matrix.deleteMany();
    this.test_runs.deleteMany();
    this.school_records.deleteMany();
    this.assignments.deleteMany();
    this.exam_results.deleteMany();
    this.system_settings.deleteMany();

    // Default system settings
    this.system_settings.insertOne({
      key: 'GLOBAL_SETTINGS',
      activeAuthMode: 'PASSWORD_ONLY', // Default baseline scenario for SRS comparative analysis
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 5,
      otpExpirySeconds: 300, // 5 minutes default
      emailOtpExpirySeconds: 300, // 5 minutes default
      sessionTimeoutMinutes: 30,
      requireRiskVerification: false,
    });

    // =========================================================================
    // 1. INITIAL PRIMARY ADMINISTRATOR (Per Requirement #1):
    // Name: Ayan
    // Email: ayanaptechh@gmail.com
    // Password: Techwiz2254@
    // WhatsApp: +923709001226
    // =========================================================================
    const initialAdminPass = hashPassword('Techwiz2254@');
    this.users.insertOne({
      email: 'ayanaptechh@gmail.com',
      name: 'Ayan',
      role: 'ADMINISTRATOR',
      passwordHash: initialAdminPass.hash,
      passwordSalt: initialAdminPass.salt,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      mfaEnabled: true,
      twoFactorEnabled: false,
      failedTotpAttempts: 0,
      phoneNumber: '+923709001226',
      phoneNumberMasked: '+92 370 •••1226',
      department: 'Security Operations & Identity Administration',
      isTestAccount: false,
    });

    // =========================================================================
    // 2. DEMO / TEST ACCOUNTS (Clearly separated from Real Initial Admin):
    // Test Student & Test Teacher for educational evaluation and lab repeatability
    // =========================================================================
    const studentPass = hashPassword('Student@123');
    this.users.insertOne({
      email: 'student@test.local',
      name: 'Alex Rivera [Lab Demo Student]',
      role: 'STUDENT',
      passwordHash: studentPass.hash,
      passwordSalt: studentPass.salt,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      mfaEnabled: false,
      twoFactorEnabled: false,
      phoneNumber: '+15550194821',
      phoneNumberMasked: '+1 (555) •••-4821',
      studentId: 'STU-DEMO-9041',
      department: 'Cybersecurity & Information Assurance',
      isTestAccount: true,
    });

    const teacherPass = hashPassword('Teacher@123');
    this.users.insertOne({
      email: 'teacher@test.local',
      name: 'Prof. Marcus Vance [Lab Demo Faculty]',
      role: 'TEACHER',
      passwordHash: teacherPass.hash,
      passwordSalt: teacherPass.salt,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      mfaEnabled: true,
      twoFactorEnabled: false,
      failedTotpAttempts: 0,
      phoneNumber: '+15550197390',
      phoneNumberMasked: '+1 (555) •••-7390',
      teacherId: 'FAC-DEMO-1082',
      department: 'Network Defense & Cryptography',
      isTestAccount: true,
    });

    // Seed initial support ticket samples
    this.support_tickets.insertMany([
      {
        ticketNumber: 'TKT-1001',
        email: 'student@test.local',
        name: 'Alex Rivera',
        role: 'STUDENT',
        category: 'ACCOUNT_LOCKED',
        subject: 'Account unlocked inquiry after lab simulation',
        message: 'I was testing consecutive failed passwords in Lab T07 and hit the 5-attempt limit. Requesting confirmation of reset.',
        status: 'COMPLETED',
        adminReply: 'Account lockout threshold verified. Account has been automatically restored.',
        resolvedAt: new Date().toISOString(),
      },
      {
        ticketNumber: 'TKT-1002',
        email: 'teacher@test.local',
        name: 'Prof. Marcus Vance',
        role: 'TEACHER',
        category: 'MFA_ISSUE',
        subject: 'WhatsApp OTP Delivery Verification',
        message: 'Verifying UltraMsg WhatsApp dispatch channel for faculty authentication. Gateway operational.',
        status: 'IN_PROGRESS',
        adminReply: 'UltraMsg out-of-band mobile delivery route is active.',
      },
    ]);

    // Seed dummy school records
    this.school_records.insertOne({
      studentId: 'STU-DEMO-9041',
      studentEmail: 'student@test.local',
      fullName: 'Alex Rivera',
      gradeLevel: 'Senior Undergraduate',
      gpa: 3.88,
      attendanceRate: 97.4,
      major: 'B.S. Cybersecurity Defense',
      advisor: 'Prof. Marcus Vance',
    });

    // Seed dummy assignments
    this.assignments.insertMany([
      {
        title: 'Lab 01: Wireshark Packet Inspection & Auth Capture',
        courseCode: 'SEC-301',
        courseName: 'Network Security Fundamentals',
        instructor: 'Prof. Marcus Vance',
        dueDate: '2026-10-15',
        status: 'GRADED',
        grade: 'A',
        score: 98,
        maxScore: 100,
        description: 'Analyze cleartext HTTP credentials vs encrypted TLS sessions and examine payload exposure.',
      },
      {
        title: 'Lab 02: TOTP RFC 6238 Algorithm Simulation',
        courseCode: 'SEC-410',
        courseName: 'Modern Identity & Authentication',
        instructor: 'Prof. Marcus Vance',
        dueDate: '2026-10-22',
        status: 'SUBMITTED',
        maxScore: 100,
        description: 'Implement HMAC-SHA1 time-step truncation to generate 6-digit rolling authentication tokens.',
      },
      {
        title: 'Lab 03: Exploiting Broken Object Level Authorization (BOLA)',
        courseCode: 'SEC-450',
        courseName: 'Ethical Hacking & Penetration Testing',
        instructor: 'Dr. Evelyn Sterling',
        dueDate: '2026-11-05',
        status: 'PENDING',
        maxScore: 100,
        description: 'Demonstrate privilege escalation and API resource bypass when RBAC lacks backend verification.',
      },
      {
        title: 'Midterm Research: Password Spraying vs MFA Resistance',
        courseCode: 'SEC-410',
        courseName: 'Modern Identity & Authentication',
        instructor: 'Prof. Marcus Vance',
        dueDate: '2026-11-18',
        status: 'PENDING',
        maxScore: 150,
        description: 'Empirical comparison paper showing credential stuffing efficacy across single vs multi-factor realms.',
      }
    ]);

    // Seed exam results
    this.exam_results.insertMany([
      {
        studentEmail: 'student@test.local',
        courseCode: 'SEC-301',
        courseName: 'Network Security Fundamentals',
        examName: 'Midterm Practical Exam',
        date: '2026-03-12',
        score: 95,
        grade: 'A',
        status: 'PASSED',
        percentile: 94,
      },
      {
        studentEmail: 'student@test.local',
        courseCode: 'SEC-320',
        courseName: 'Applied Cryptography',
        examName: 'Final Exam - Public Key Infrastructure',
        date: '2026-05-20',
        score: 91,
        grade: 'A-',
        status: 'PASSED',
        percentile: 89,
      },
      {
        studentEmail: 'student@test.local',
        courseCode: 'SEC-410',
        courseName: 'Modern Identity & Authentication',
        examName: 'MFA Architecture Assessment',
        date: '2026-09-10',
        score: 97,
        grade: 'A+',
        status: 'PASSED',
        percentile: 98,
      }
    ]);

    // Seed Mandatory Identity Security Test Matrix T01-T12
    const initialMatrix: Array<Omit<TestMatrixDoc, '_id' | 'createdAt' | 'updatedAt'>> = [
      {
        testId: 'T01',
        title: 'Valid password-only login',
        role: 'STUDENT / TEACHER / ADMIN',
        testAction: 'Submit verified credentials in Password-Only mode.',
        expectedResult: 'System authorizes user immediately and issues valid session without requesting secondary factor.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Verifies baseline authentication functionality.'
      },
      {
        testId: 'T02',
        title: 'Compromised/test password in password-only mode',
        role: 'ATTACKER / UNTRUSTED',
        testAction: 'Submit incorrect or guessed credentials.',
        expectedResult: 'Access Denied; generic error message; failed attempt logged with IP.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Demonstrates baseline vulnerability: if password is compromised, attacker achieves complete access.'
      },
      {
        testId: 'T03',
        title: 'Correct password without required MFA',
        role: 'TEACHER / ADMIN',
        testAction: 'Provide valid password in Mode 2 or 3, but bypass or abort the OTP challenge.',
        expectedResult: 'Access withheld. No session token issued until all required MFA factors verify.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Demonstrates credential interception resistance.'
      },
      {
        testId: 'T04',
        title: 'Valid OTP verification',
        role: 'TEACHER / ADMIN',
        testAction: 'Submit valid 6-digit OTP code before expiration.',
        expectedResult: 'OTP successfully verified; session granted; authentication logged as MFA_SUCCESS.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Verifies secondary possession factor completion.'
      },
      {
        testId: 'T05',
        title: 'Invalid OTP rejection',
        role: 'ATTACKER',
        testAction: 'Submit random or mismatched 6-digit OTP code.',
        expectedResult: 'Access Denied: "Invalid OTP. Please try again." Attempt logged to security audit.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Demonstrates OTP brute-force resistance.'
      },
      {
        testId: 'T06',
        title: 'Expired OTP rejection',
        role: 'USER / EXPIRED TOKEN',
        testAction: 'Submit an OTP after TTL window has expired.',
        expectedResult: 'Access Denied: "This OTP has expired. Request a new OTP." Token invalidated.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Verifies time-bounded replay protection.'
      },
      {
        testId: 'T07',
        title: 'Repeated failed login attempts (Lockout)',
        role: 'BRUTE-FORCE ATTACKER',
        testAction: 'Submit 5 consecutive invalid authentication requests.',
        expectedResult: 'Account temporarily locked out; rate-limit message triggered; SECURITY_EVENT logged.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Verifies failed-login protection threshold.'
      },
      {
        testId: 'T08',
        title: 'Student attempting Teacher/Admin resource',
        role: 'STUDENT',
        testAction: 'Student authenticated session invokes /api/teacher/grades or /api/admin/users.',
        expectedResult: 'HTTP 403 Forbidden: "You are not authorized to access this resource." Role violation logged.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Verifies vertical RBAC boundary on server API.'
      },
      {
        testId: 'T09',
        title: 'Teacher attempting Admin resource',
        role: 'TEACHER',
        testAction: 'Teacher session invokes /api/admin/settings or /api/admin/reset.',
        expectedResult: 'HTTP 403 Forbidden with UNAUTHORIZED_ROLE code. Security event registered.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Verifies administrative boundary enforcement.'
      },
      {
        testId: 'T10',
        title: 'Logout followed by previous-session reuse',
        role: 'SESSION HIJACK TEST',
        testAction: 'Log in, obtain session token, invoke logout, then re-send request with revoked token.',
        expectedResult: 'HTTP 401 Unauthorized: "Your session has expired. Please log in again."',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Demonstrates server-side session invalidation.'
      },
      {
        testId: 'T11',
        title: 'Email step-up verification (Scenario 3)',
        role: 'ADMINISTRATOR / MODE 3',
        testAction: 'Complete Password + Mobile OTP, then verify independent Email OTP challenge.',
        expectedResult: 'Both factors required sequentially; audit trail logs both possession channels.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Verifies 3-factor multi-channel identity verification.'
      },
      {
        testId: 'T12',
        title: 'Account recovery / Admin unlock action',
        role: 'ADMINISTRATOR',
        testAction: 'Admin unblocks locked account from User Management console.',
        expectedResult: 'Account status restored to ACTIVE; failed attempt counter reset; action auditable in logs.',
        actualResult: 'Pending test execution',
        status: 'PENDING',
        evidence: 'N/A',
        testedAt: null,
        notes: 'Demonstrates operational incident response and admin authorization.'
      },
    ];
    this.test_matrix.insertMany(initialMatrix);

    // Seed baseline authentication comparison test runs
    const now = new Date();
    this.test_runs.insertMany([
      {
        runId: 'RUN-A-101',
        scenario: 'PASSWORD_ONLY',
        runNumber: 1,
        durationMs: 820,
        stepsCompleted: 1,
        totalSteps: 1,
        success: true,
        timestamp: new Date(now.getTime() - 3600000 * 3).toISOString(),
        details: 'Baseline Single-Factor Run 1: Direct credential verification.',
      },
      {
        runId: 'RUN-A-102',
        scenario: 'PASSWORD_ONLY',
        runNumber: 2,
        durationMs: 760,
        stepsCompleted: 1,
        totalSteps: 1,
        success: true,
        timestamp: new Date(now.getTime() - 3600000 * 2.8).toISOString(),
        details: 'Baseline Single-Factor Run 2: Low latency, single point of failure.',
      },
      {
        runId: 'RUN-A-103',
        scenario: 'PASSWORD_ONLY',
        runNumber: 3,
        durationMs: 890,
        stepsCompleted: 1,
        totalSteps: 1,
        success: true,
        timestamp: new Date(now.getTime() - 3600000 * 2.6).toISOString(),
        details: 'Baseline Single-Factor Run 3: Completed without secondary verification.',
      },
      {
        runId: 'RUN-B-201',
        scenario: 'PASSWORD_OTP',
        runNumber: 1,
        durationMs: 3450,
        stepsCompleted: 2,
        totalSteps: 2,
        success: true,
        timestamp: new Date(now.getTime() - 3600000 * 2.2).toISOString(),
        details: 'Two-Factor Run 1: Password verified + WhatsApp Mobile OTP confirmed.',
      },
      {
        runId: 'RUN-B-202',
        scenario: 'PASSWORD_OTP',
        runNumber: 2,
        durationMs: 3120,
        stepsCompleted: 2,
        totalSteps: 2,
        success: true,
        timestamp: new Date(now.getTime() - 3600000 * 2.0).toISOString(),
        details: 'Two-Factor Run 2: Out-of-band mobile verification via UltraMsg.',
      },
      {
        runId: 'RUN-B-203',
        scenario: 'PASSWORD_OTP',
        runNumber: 3,
        durationMs: 3780,
        stepsCompleted: 2,
        totalSteps: 2,
        success: true,
        timestamp: new Date(now.getTime() - 3600000 * 1.8).toISOString(),
        details: 'Two-Factor Run 3: Cryptographic OTP token validated.',
      },
      {
        runId: 'RUN-C-301',
        scenario: 'PASSWORD_OTP_EMAIL',
        runNumber: 1,
        durationMs: 6200,
        stepsCompleted: 3,
        totalSteps: 3,
        success: true,
        timestamp: new Date(now.getTime() - 3600000 * 1.4).toISOString(),
        details: 'Three-Factor Run 1: Password + WhatsApp OTP + Gmail Step-Up Verification completed.',
      },
      {
        runId: 'RUN-C-302',
        scenario: 'PASSWORD_OTP_EMAIL',
        runNumber: 2,
        durationMs: 5850,
        stepsCompleted: 3,
        totalSteps: 3,
        success: true,
        timestamp: new Date(now.getTime() - 3600000 * 1.2).toISOString(),
        details: 'Three-Factor Run 2: Maximum assurance high-security profile.',
      },
      {
        runId: 'RUN-C-303',
        scenario: 'PASSWORD_OTP_EMAIL',
        runNumber: 3,
        durationMs: 6420,
        stepsCompleted: 3,
        totalSteps: 3,
        success: true,
        timestamp: new Date(now.getTime() - 3600000 * 1.0).toISOString(),
        details: 'Three-Factor Run 3: Multi-channel verification completed.',
      },
    ]);

    // Seed initial security audit logs demonstrating system readiness
    this.authentication_logs.insertMany([
      {
        timestamp: new Date(now.getTime() - 3600000 * 4).toISOString(),
        userEmail: 'system@authshield360.local',
        role: 'ADMINISTRATOR',
        event: 'SYSTEM_BOOTSTRAP',
        factor: 'SYSTEM',
        action: 'INITIALIZE_SECURITY_SUBSYSTEM',
        result: 'SUCCESS',
        details: 'AuthShield 360 SOC kernel initialized. Initial Administrator Ayan (ayanaptechh@gmail.com) provisioned.',
        ipAddress: '127.0.0.1',
        userAgent: 'AuthShield360-Daemon/1.0',
      },
      {
        timestamp: new Date(now.getTime() - 3600000 * 3.5).toISOString(),
        userEmail: 'ayanaptechh@gmail.com',
        role: 'ADMINISTRATOR',
        event: 'CONFIG_CHANGE',
        factor: 'SYSTEM',
        action: 'SET_DEFAULT_AUTH_MODE',
        result: 'SUCCESS',
        details: 'Default authentication mode configured to PASSWORD_ONLY (Baseline scenario).',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    ]);
  }
}

// Global database singleton
export const db = new Database();
