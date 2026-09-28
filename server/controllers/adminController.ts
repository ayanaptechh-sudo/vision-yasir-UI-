import { Request, Response } from 'express';
import { db, hashPassword, UserRole, UserStatus } from '../database/db';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../middleware/auth';

export class AdminController {
  public static async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const users = await db.users.find();
    const sanitized = users.map(u => ({
      id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      statusReason: u.statusReason,
      suspensionDuration: u.suspensionDuration,
      suspendedUntil: u.suspendedUntil,
      bannedAt: u.bannedAt,
      actionByAdmin: u.actionByAdmin,
      failedLoginAttempts: u.failedLoginAttempts,
      lockoutUntil: u.lockoutUntil,
      mfaEnabled: u.mfaEnabled,
      twoFactorEnabled: !!u.twoFactorEnabled,
      phoneNumber: u.phoneNumber,
      phoneNumberMasked: u.phoneNumberMasked,
      lastLogin: u.lastLogin,
      lastActivity: u.lastActivity,
      studentId: u.studentId,
      teacherId: u.teacherId,
      department: u.department,
      isTestAccount: u.isTestAccount,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    res.json({ users: sanitized });
  }

  public static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, email, role, password, phoneNumber, department, studentId, teacherId } = req.body;

    if (!name || !email || !role || !password) {
      res.status(400).json({ error: 'Name, email, role, and initial password are required.' });
      return;
    }

    if (!['STUDENT', 'TEACHER', 'ADMINISTRATOR'].includes(role)) {
      res.status(400).json({ error: 'Role must be STUDENT, TEACHER, or ADMINISTRATOR.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.users.findOne({ email: cleanEmail });
    if (existing) {
      res.status(409).json({ error: 'A user with this email address already exists.' });
      return;
    }

    const passHash = hashPassword(password);
    const phone = phoneNumber?.trim() || '+15550000000';
    const phoneMasked = phone.replace(/(\+\d{1,3}\s?\d{3})(\d+)(\d{4})/, '$1 ••• $3');

    const newUser = await db.users.insertOne({
      email: cleanEmail,
      name: name.trim(),
      role: role as UserRole,
      passwordHash: passHash.hash,
      passwordSalt: passHash.salt,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      mfaEnabled: role !== 'STUDENT',
      phoneNumber: phone,
      phoneNumberMasked: phoneMasked,
      department: department?.trim(),
      studentId: studentId?.trim(),
      teacherId: teacherId?.trim(),
      isTestAccount: false,
    });

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'USER_CREATED',
      factor: 'SESSION',
      action: 'ADMIN_CREATE_USER',
      result: 'SUCCESS',
      details: `Created new ${role} account for ${cleanEmail} (${name}).`,
      sessionId: req.session?.token,
    });

    res.status(201).json({
      success: true,
      message: `Successfully provisioned ${role} account for ${cleanEmail}.`,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  }

  public static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId, name, phoneNumber, department, studentId, teacherId, role } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required.' });
      return;
    }

    const user = await db.users.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const updateObj: any = {};
    if (name) updateObj.name = name.trim();
    if (department) updateObj.department = department.trim();
    if (studentId !== undefined) updateObj.studentId = studentId.trim();
    if (teacherId !== undefined) updateObj.teacherId = teacherId.trim();
    if (role && ['STUDENT', 'TEACHER', 'ADMINISTRATOR'].includes(role)) {
      updateObj.role = role;
    }
    if (phoneNumber) {
      updateObj.phoneNumber = phoneNumber.trim();
      updateObj.phoneNumberMasked = phoneNumber.replace(/(\+\d{1,3}\s?\d{3})(\d+)(\d{4})/, '$1 ••• $3');
    }

    await db.users.updateOne({ _id: userId }, { $set: updateObj });

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'USER_UPDATED',
      factor: 'SESSION',
      action: 'ADMIN_UPDATE_USER',
      result: 'SUCCESS',
      details: `Updated profile details for user ${user.email}.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Profile updated for ${user.email}.` });
  }

  public static async adminResetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'User ID and a new password with at least 8 characters are required.' });
      return;
    }

    const user = await db.users.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const passHash = hashPassword(newPassword);
    await db.users.updateOne(
      { _id: userId },
      {
        $set: {
          passwordHash: passHash.hash,
          passwordSalt: passHash.salt,
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      }
    );

    // Invalidate active sessions
    const sessions = await db.sessions.find({ userId, isValid: true });
    for (const s of sessions) {
      await db.sessions.updateOne({ _id: s._id }, { $set: { isValid: false, revokedAt: new Date().toISOString(), revokedBy: 'ADMIN_PW_RESET' } });
    }

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'PASSWORD_CHANGED',
      factor: 'SESSION',
      action: 'ADMIN_RESET_PASSWORD',
      result: 'SUCCESS',
      details: `Administrator performed credential reset for account ${user.email}. All active sessions invalidated.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Password successfully reset for ${user.email}.` });
  }

  public static async suspendUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId, reason, duration } = req.body;
    if (!userId || !reason) {
      res.status(400).json({ error: 'User ID and suspension reason are required.' });
      return;
    }

    const user = await db.users.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.role === 'ADMINISTRATOR' && user.email === 'ayanaptechh@gmail.com') {
      res.status(403).json({ error: 'The Primary Initial Administrator account cannot be suspended.' });
      return;
    }

    const nowIso = new Date().toISOString();
    await db.users.updateOne(
      { _id: userId },
      {
        $set: {
          status: 'SUSPENDED',
          statusReason: reason.trim(),
          suspensionDuration: duration || 'Indefinite',
          actionByAdmin: req.user?.email || 'ayanaptechh@gmail.com',
          updatedAt: nowIso,
        },
      }
    );

    // Invalidate all active sessions immediately
    const userSessions = await db.sessions.find({ userId, isValid: true });
    for (const s of userSessions) {
      await db.sessions.updateOne({ _id: s._id }, { $set: { isValid: false, revokedAt: nowIso, revokedBy: 'ACCOUNT_SUSPENDED' } });
    }

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'USER_SUSPENDED',
      factor: 'SESSION',
      action: 'SUSPEND_ACCOUNT',
      result: 'SUCCESS',
      details: `User ${user.email} suspended (${duration || 'Indefinite'}). Reason: "${reason}". Active sessions terminated.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Account for ${user.email} has been suspended.` });
  }

  public static async banUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId, reason } = req.body;
    if (!userId || !reason) {
      res.status(400).json({ error: 'User ID and ban reason are required.' });
      return;
    }

    const user = await db.users.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.role === 'ADMINISTRATOR' && user.email === 'ayanaptechh@gmail.com') {
      res.status(403).json({ error: 'The Primary Initial Administrator account cannot be banned.' });
      return;
    }

    const nowIso = new Date().toISOString();
    await db.users.updateOne(
      { _id: userId },
      {
        $set: {
          status: 'BANNED',
          statusReason: reason.trim(),
          bannedAt: nowIso,
          actionByAdmin: req.user?.email || 'ayanaptechh@gmail.com',
          updatedAt: nowIso,
        },
      }
    );

    // Invalidate active sessions
    const userSessions = await db.sessions.find({ userId, isValid: true });
    for (const s of userSessions) {
      await db.sessions.updateOne({ _id: s._id }, { $set: { isValid: false, revokedAt: nowIso, revokedBy: 'ACCOUNT_BANNED' } });
    }

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'USER_BANNED',
      factor: 'SESSION',
      action: 'BAN_ACCOUNT',
      result: 'SUCCESS',
      details: `User ${user.email} banned. Reason: "${reason}". Active sessions terminated.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Account for ${user.email} has been permanently banned.` });
  }

  public static async unbanUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.body;
    const user = await db.users.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    await db.users.updateOne(
      { _id: userId },
      {
        $set: {
          status: 'ACTIVE',
          statusReason: undefined,
          suspensionDuration: undefined,
          suspendedUntil: null,
          bannedAt: null,
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      }
    );

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'USER_UNBANNED',
      factor: 'SESSION',
      action: 'RESTORE_ACCOUNT_STATUS',
      result: 'SUCCESS',
      details: `Restrictions removed for account ${user.email}. Status restored to ACTIVE.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Account ${user.email} has been unbanned/restored to ACTIVE.` });
  }

  public static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.body;
    const user = await db.users.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.role === 'ADMINISTRATOR' && user.email === 'ayanaptechh@gmail.com') {
      res.status(403).json({ error: 'Cannot delete the Primary Initial Administrator account.' });
      return;
    }

    await db.users.deleteOne({ _id: userId });
    await db.sessions.deleteMany({ userId });

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'USER_DELETED',
      factor: 'SESSION',
      action: 'ADMIN_DELETE_USER',
      result: 'SUCCESS',
      details: `Account for ${user.email} (${user.role}) was deleted by administrator.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Account ${user.email} has been permanently deleted.` });
  }

  public static async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId, newRole } = req.body;
    if (!userId || !['STUDENT', 'TEACHER', 'ADMINISTRATOR'].includes(newRole)) {
      res.status(400).json({ error: 'Valid userId and newRole are required.' });
      return;
    }

    const user = await db.users.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const oldRole = user.role;
    await db.users.updateOne({ _id: userId }, { $set: { role: newRole } });

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'ROLE_CHANGED',
      factor: 'SESSION',
      action: 'UPDATE_USER_ROLE',
      result: 'SUCCESS',
      details: `Changed role for user ${user.email} from ${oldRole} to ${newRole}.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Role updated to ${newRole}.` });
  }

  public static async toggleUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId, status } = req.body;
    if (!userId || !['ACTIVE', 'LOCKED', 'DISABLED'].includes(status)) {
      res.status(400).json({ error: 'Valid userId and status (ACTIVE, LOCKED, DISABLED) required.' });
      return;
    }

    const user = await db.users.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    await db.users.updateOne(
      { _id: userId },
      {
        $set: {
          status,
          failedLoginAttempts: status === 'ACTIVE' ? 0 : user.failedLoginAttempts,
          lockoutUntil: status === 'ACTIVE' ? null : user.lockoutUntil,
        },
      }
    );

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'USER_MANAGEMENT',
      factor: 'SESSION',
      action: 'SET_ACCOUNT_STATUS',
      result: 'SUCCESS',
      details: `Account status for ${user.email} changed to ${status}.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Account status set to ${status}.` });
  }

  public static async unlockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.body;
    const user = await db.users.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    await db.users.updateOne(
      { _id: userId },
      { $set: { status: 'ACTIVE', failedLoginAttempts: 0, lockoutUntil: null } }
    );

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'ACCOUNT_UNLOCKED',
      factor: 'SESSION',
      action: 'ADMIN_UNLOCK_ACCOUNT',
      result: 'SUCCESS',
      details: `Administrator manually unlocked account ${user.email} and reset failed counters.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Account for ${user.email} has been successfully unlocked.` });
  }

  public static async adminReset2fa(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required.' });
      return;
    }

    const user = await db.users.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.role === 'STUDENT') {
      res.status(400).json({ error: 'Students do not participate in 2FA.' });
      return;
    }

    await db.users.updateOne(
      { _id: userId },
      {
        $set: {
          twoFactorEnabled: false,
          totpSecretEncrypted: null,
          totpTempSecretEncrypted: null,
          lastVerifiedTotpStep: null,
          failedTotpAttempts: 0,
          totpLockoutUntil: null,
        },
      }
    );

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: '2FA_RESET',
      factor: 'SYSTEM',
      action: 'ADMIN_RESET_USER_2FA',
      result: 'SUCCESS',
      details: `Administrator reset Google Authenticator 2FA for ${user.email} (${user.role}). Secret invalidated; user must re-enroll.`,
      sessionId: req.session?.token,
    });

    res.json({
      success: true,
      message: `Google Authenticator 2FA has been successfully reset for ${user.email}.`,
    });
  }

  // --- Session Management (Section 16) ---
  public static async listActiveSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sessions = await db.sessions.find();
    const sorted = sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const sanitized = sorted.map(s => ({
      id: s._id,
      tokenMasked: `${s.token.substring(0, 8)}••••••••${s.token.substring(s.token.length - 6)}`,
      email: s.email,
      role: s.role,
      isValid: s.isValid,
      authMode: s.authMode,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity || s.createdAt,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt,
      revokedBy: s.revokedBy,
      isExpired: new Date() > new Date(s.expiresAt),
    }));

    res.json({ sessions: sanitized });
  }

  public static async revokeSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required.' });
      return;
    }

    const session = await db.sessions.findOne({ _id: sessionId });
    if (!session) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    await db.sessions.updateOne(
      { _id: sessionId },
      { $set: { isValid: false, revokedAt: new Date().toISOString(), revokedBy: req.user?.email || 'ADMIN' } }
    );

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'SESSION_REVOKED',
      factor: 'SESSION',
      action: 'ADMIN_REVOKE_SESSION',
      result: 'SUCCESS',
      details: `Administrator revoked active session token for ${session.email} (IP: ${session.ipAddress}).`,
      sessionId: session.token,
    });

    res.json({ success: true, message: `Session for ${session.email} has been revoked.` });
  }

  // --- Support Tickets (Section 18) ---
  public static async listSupportTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    const tickets = await db.support_tickets.find();
    const sorted = tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ tickets: sorted });
  }

  public static async updateTicketStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { ticketId, status, adminReply } = req.body;
    if (!ticketId || !['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      res.status(400).json({ error: 'Valid ticket ID and status (PENDING, IN_PROGRESS, COMPLETED) required.' });
      return;
    }

    const ticket = await db.support_tickets.findOne({ _id: ticketId });
    if (!ticket) {
      res.status(404).json({ error: 'Support ticket not found.' });
      return;
    }

    const updateObj: any = { status };
    if (adminReply) updateObj.adminReply = adminReply;
    if (status === 'COMPLETED') updateObj.resolvedAt = new Date().toISOString();

    await db.support_tickets.updateOne({ _id: ticketId }, { $set: updateObj });

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'ADMIN_ACTION',
      factor: 'SESSION',
      action: 'UPDATE_SUPPORT_TICKET',
      result: 'SUCCESS',
      details: `Updated support ticket ${ticket.ticketNumber} status to ${status}.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Ticket ${ticket.ticketNumber} updated.` });
  }

  // --- Security Alerts (Section 26) ---
  public static async listSecurityAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const alerts = await db.security_alerts.find();
    const sorted = alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ alerts: sorted });
  }

  public static async acknowledgeAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { alertId } = req.body;
    if (!alertId) {
      res.status(400).json({ error: 'Alert ID is required.' });
      return;
    }

    await db.security_alerts.updateOne({ _id: alertId }, { $set: { acknowledged: true } });
    res.json({ success: true, message: 'Security alert marked acknowledged.' });
  }

  // --- Comprehensive System Report (Section 42) ---
  public static async getSystemReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    const users = await db.users.find();
    const sessions = await db.sessions.find();
    const logs = await db.authentication_logs.find();
    const matrix = await db.test_matrix.find();
    const runs = await db.test_runs.find();
    const tickets = await db.support_tickets.find();
    const alerts = await db.security_alerts.find();

    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.email || 'ayanaptechh@gmail.com',
      systemStatus: 'OPERATIONAL',
      users: {
        total: users.length,
        students: users.filter(u => u.role === 'STUDENT').length,
        teachers: users.filter(u => u.role === 'TEACHER').length,
        administrators: users.filter(u => u.role === 'ADMINISTRATOR').length,
        active: users.filter(u => u.status === 'ACTIVE').length,
        locked: users.filter(u => u.status === 'LOCKED').length,
        suspended: users.filter(u => u.status === 'SUSPENDED').length,
        banned: users.filter(u => u.status === 'BANNED').length,
        disabled: users.filter(u => u.status === 'DISABLED').length,
      },
      sessions: {
        totalIssued: sessions.length,
        active: sessions.filter(s => s.isValid && new Date() < new Date(s.expiresAt)).length,
        revoked: sessions.filter(s => !s.isValid).length,
      },
      authenticationAudit: {
        totalEvents: logs.length,
        successfulLogins: logs.filter(l => l.event === 'LOGIN_SUCCESS').length,
        failedLogins: logs.filter(l => l.event === 'FAILED_LOGIN' || l.event === 'INVALID_PASSWORD').length,
        otpFailures: logs.filter(l => l.event === 'OTP_FAILED' || l.event === 'OTP_EXPIRED').length,
        rbacViolations: logs.filter(l => l.result === 'UNAUTHORIZED').length,
        accountLockouts: logs.filter(l => l.event === 'ACCOUNT_LOCKED').length,
      },
      testMatrix: {
        totalTests: matrix.length,
        passed: matrix.filter(t => t.status === 'PASS').length,
        failed: matrix.filter(t => t.status === 'FAIL').length,
        pending: matrix.filter(t => t.status === 'PENDING').length,
      },
      supportTickets: {
        total: tickets.length,
        pending: tickets.filter(t => t.status === 'PENDING').length,
        inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        completed: tickets.filter(t => t.status === 'COMPLETED').length,
      },
      securityAlerts: {
        total: alerts.length,
        unacknowledged: alerts.filter(a => !a.acknowledged).length,
        critical: alerts.filter(a => a.severity === 'CRITICAL').length,
        high: alerts.filter(a => a.severity === 'HIGH').length,
      },
    };

    res.json({ report });
  }

  public static async updateSystemConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { maxFailedAttempts, lockoutDurationMinutes, otpExpirySeconds, emailOtpExpirySeconds, sessionTimeoutMinutes } = req.body;

    const updateObj: any = {};
    if (typeof maxFailedAttempts === 'number') updateObj.maxFailedAttempts = Math.max(1, maxFailedAttempts);
    if (typeof lockoutDurationMinutes === 'number') updateObj.lockoutDurationMinutes = Math.max(1, lockoutDurationMinutes);
    if (typeof otpExpirySeconds === 'number') updateObj.otpExpirySeconds = Math.max(10, otpExpirySeconds);
    if (typeof emailOtpExpirySeconds === 'number') updateObj.emailOtpExpirySeconds = Math.max(10, emailOtpExpirySeconds);
    if (typeof sessionTimeoutMinutes === 'number') updateObj.sessionTimeoutMinutes = Math.max(1, sessionTimeoutMinutes);

    await db.system_settings.updateOne({ key: 'GLOBAL_SETTINGS' }, { $set: updateObj });

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'CONFIG_CHANGE',
      factor: 'SESSION',
      action: 'UPDATE_SECURITY_POLICIES',
      result: 'SUCCESS',
      details: `Security configuration updated: ${JSON.stringify(updateObj)}`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: 'Security policies updated successfully.' });
  }

  public static async resetDemonstration(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { confirmed } = req.body;
    if (!confirmed) {
      res.status(400).json({ error: 'Explicit confirmation required to reset demonstration environment.' });
      return;
    }

    db.seedDefaultData(true);

    await AuditService.logAuthEvent({
      userEmail: req.user?.email || 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'DEMO_RESET',
      factor: 'SESSION',
      action: 'RESET_ENVIRONMENT',
      result: 'SUCCESS',
      details: 'Evaluator initialized a full reset of the demonstration environment, test matrix, and sample accounts.',
      sessionId: req.session?.token,
    });

    res.json({
      success: true,
      message: 'Demonstration environment has been successfully restored to factory test state.',
    });
  }
}
