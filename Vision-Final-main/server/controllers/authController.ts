import { Request, Response } from 'express';
import crypto from 'crypto';
import { db, verifyPassword, hashPassword } from '../database/db';
import { OtpService } from '../services/otpService';
import { AuditService } from '../services/auditService';
import { UltraMsgService } from '../services/ultraMsgService';
import { EmailService } from '../services/emailService';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  public static async getSystemSettings(req: Request, res: Response): Promise<void> {
    const settings = await db.system_settings.findOne({ key: 'GLOBAL_SETTINGS' });
    res.json({
      activeAuthMode: settings?.activeAuthMode || 'PASSWORD_ONLY',
      maxFailedAttempts: settings?.maxFailedAttempts || 5,
      lockoutDurationMinutes: settings?.lockoutDurationMinutes || 5,
      otpExpirySeconds: settings?.otpExpirySeconds || 300,
      emailOtpExpirySeconds: settings?.emailOtpExpirySeconds || 300,
      sessionTimeoutMinutes: settings?.sessionTimeoutMinutes || 30,
      gateways: {
        ultraMsg: UltraMsgService.getSafeStatus(),
        email: EmailService.getSafeStatus(),
      },
    });
  }

  public static async setAuthMode(req: Request, res: Response): Promise<void> {
    const { mode } = req.body;
    if (!['PASSWORD_ONLY', 'PASSWORD_OTP', 'PASSWORD_OTP_EMAIL'].includes(mode)) {
      res.status(400).json({ error: 'Invalid authentication mode requested.' });
      return;
    }

    await db.system_settings.updateOne(
      { key: 'GLOBAL_SETTINGS' },
      { $set: { activeAuthMode: mode } }
    );

    await AuditService.logAuthEvent({
      userEmail: 'ayanaptechh@gmail.com',
      role: 'ADMINISTRATOR',
      event: 'AUTH_MODE_CHANGED',
      factor: 'SYSTEM',
      action: 'UPDATE_SYSTEM_AUTH_MODE',
      result: 'SUCCESS',
      details: `Authentication policy mode updated to: ${mode}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, activeAuthMode: mode });
  }

  public static async loginStep1(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';

    if (!email || !password) {
      res.status(400).json({ error: 'Username/Email and Password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.users.findOne({ email: cleanEmail });
    const settings = await db.system_settings.findOne({ key: 'GLOBAL_SETTINGS' });
    const activeMode = settings?.activeAuthMode || 'PASSWORD_ONLY';
    const maxAttempts = settings?.maxFailedAttempts || 5;
    const lockoutMinutes = settings?.lockoutDurationMinutes || 5;

    // Check account status if user exists
    if (user) {
      // 1. Account Locked due to repeated failed attempts
      if (user.status === 'LOCKED') {
        const now = new Date();
        if (user.lockoutUntil && now < new Date(user.lockoutUntil)) {
          const remainingMinutes = Math.ceil((new Date(user.lockoutUntil).getTime() - now.getTime()) / 60000);
          await AuditService.logAuthEvent({
            userEmail: user.email,
            role: user.role,
            event: 'LOGIN_BLOCKED_LOCKOUT',
            factor: 'PASSWORD',
            action: 'ATTEMPT_LOCKED_ACCOUNT',
            result: 'LOCKED',
            details: `Rejected login attempt on locked account. Lockout active for another ${remainingMinutes} minute(s).`,
            ipAddress,
            userAgent,
          });

          res.status(423).json({
            error: `Your account has been temporarily locked due to exceeding ${maxAttempts} failed login attempts.`,
            code: 'ACCOUNT_LOCKED',
            lockoutRemainingMinutes: remainingMinutes,
          });
          return;
        } else {
          // Lockout window expired - auto unlock
          await db.users.updateOne(
            { _id: user._id },
            { $set: { status: 'ACTIVE', failedLoginAttempts: 0, lockoutUntil: null } }
          );
          user.status = 'ACTIVE';
          user.failedLoginAttempts = 0;
        }
      }

      // 2. Account Suspended or Banned (Section 17 requirement)
      if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
        await AuditService.logAuthEvent({
          userEmail: user.email,
          role: user.role,
          event: 'LOGIN_BLOCKED_RESTRICTION',
          factor: 'PASSWORD',
          action: `ATTEMPT_${user.status}_ACCOUNT`,
          result: 'UNAUTHORIZED',
          details: `Rejected login attempt on ${user.status} account. Reason: ${user.statusReason || 'Policy violation'}.`,
          ipAddress,
          userAgent,
        });

        res.status(403).json({
          error: `Your account has been ${user.status.toLowerCase()}. Access is strictly restricted.`,
          code: user.status === 'BANNED' ? 'ACCOUNT_BANNED' : 'ACCOUNT_SUSPENDED',
          status: user.status,
          reason: user.statusReason || 'Administrative suspension enforced by security compliance policy.',
          duration: user.suspensionDuration,
          supportAvailable: true,
        });
        return;
      }

      // 3. Account Disabled
      if (user.status === 'DISABLED') {
        await AuditService.logAuthEvent({
          userEmail: user.email,
          role: user.role,
          event: 'FAILED_LOGIN',
          factor: 'PASSWORD',
          action: 'ATTEMPT_DISABLED_ACCOUNT',
          result: 'FAILED',
          details: 'Account is disabled by administrator.',
          ipAddress,
          userAgent,
        });

        res.status(403).json({
          error: 'Your account is disabled. Please contact your administrator for assistance.',
          code: 'ACCOUNT_DISABLED',
        });
        return;
      }
    }

    // Generic error message to prevent account enumeration if user does not exist
    if (!user) {
      await AuditService.logAuthEvent({
        userEmail: cleanEmail,
        event: 'FAILED_LOGIN',
        factor: 'PASSWORD',
        action: 'VERIFY_CREDENTIALS',
        result: 'FAILED',
        details: 'Invalid login attempt for non-existent or unverified account.',
        ipAddress,
        userAgent,
      });

      res.status(401).json({
        error: 'Invalid username or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Verify Password using Scrypt
    const isPasswordValid = verifyPassword(password, user.passwordHash, user.passwordSalt);

    if (!isPasswordValid) {
      const newFailedCount = (user.failedLoginAttempts || 0) + 1;

      if (newFailedCount >= maxAttempts) {
        const lockoutUntilTime = new Date(Date.now() + lockoutMinutes * 60000).toISOString();
        await db.users.updateOne(
          { _id: user._id },
          {
            $set: {
              status: 'LOCKED',
              failedLoginAttempts: newFailedCount,
              lockoutUntil: lockoutUntilTime,
            },
          }
        );

        await AuditService.logAuthEvent({
          userEmail: user.email,
          role: user.role,
          event: 'ACCOUNT_LOCKED',
          factor: 'PASSWORD',
          action: 'ENFORCE_FAILED_LOGIN_LOCKOUT',
          result: 'LOCKED',
          details: `Threshold exceeded (${newFailedCount}/${maxAttempts} failed attempts). Account locked for ${lockoutMinutes} minutes.`,
          ipAddress,
          userAgent,
        });

        // Register critical security alert
        await db.security_alerts.insertOne({
          title: 'Account Lockout Enforced',
          type: 'ACCOUNT_LOCKOUT',
          severity: 'HIGH',
          actorEmail: user.email,
          description: `Account ${user.email} was locked out following ${newFailedCount} invalid login attempts from ${ipAddress}.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        });

        res.status(423).json({
          error: `Your account has been temporarily locked out for ${lockoutMinutes} minutes due to repeated failed login attempts.`,
          code: 'ACCOUNT_LOCKED',
          attemptsRemaining: 0,
          maxAttempts,
          lockoutRemainingMinutes: lockoutMinutes,
        });
        return;
      } else {
        await db.users.updateOne(
          { _id: user._id },
          { $set: { failedLoginAttempts: newFailedCount } }
        );

        await AuditService.logAuthEvent({
          userEmail: user.email,
          role: user.role,
          event: 'INVALID_PASSWORD',
          factor: 'PASSWORD',
          action: 'VERIFY_CREDENTIALS',
          result: 'FAILED',
          details: `Invalid password provided. Attempt ${newFailedCount} of ${maxAttempts}.`,
          ipAddress,
          userAgent,
        });

        res.status(401).json({
          error: 'Invalid username or password.',
          code: 'INVALID_CREDENTIALS',
          attemptsRemaining: maxAttempts - newFailedCount,
          maxAttempts,
        });
        return;
      }
    }

    // Password valid -> Reset failed attempts
    const nowIso = new Date().toISOString();
    await db.users.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: 0, lockoutUntil: null, lastLogin: nowIso, lastActivity: nowIso } }
    );

    // =========================================================================
    // Multi-Tier Identity Policy (Section 6 & Section 4):
    // 1. ADMINISTRATOR: ALWAYS requires Mobile OTP (WhatsApp via UltraMsg)
    //    FOLLOWED BY Email OTP (Gmail/SMTP step-up).
    //    Per Section 6: "ADMIN MUST NEVER be allowed to bypass either factor."
    // 2. TEACHER: Requires Mobile OTP (WhatsApp via UltraMsg) in standard policy.
    // 3. STUDENT: Password-only in baseline policy (unless global lab mode is
    //    explicitly set to MODE 2 or MODE 3 for comparison benchmark).
    // =========================================================================

    const isAdmin = user.role === 'ADMINISTRATOR';
    const isTeacher = user.role === 'TEACHER';
    const isStudent = user.role === 'STUDENT';

    let requiresMobileOtp = false;

    if (isAdmin) {
      // Administrator ALWAYS requires WhatsApp Mobile OTP + Email OTP
      requiresMobileOtp = true;
    } else if (isTeacher) {
      // Teacher requires Mobile OTP unless global lab mode is forced to PASSWORD_ONLY
      requiresMobileOtp = activeMode !== 'PASSWORD_ONLY';
    } else if (isStudent) {
      // Student only requires OTP if global lab mode is set to MODE 2 or MODE 3
      requiresMobileOtp = activeMode === 'PASSWORD_OTP' || activeMode === 'PASSWORD_OTP_EMAIL';
    }

    // BASELINE: Password-Only Session Granted Immediately
    if (!requiresMobileOtp) {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionTimeout = settings?.sessionTimeoutMinutes || 30;
      const expiresAt = new Date(Date.now() + sessionTimeout * 60000).toISOString();

      await db.sessions.insertOne({
        token: sessionToken,
        userId: user._id,
        email: user.email,
        role: user.role,
        expiresAt,
        isValid: true,
        authMode: 'PASSWORD_ONLY',
        ipAddress,
        userAgent,
        lastActivity: nowIso,
      });

      await AuditService.logAuthEvent({
        userEmail: user.email,
        role: user.role,
        event: 'LOGIN_SUCCESS',
        factor: 'PASSWORD',
        action: 'AUTHENTICATE_PASSWORD_ONLY',
        result: 'SUCCESS',
        details: 'Password verification successful. Baseline single-factor session granted.',
        sessionId: sessionToken,
        ipAddress,
        userAgent,
      });

      res.json({
        success: true,
        mode: 'PASSWORD_ONLY',
        sessionToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.studentId,
          teacherId: user.teacherId,
          department: user.department,
          isTestAccount: user.isTestAccount,
        },
      });
      return;
    }

    // SECOND FACTOR: Dispatch Mobile OTP via UltraMsg WhatsApp
    try {
      const otpResult = await OtpService.generateOtp(
        user._id,
        user.email,
        'MOBILE',
        user.phoneNumberMasked || '+92 370 •••1226',
        user.phoneNumber,
        settings?.otpExpirySeconds || 300
      );

      res.json({
        success: true,
        mode: activeMode,
        step: 'REQUIRE_MOBILE_OTP',
        email: user.email,
        destinationMasked: user.phoneNumberMasked || '+92 370 •••1226',
        deliveryChannel: 'WHATSAPP_ULTRAMSG',
        expiresAt: otpResult.expiresAt,
        providerNotice: otpResult.providerNotice,
      });
    } catch (otpErr: any) {
      res.status(429).json({
        error: otpErr.message || 'Failed to dispatch mobile verification code.',
      });
    }
  }

  public static async verifyMobileOtp(req: Request, res: Response): Promise<void> {
    const { email, code } = req.body;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';

    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required.' });
      return;
    }

    const verification = await OtpService.verifyOtp(email.toLowerCase().trim(), code, 'MOBILE', ipAddress);
    if (!verification.success) {
      res.status(400).json({
        error: verification.error,
        code: verification.status === 'EXPIRED' ? 'OTP_EXPIRED' : 'OTP_INVALID',
      });
      return;
    }

    const user = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    const settings = await db.system_settings.findOne({ key: 'GLOBAL_SETTINGS' });
    const activeMode = settings?.activeAuthMode || 'PASSWORD_OTP';

    // Administrator ALWAYS requires Email Step-Up Verification (Factor 3)
    // Non-admins also require it if global mode is PASSWORD_OTP_EMAIL
    const requiresEmailStepUp = user.role === 'ADMINISTRATOR' || activeMode === 'PASSWORD_OTP_EMAIL';

    if (requiresEmailStepUp) {
      const emailMasked = user.email.replace(/(.{2})(.*)(@.*)/, '$1••••$3');
      try {
        const emailOtpResult = await OtpService.generateOtp(
          user._id,
          user.email,
          'EMAIL',
          emailMasked,
          undefined,
          settings?.emailOtpExpirySeconds || 300
        );

        res.json({
          success: true,
          completed: false,
          step: 'REQUIRE_EMAIL_OTP',
          email: user.email,
          destinationMasked: emailMasked,
          deliveryChannel: 'GMAIL_SMTP',
          expiresAt: emailOtpResult.expiresAt,
          providerNotice: emailOtpResult.providerNotice,
        });
        return;
      } catch (err: any) {
        res.status(429).json({ error: err.message });
        return;
      }
    }

    // Mode 2 Complete: Issue session for Teacher or Student
    const nowIso = new Date().toISOString();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTimeout = settings?.sessionTimeoutMinutes || 30;
    const expiresAt = new Date(Date.now() + sessionTimeout * 60000).toISOString();

    await db.sessions.insertOne({
      token: sessionToken,
      userId: user._id,
      email: user.email,
      role: user.role,
      expiresAt,
      isValid: true,
      authMode: 'PASSWORD_OTP',
      ipAddress,
      userAgent,
      lastActivity: nowIso,
    });

    await AuditService.logAuthEvent({
      userEmail: user.email,
      role: user.role,
      event: 'LOGIN_SUCCESS',
      factor: 'MOBILE_OTP',
      action: 'AUTHENTICATE_PASSWORD_OTP_MFA',
      result: 'SUCCESS',
      details: 'Two-Factor Authentication completed (Password + WhatsApp Mobile OTP verified).',
      sessionId: sessionToken,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      completed: true,
      mode: 'PASSWORD_OTP',
      sessionToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        teacherId: user.teacherId,
        department: user.department,
        isTestAccount: user.isTestAccount,
      },
    });
  }

  public static async verifyEmailOtp(req: Request, res: Response): Promise<void> {
    const { email, code } = req.body;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';

    if (!email || !code) {
      res.status(400).json({ error: 'Email and Email verification code are required.' });
      return;
    }

    const verification = await OtpService.verifyOtp(email.toLowerCase().trim(), code, 'EMAIL', ipAddress);
    if (!verification.success) {
      res.status(400).json({
        error: verification.error,
        code: verification.status === 'EXPIRED' ? 'OTP_EXPIRED' : 'OTP_INVALID',
      });
      return;
    }

    const user = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    const settings = await db.system_settings.findOne({ key: 'GLOBAL_SETTINGS' });
    const nowIso = new Date().toISOString();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTimeout = settings?.sessionTimeoutMinutes || 30;
    const expiresAt = new Date(Date.now() + sessionTimeout * 60000).toISOString();

    await db.sessions.insertOne({
      token: sessionToken,
      userId: user._id,
      email: user.email,
      role: user.role,
      expiresAt,
      isValid: true,
      authMode: 'PASSWORD_OTP_EMAIL',
      ipAddress,
      userAgent,
      lastActivity: nowIso,
    });

    await AuditService.logAuthEvent({
      userEmail: user.email,
      role: user.role,
      event: 'LOGIN_SUCCESS',
      factor: 'EMAIL_OTP',
      action: 'AUTHENTICATE_PASSWORD_MOBILE_EMAIL_MFA',
      result: 'SUCCESS',
      details: 'Comprehensive 3-factor authentication completed (Password + WhatsApp OTP + Email OTP). Highest assurance profile.',
      sessionId: sessionToken,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      completed: true,
      mode: 'PASSWORD_OTP_EMAIL',
      sessionToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        teacherId: user.teacherId,
        department: user.department,
        isTestAccount: user.isTestAccount,
      },
    });
  }

  public static async resendOtp(req: Request, res: Response): Promise<void> {
    const { email, type } = req.body;
    if (!email || !type || !['MOBILE', 'EMAIL'].includes(type)) {
      res.status(400).json({ error: 'Valid email and OTP type (MOBILE or EMAIL) required.' });
      return;
    }

    const user = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const destination = type === 'MOBILE' ? user.phoneNumberMasked : user.email.replace(/(.{2})(.*)(@.*)/, '$1••••$3');
    try {
      const result = await OtpService.generateOtp(
        user._id,
        user.email,
        type,
        destination,
        type === 'MOBILE' ? user.phoneNumber : undefined
      );

      res.json({
        success: true,
        message: `A fresh ${type.toLowerCase()} verification code has been dispatched.`,
        expiresAt: result.expiresAt,
        providerNotice: result.providerNotice,
      });
    } catch (err: any) {
      res.status(429).json({ error: err.message });
    }
  }

  public static async expireOtpForTesting(req: Request, res: Response): Promise<void> {
    const { email, type } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const expired = await OtpService.expireLatestOtpForEmail(email.toLowerCase().trim(), type);
    res.json({
      success: expired,
      message: expired ? 'Active OTP timestamp expired forcibly for testing scenario T06.' : 'No active OTP found to expire.',
    });
  }

  public static async getTestDispatches(req: Request, res: Response): Promise<void> {
    // Evaluator inspection stream for lab demonstration
    res.json({ dispatches: OtpService.getTestDispatches() });
  }

  public static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.session) {
      await db.sessions.updateOne(
        { _id: req.session._id },
        { $set: { isValid: false, revokedAt: new Date().toISOString(), revokedBy: 'USER_LOGOUT' } }
      );

      await AuditService.logAuthEvent({
        userEmail: req.session.email,
        role: req.session.role,
        event: 'LOGOUT',
        factor: 'SESSION',
        action: 'REVOKE_SESSION',
        result: 'SUCCESS',
        details: 'User explicitly logged out. Session invalidated in authorization store.',
        sessionId: req.session.token,
      });
    }

    res.json({ success: true, message: 'Successfully logged out.' });
  }

  public static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user || !req.session) {
      res.status(401).json({ error: 'Unauthenticated.' });
      return;
    }

    // Refresh last active timestamp
    await db.sessions.updateOne({ _id: req.session._id }, { $set: { lastActivity: new Date().toISOString() } });

    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        phoneNumber: req.user.phoneNumber,
        phoneNumberMasked: req.user.phoneNumberMasked,
        studentId: req.user.studentId,
        teacherId: req.user.teacherId,
        department: req.user.department,
        mfaEnabled: req.user.mfaEnabled,
        status: req.user.status,
        isTestAccount: req.user.isTestAccount,
      },
      session: {
        token: req.session.token,
        authMode: req.session.authMode,
        expiresAt: req.session.expiresAt,
      },
    });
  }

  // --- Password Reset / Account Recovery (Section 39) ---
  public static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.users.findOne({ email: cleanEmail });

    // Always return safe success message to avoid account enumeration
    if (!user) {
      res.json({
        success: true,
        message: 'If the provided institutional account exists, recovery instructions have been initiated.',
      });
      return;
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins

    // Invalidate existing recovery OTPs
    await OtpService.generateOtp(user._id, user.email, 'EMAIL', user.email.replace(/(.{2})(.*)(@.*)/, '$1••••$3'));

    await AuditService.logAuthEvent({
      userEmail: user.email,
      role: user.role,
      event: 'PASSWORD_RESET_REQUESTED',
      factor: 'EMAIL_OTP',
      action: 'REQUEST_PASSWORD_RESET',
      result: 'SUCCESS',
      details: 'Password recovery flow initiated. Verification challenge dispatched.',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'If the provided institutional account exists, recovery instructions have been initiated.',
      emailMasked: user.email.replace(/(.{2})(.*)(@.*)/, '$1••••$3'),
    });
  }

  public static async completePasswordReset(req: Request, res: Response): Promise<void> {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword) {
      res.status(400).json({ error: 'Email, verification code, and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const verify = await OtpService.verifyOtp(cleanEmail, otpCode, 'EMAIL', req.ip);
    if (!verify.success) {
      res.status(400).json({ error: verify.error || 'Invalid or expired recovery code.' });
      return;
    }

    const user = await db.users.findOne({ email: cleanEmail });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const newHashed = hashPassword(newPassword);
    await db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: newHashed.hash,
          passwordSalt: newHashed.salt,
          failedLoginAttempts: 0,
          lockoutUntil: null,
          status: user.status === 'LOCKED' ? 'ACTIVE' : user.status,
        },
      }
    );

    // Invalidate all active sessions for this user to prevent session fixation
    const userSessions = await db.sessions.find({ userId: user._id, isValid: true });
    for (const s of userSessions) {
      await db.sessions.updateOne({ _id: s._id }, { $set: { isValid: false, revokedAt: new Date().toISOString(), revokedBy: 'PASSWORD_RESET' } });
    }

    await AuditService.logAuthEvent({
      userEmail: user.email,
      role: user.role,
      event: 'PASSWORD_RESET_COMPLETED',
      factor: 'PASSWORD',
      action: 'UPDATE_PASSWORD_CREDENTIAL',
      result: 'SUCCESS',
      details: 'Password successfully updated via verified recovery channel. All active sessions invalidated.',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Your password has been successfully reset. Please log in with your new credentials.',
    });
  }

  // --- Public Support Ticket Submission (Section 17 & 18) ---
  public static async submitSupportTicket(req: Request, res: Response): Promise<void> {
    const { email, name, category, subject, message } = req.body;
    if (!email || !subject || !message) {
      res.status(400).json({ error: 'Email, subject, and inquiry message are required.' });
      return;
    }

    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticket = await db.support_tickets.insertOne({
      ticketNumber,
      email: email.toLowerCase().trim(),
      name: name || email,
      category: category || 'GENERAL_INQUIRY',
      subject: subject.trim(),
      message: message.trim(),
      status: 'PENDING',
    });

    await AuditService.logAuthEvent({
      userEmail: email,
      event: 'SUPPORT_TICKET_SUBMITTED',
      factor: 'SYSTEM',
      action: 'CREATE_HELP_TICKET',
      result: 'SUCCESS',
      details: `Support ticket ${ticketNumber} created for subject: "${subject.substring(0, 40)}"`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      ticketNumber,
      message: 'Your support ticket has been submitted. SOC administrators will review your request.',
    });
  }
}
