import {
  AuthMode,
  User,
  SessionInfo,
  SessionItem,
  SystemSettings,
  AuthLog,
  SecurityMetrics,
  SecurityAlert,
  SupportTicket,
  SystemReport,
  TestMatrixItem,
  BenchmarkScenario,
  TestDispatch,
  StudentRecord,
  Assignment,
  ExamResult,
  Role,
} from '../types/auth';

const TOKEN_KEY = 'authshield_session_token';

export class ApiClient {
  public static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public static clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-session-token'] = token;
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({ error: 'Failed to parse server response' }));

    if (!res.ok) {
      const errorMsg = data.error || `HTTP ${res.status}: Request failed`;
      const error = new Error(errorMsg) as Error & { code?: string; status?: number; data?: any };
      error.code = data.code;
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data as T;
  }

  // --- Auth Endpoints ---
  public static async getSettings(): Promise<SystemSettings> {
    return this.request<SystemSettings>('/auth/settings');
  }

  public static async setAuthMode(mode: AuthMode): Promise<{ success: boolean; activeAuthMode: AuthMode }> {
    return this.request('/auth/mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  }

  public static async loginStep1(email: string, password: string): Promise<any> {
    return this.request('/auth/login-step-1', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  public static async verifyMobileOtp(email: string, code: string): Promise<any> {
    return this.request('/auth/verify-mobile-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  public static async verifyEmailOtp(email: string, code: string): Promise<any> {
    return this.request('/auth/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  public static async resendOtp(email: string, type: 'MOBILE' | 'EMAIL'): Promise<any> {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, type }),
    });
  }

  public static async expireOtpForTest(email: string, type?: 'MOBILE' | 'EMAIL'): Promise<any> {
    return this.request('/auth/expire-otp-test', {
      method: 'POST',
      body: JSON.stringify({ email, type }),
    });
  }

  public static async getTestDispatches(): Promise<{ dispatches: TestDispatch[] }> {
    return this.request('/auth/test-dispatches');
  }

  public static async getCurrentUser(): Promise<{ user: User; session: SessionInfo }> {
    return this.request('/auth/me');
  }

  public static async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  public static async requestPasswordReset(email: string): Promise<any> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public static async completePasswordReset(email: string, otpCode: string, newPassword: string): Promise<any> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode, newPassword }),
    });
  }

  public static async submitSupportTicket(data: {
    email: string;
    name?: string;
    category: string;
    subject: string;
    message: string;
  }): Promise<any> {
    return this.request('/support/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Admin Endpoints ---
  public static async listUsers(): Promise<{ users: User[] }> {
    return this.request('/admin/users');
  }

  public static async createUser(data: {
    name: string;
    email: string;
    role: Role;
    password: string;
    phoneNumber?: string;
    department?: string;
    studentId?: string;
    teacherId?: string;
  }): Promise<any> {
    return this.request('/admin/user/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateUser(data: {
    userId: string;
    name?: string;
    phoneNumber?: string;
    department?: string;
    studentId?: string;
    teacherId?: string;
    role?: Role;
  }): Promise<any> {
    return this.request('/admin/user/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async adminResetPassword(userId: string, newPassword: string): Promise<any> {
    return this.request('/admin/user/password-reset', {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword }),
    });
  }

  public static async suspendUser(userId: string, reason: string, duration?: string): Promise<any> {
    return this.request('/admin/user/suspend', {
      method: 'POST',
      body: JSON.stringify({ userId, reason, duration }),
    });
  }

  public static async banUser(userId: string, reason: string): Promise<any> {
    return this.request('/admin/user/ban', {
      method: 'POST',
      body: JSON.stringify({ userId, reason }),
    });
  }

  public static async unbanUser(userId: string): Promise<any> {
    return this.request('/admin/user/unban', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  public static async deleteUser(userId: string): Promise<any> {
    return this.request('/admin/user/delete', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  public static async updateUserRole(userId: string, newRole: string): Promise<any> {
    return this.request('/admin/user/role', {
      method: 'POST',
      body: JSON.stringify({ userId, newRole }),
    });
  }

  public static async toggleUserStatus(userId: string, status: string): Promise<any> {
    return this.request('/admin/user/status', {
      method: 'POST',
      body: JSON.stringify({ userId, status }),
    });
  }

  public static async unlockUser(userId: string): Promise<any> {
    return this.request('/admin/user/unlock', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // --- Active Sessions Management (Section 16) ---
  public static async listSessions(): Promise<{ sessions: SessionItem[] }> {
    return this.request('/admin/sessions');
  }

  public static async revokeSession(sessionId: string): Promise<any> {
    return this.request('/admin/session/revoke', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  // --- Support Tickets (Section 18) ---
  public static async listSupportTickets(): Promise<{ tickets: SupportTicket[] }> {
    return this.request('/admin/tickets');
  }

  public static async updateTicketStatus(ticketId: string, status: string, adminReply?: string): Promise<any> {
    return this.request('/admin/ticket/status', {
      method: 'POST',
      body: JSON.stringify({ ticketId, status, adminReply }),
    });
  }

  // --- Security Alerts & System Reports (Section 26 & 42) ---
  public static async listAlerts(): Promise<{ alerts: SecurityAlert[] }> {
    return this.request('/admin/alerts');
  }

  public static async acknowledgeAlert(alertId: string): Promise<any> {
    return this.request('/admin/alert/ack', {
      method: 'POST',
      body: JSON.stringify({ alertId }),
    });
  }

  public static async getSystemReport(): Promise<{ report: SystemReport }> {
    return this.request('/admin/report');
  }

  public static async updateSystemConfig(config: Partial<SystemSettings>): Promise<any> {
    return this.request('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  public static async resetDemonstration(): Promise<any> {
    return this.request('/admin/reset-demo', {
      method: 'POST',
      body: JSON.stringify({ confirmed: true }),
    });
  }

  // --- Logs & SOC ---
  public static async getLogs(params: {
    role?: string;
    factor?: string;
    result?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuthLog[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.factor) query.append('factor', params.factor);
    if (params.result) query.append('result', params.result);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    return this.request(`/logs?${query.toString()}`);
  }

  public static async getSecurityMetrics(): Promise<{
    metrics: SecurityMetrics;
    roleDistribution: Record<string, number>;
    eventTypeDistribution: Record<string, number>;
    recentEvents: AuthLog[];
    securityEvents: any[];
  }> {
    return this.request('/logs/metrics');
  }

  public static getExportLogsUrl(format: 'json' | 'csv'): string {
    const token = this.getToken();
    return `/api/logs/export?format=${format}&token=${token || ''}`;
  }

  // --- Test Matrix ---
  public static async getTestMatrix(): Promise<{ matrix: TestMatrixItem[] }> {
    return this.request('/matrix');
  }

  public static async runSingleTest(testId: string): Promise<any> {
    return this.request(`/matrix/run/${testId}`, { method: 'POST' });
  }

  public static async runAllTests(): Promise<{ results: any[]; matrix: TestMatrixItem[] }> {
    return this.request('/matrix/run-all', { method: 'POST' });
  }

  public static async updateManualTest(data: {
    testId: string;
    actualResult?: string;
    status?: string;
    notes?: string;
    evidence?: string;
  }): Promise<any> {
    return this.request('/matrix/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Comparison Engine ---
  public static async getComparison(): Promise<{ scenarios: BenchmarkScenario[]; totalBenchmarkRuns: number }> {
    return this.request('/comparison');
  }

  public static async runBenchmark(scenario: string = 'ALL'): Promise<any> {
    return this.request('/comparison/benchmark', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    });
  }

  // --- Academic Portal ---
  public static async getStudentPortal(studentEmail?: string): Promise<{
    studentRecord: StudentRecord;
    assignments: Assignment[];
    examResults: ExamResult[];
  }> {
    const q = studentEmail ? `?studentEmail=${encodeURIComponent(studentEmail)}` : '';
    return this.request(`/portal/student${q}`);
  }

  public static async submitAssignment(assignmentId: string): Promise<any> {
    return this.request('/portal/student/submit-assignment', {
      method: 'POST',
      body: JSON.stringify({ assignmentId }),
    });
  }

  public static async getTeacherPortal(): Promise<{
    teacherInfo: any;
    students: StudentRecord[];
    assignments: Assignment[];
    examResults: ExamResult[];
  }> {
    return this.request('/portal/teacher');
  }

  public static async updateGrade(assignmentId: string, score: number, grade: string): Promise<any> {
    return this.request('/portal/teacher/grade', {
      method: 'POST',
      body: JSON.stringify({ assignmentId, score, grade }),
    });
  }

  public static async testAdminProbe(): Promise<any> {
    return this.request('/portal/admin/privileged-probe');
  }

  // Custom Raw Probe for Security Testing Lab
  public static async sendCustomProbe(endpoint: string, method: string = 'GET', customHeaders: Record<string, string> = {}, body?: any): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    durationMs: number;
  }> {
    const startTime = performance.now();
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token && !customHeaders['Authorization'] && customHeaders['Authorization'] !== '') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const durationMs = Math.round(performance.now() - startTime);
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });

      const data = await res.json().catch(() => ({ rawText: 'Non-JSON response' }));

      return {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        data,
        durationMs,
      };
    } catch (err: any) {
      return {
        status: 0,
        statusText: 'Network Failure / Connection Refused',
        headers: {},
        data: { error: err.message },
        durationMs: Math.round(performance.now() - startTime),
      };
    }
  }
}
