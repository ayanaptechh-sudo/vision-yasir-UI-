import { Request, Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

export class LogsController {
  public static async getLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { role, factor, result, search, limit = 50, page = 1 } = req.query;

    let logs = await db.authentication_logs.find();

    // Sort descending by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (role && role !== 'ALL') {
      logs = logs.filter(l => l.role === role);
    }

    if (factor && factor !== 'ALL') {
      logs = logs.filter(l => l.factor === factor);
    }

    if (result && result !== 'ALL') {
      logs = logs.filter(l => l.result === result);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      logs = logs.filter(l =>
        l.userEmail.toLowerCase().includes(q) ||
        l.event.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.ipAddress.toLowerCase().includes(q)
      );
    }

    const totalCount = logs.length;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(5, Math.min(200, Number(limit)));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedLogs = logs.slice(startIndex, startIndex + limitNum);

    res.json({
      logs: paginatedLogs,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  }

  public static async getSecurityMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    const users = await db.users.find();
    const logs = await db.authentication_logs.find();
    const securityEvents = await db.security_events.find();

    const totalUsers = users.length;
    const studentsCount = users.filter(u => u.role === 'STUDENT').length;
    const teachersCount = users.filter(u => u.role === 'TEACHER').length;
    const adminsCount = users.filter(u => u.role === 'ADMINISTRATOR').length;

    const successfulLogins = logs.filter(l => l.event === 'LOGIN_SUCCESS').length;
    const failedLogins = logs.filter(l => l.event === 'FAILED_LOGIN' || l.event === 'INVALID_PASSWORD').length;
    const mfaSuccesses = logs.filter(l => l.event === 'OTP_SUCCESS' || (l.event === 'LOGIN_SUCCESS' && (l.factor === 'MOBILE_OTP' || l.factor === 'EMAIL_OTP'))).length;
    const mfaFailures = logs.filter(l => l.event === 'OTP_FAILED' || l.event === 'OTP_EXPIRED').length;
    const accountLockouts = logs.filter(l => l.event === 'ACCOUNT_LOCKED' || l.result === 'LOCKED').length;
    const unauthorizedAttempts = logs.filter(l => l.event === 'ROLE_VIOLATION' || l.result === 'UNAUTHORIZED').length;

    // Events by Role distribution
    const roleDistribution: Record<string, number> = {
      STUDENT: 0,
      TEACHER: 0,
      ADMINISTRATOR: 0,
      UNAUTHENTICATED: 0,
    };
    logs.forEach(l => {
      const r = l.role || 'UNAUTHENTICATED';
      roleDistribution[r] = (roleDistribution[r] || 0) + 1;
    });

    // Event Types breakdown
    const eventTypeDistribution: Record<string, number> = {};
    logs.forEach(l => {
      eventTypeDistribution[l.event] = (eventTypeDistribution[l.event] || 0) + 1;
    });

    // Recent 10 events
    const recentLogs = [...logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    res.json({
      metrics: {
        totalUsers,
        studentsCount,
        teachersCount,
        adminsCount,
        successfulLogins,
        failedLogins,
        mfaSuccesses,
        mfaFailures,
        accountLockouts,
        unauthorizedAttempts,
      },
      roleDistribution,
      eventTypeDistribution,
      recentEvents: recentLogs,
      securityEvents: securityEvents.slice(-10).reverse(),
    });
  }

  public static async exportLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { format = 'json' } = req.query;
    let logs = await db.authentication_logs.find();
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (format === 'csv') {
      const headers = ['Timestamp', 'User Email', 'Role', 'Event', 'Factor', 'Action', 'Result', 'IP Address', 'Details'];
      const rows = logs.map(l => [
        `"${l.timestamp}"`,
        `"${l.userEmail}"`,
        `"${l.role}"`,
        `"${l.event}"`,
        `"${l.factor}"`,
        `"${l.action}"`,
        `"${l.result}"`,
        `"${l.ipAddress}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="authshield360_security_logs.csv"');
      res.send(csvContent);
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="authshield360_security_logs.json"');
    res.json(logs);
  }
}
