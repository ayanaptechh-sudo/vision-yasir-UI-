import { Request, Response } from 'express';
import crypto from 'crypto';
import { db, verifyPassword, hashPassword, UserDoc } from '../database/db';
import { OtpService } from '../services/otpService';
import { AuditService } from '../services/auditService';
import { UltraMsgService } from '../services/ultraMsgService';
import { EmailService } from '../services/emailService';
import { CryptoService } from '../services/cryptoService';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Serializes user record to safely exclude password hashes, salts, and TOTP secrets.
 */
export function getSafeUserDTO(user: UserDoc) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    phoneNumber: user.phoneNumber,
    phoneNumberMasked: user.phoneNumberMasked,
    studentId: user.studentId,
    teacherId: user.teacherId,
    department: user.department,
    mfaEnabled: user.mfaEnabled,
    twoFactorEnabled: !!user.twoFactorEnabled,
    status: user.status,
    isTestAccount: user.isTestAccount,
  };
}

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

  // =========================================================================
  // LOGIN STEP 1: PASSWORD VERIFICATION & ROLE-BASED FACTOR DISPATCH
  // Server-authoritative: Role determined exclusively from DB user record
  // 1. STUDENT: Password only -> immediate session token
  // 2. TEACHER: Password -> WhatsApp OTP -> Google Authenticator TOTP
  // 3. ADMINISTRATOR: Password -> Gmail OTP -> WhatsApp OTP -> Google Authenticator TOTP
  // =========================================================================
  public static async loginStep1(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Browser';

    if (!email || !password) {
      res.status(400).json({ error: 'Username/Email and Password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.users.findOne({ email: cleanEmail });
    const settings = await db.system_settings.findOne({ key: 'GLOBAL_SETTINGS' });
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

      // 2. Account Suspended or Banned
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
    // ROLE-SPECIFIC MANDATORY FACTORS (Server-authoritative):
    // 1. STUDENT: Password only -> Grant session immediately.
    // 2. TEACHER: Password -> WhatsApp OTP -> Google Authenticator TOTP.
    // 3. ADMINISTRATOR: Password -> Gmail OTP -> WhatsApp OTP -> Google Authenticator TOTP.
    // =========================================================================

    // 1. STUDENT FLOW
    if (user.role === 'STUDENT') {
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
        action: 'AUTHENTICATE_STUDENT_PASSWORD_ONLY',
        result: 'SUCCESS',
        details: 'Student authentication verified. Baseline single-factor session granted.',
        sessionId: sessionToken,
        ipAddress,
        userAgent,
      });

      res.json({
        success: true,
        mode: 'PASSWORD_ONLY',
        sessionToken,
        user: getSafeUserDTO(user),
      });
      return;
    }

    // 2. TEACHER FLOW -> Dispatches WhatsApp OTP (Mobile OTP)
    if (user.role === 'TEACHER') {
      try {
        const otpResult = await OtpService.generateOtp(
          user._id,
          user.email,
          'MOBILE',
          user.phoneNumberMasked || '+1 (555) •••-7390',
          user.phoneNumber,
          settings?.otpExpirySeconds || 300
        );

        res.json({
          success: true,
          role: 'TEACHER',
          step: 'REQUIRE_MOBILE_OTP',
          email: user.email,
          destinationMasked: user.phoneNumberMasked || '+1 (555) •••-7390',
          deliveryChannel: 'WHATSAPP_ULTRAMSG',
          expiresAt: otpResult.expiresAt,
          providerNotice: otpResult.providerNotice,
        });
        return;
      } catch (otpErr: any) {
        res.status(429).json({
          error: otpErr.message || 'Failed to dispatch WhatsApp verification code.',
        });
        return;
      }
    }

    // 3. ADMINISTRATOR FLOW -> Dispatches Gmail OTP (Factor 2 of 4)
    if (user.role === 'ADMINISTRATOR') {
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
          role: 'ADMINISTRATOR',
          step: 'REQUIRE_EMAIL_OTP',
          email: user.email,
          destinationMasked: emailMasked,
          deliveryChannel: 'GMAIL_SMTP',
          expiresAt: emailOtpResult.expiresAt,
          providerNotice: emailOtpResult.providerNotice,
        });
        return;
      } catch (err: any) {
        res.status(429).json({ error: err.message || 'Failed to dispatch Gmail verification code.' });
        return;
      }
    }
  }

  // =========================================================================
  // GMAIL OTP VERIFICATION (Administrator Only)
  // Step 2 for Admin: Gmail OTP -> Proceed to WhatsApp OTP (Step 3)
  // =========================================================================
  public static async verifyEmailOtp(req: Request, res: Response): Promise<void> {
    const { email, code } = req.body;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Browser';

    if (!email || !code) {
      res.status(400).json({ error: 'Email and Email verification code are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.users.findOne({ email: cleanEmail });
    if (!user) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    // Strict role check: Only Administrator uses Gmail OTP for authentication
    if (user.role !== 'ADMINISTRATOR') {
      res.status(403).json({ error: 'Gmail OTP verification is only authorized for Administrator authentication.' });
      return;
    }

    const verification = await OtpService.verifyOtp(cleanEmail, code, 'EMAIL', ipAddress);
    if (!verification.success) {
      res.status(400).json({
        error: verification.error,
        code: verification.status === 'EXPIRED' ? 'OTP_EXPIRED' : 'OTP_INVALID',
      });
      return;
    }

    // Gmail OTP verified! Admin proceeds to Step 3: WhatsApp OTP (Mobile)
    const settings = await db.system_settings.findOne({ key: 'GLOBAL_SETTINGS' });
    try {
      const mobileOtpResult = await OtpService.generateOtp(
        user._id,
        user.email,
        'MOBILE',
        user.phoneNumberMasked || '+92 370 •••1226',
        user.phoneNumber,
        settings?.otpExpirySeconds || 300
      );

      await AuditService.logAuthEvent({
        userEmail: user.email,
        role: user.role,
        event: 'OTP_SUCCESS',
        factor: 'EMAIL_OTP',
        action: 'VERIFY_ADMIN_GMAIL_FACTOR',
        result: 'SUCCESS',
        details: 'Admin Gmail OTP verified. Step 3 WhatsApp OTP challenge dispatched.',
        ipAddress,
        userAgent,
      });

      res.json({
        success: true,
        completed: false,
        step: 'REQUIRE_MOBILE_OTP',
        role: 'ADMINISTRATOR',
        email: user.email,
        destinationMasked: user.phoneNumberMasked || '+92 370 •••1226',
        deliveryChannel: 'WHATSAPP_ULTRAMSG',
        expiresAt: mobileOtpResult.expiresAt,
        providerNotice: mobileOtpResult.providerNotice,
      });
    } catch (err: any) {
      res.status(429).json({ error: err.message || 'Failed to dispatch WhatsApp OTP.' });
    }
  }

  // =========================================================================
  // WHATSAPP OTP VERIFICATION (Teacher & Administrator)
  // Teacher (Step 2) -> Google Authenticator TOTP (Step 3)
  // Admin (Step 3) -> Google Authenticator TOTP (Step 4)
  // =========================================================================
  public static async verifyMobileOtp(req: Request, res: Response): Promise<void> {
    const { email, code } = req.body;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Browser';

    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.users.findOne({ email: cleanEmail });
    if (!user) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    if (user.role === 'STUDENT') {
      res.status(403).json({ error: 'Students do not participate in OTP verification.' });
      return;
    }

    const verification = await OtpService.verifyOtp(cleanEmail, code, 'MOBILE', ipAddress);
    if (!verification.success) {
      res.status(400).json({
        error: verification.error,
        code: verification.status === 'EXPIRED' ? 'OTP_EXPIRED' : 'OTP_INVALID',
      });
      return;
    }

    await AuditService.logAuthEvent({
      userEmail: user.email,
      role: user.role,
      event: 'OTP_SUCCESS',
      factor: 'MOBILE_OTP',
      action: `VERIFY_${user.role}_WHATSAPP_FACTOR`,
      result: 'SUCCESS',
      details: `WhatsApp OTP verified successfully for ${user.role}. Advancing to Google Authenticator TOTP.`,
      ipAddress,
      userAgent,
    });

    // Advance to Google Authenticator 2FA Factor
    // Check if user has already configured and enabled 2FA
    if (user.twoFactorEnabled && user.totpSecretEncrypted) {
      res.json({
        success: true,
        completed: false,
        step: 'REQUIRE_TOTP',
        email: user.email,
        role: user.role,
        message: 'WhatsApp OTP verified. Enter the 6-digit code from Google Authenticator.',
      });
      return;
    }

    // User does NOT have 2FA enabled yet -> Cannot bypass! Must complete setup now (Section 10)
    const secretBase32 = CryptoService.generateTotpSecret();
    const encryptedSecret = CryptoService.encrypt(secretBase32);
    const otpauthUri = CryptoService.getOtpAuthUri(user.email, secretBase32);
    const qrCodeUrl = await CryptoService.generateQrCodeDataUrl(otpauthUri);

    // Save temporary encrypted secret in user document
    await db.users.updateOne(
      { _id: user._id },
      { $set: { totpTempSecretEncrypted: encryptedSecret, failedTotpAttempts: 0 } }
    );

    await AuditService.logAuthEvent({
      userEmail: user.email,
      role: user.role,
      event: 'TOTP_SETUP_INITIATED',
      factor: 'SYSTEM',
      action: 'INITIATE_TOTP_ENROLLMENT_DURING_LOGIN',
      result: 'SUCCESS',
      details: 'Google Authenticator setup initiated during mandatory MFA login flow.',
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      completed: false,
      step: 'REQUIRE_TOTP_SETUP',
      email: user.email,
      role: user.role,
      qrCodeUrl,
      manualKey: secretBase32,
      message: 'Google Authenticator 2FA is required for your account. Scan this QR code and submit the 6-digit code.',
    });
  }

  // =========================================================================
  // GOOGLE AUTHENTICATOR TOTP VERIFICATION (Final Factor for Teacher & Admin)
  // RFC 6238 6-digit TOTP, 30s window, clock drift (+/-1), replay protection
  // =========================================================================
  public static async verifyTotp(req: Request, res: Response): Promise<void> {
    const { email, code } = req.body;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Browser';

    if (!email || !code) {
      res.status(400).json({ error: 'Email and 6-digit Google Authenticator code are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.users.findOne({ email: cleanEmail });
    if (!user) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    if (user.role === 'STUDENT') {
      res.status(403).json({ error: 'Students do not participate in TOTP authentication.' });
      return;
    }

    // Rate-limiting and temporary lockout check on TOTP attempts
    if (user.totpLockoutUntil && new Date() < new Date(user.totpLockoutUntil)) {
      const remainingMinutes = Math.ceil((new Date(user.totpLockoutUntil).getTime() - Date.now()) / 60000);
      await AuditService.logAuthEvent({
        userEmail: user.email,
        role: user.role,
        event: 'TOTP_LOCKED',
        factor: 'SYSTEM',
        action: 'VERIFY_TOTP_FACTOR',
        result: 'LOCKED',
        details: `TOTP attempts temporarily blocked. Lockout active for ${remainingMinutes} minute(s).`,
        ipAddress,
        userAgent,
      });

      res.status(423).json({
        error: `Too many invalid Google Authenticator attempts. Temporarily locked for ${remainingMinutes} minute(s).`,
        code: 'TOTP_LOCKED',
        lockoutRemainingMinutes: remainingMinutes,
      });
      return;
    }

    // Retrieve active secret (permanent or temp for setup)
    const encryptedSecret = user.totpSecretEncrypted || user.totpTempSecretEncrypted;
    if (!encryptedSecret) {
      res.status(400).json({
        error: 'No Google Authenticator configuration found. Please start login again to initiate setup.',
        code: 'NO_TOTP_CONFIG',
      });
      return;
    }

    let secretBase32: string;
    try {
      secretBase32 = CryptoService.decrypt(encryptedSecret);
    } catch {
      res.status(500).json({ error: 'Failed to decrypt TOTP security credentials.' });
      return;
    }

    // Verify code with replay protection
    const verification = CryptoService.verifyTotp(secretBase32, code, user.lastVerifiedTotpStep || undefined);

    if (!verification.valid) {
      const failedAttempts = (user.failedTotpAttempts || 0) + 1;
      const maxTotpAttempts = 5;

      if (failedAttempts >= maxTotpAttempts) {
        const lockoutTime = new Date(Date.now() + 5 * 60000).toISOString();
        await db.users.updateOne(
          { _id: user._id },
          { $set: { failedTotpAttempts: failedAttempts, totpLockoutUntil: lockoutTime } }
        );

        await AuditService.logAuthEvent({
          userEmail: user.email,
          role: user.role,
          event: 'TOTP_LOCKOUT',
          factor: 'SYSTEM',
          action: 'ENFORCE_TOTP_LOCKOUT',
          result: 'LOCKED',
          details: `TOTP lockout triggered after ${failedAttempts} failed attempts.`,
          ipAddress,
          userAgent,
        });

        res.status(423).json({
          error: 'Too many invalid TOTP attempts. Verification temporarily locked for 5 minutes.',
          code: 'TOTP_LOCKED',
          lockoutRemainingMinutes: 5,
        });
        return;
      } else {
        await db.users.updateOne(
          { _id: user._id },
          { $set: { failedTotpAttempts: failedAttempts } }
        );

        await AuditService.logAuthEvent({
          userEmail: user.email,
          role: user.role,
          event: 'TOTP_FAILED',
          factor: 'SYSTEM',
          action: 'VERIFY_TOTP_FACTOR',
          result: 'FAILED',
          details: `Invalid Google Authenticator code. Attempt ${failedAttempts} of ${maxTotpAttempts}.`,
          ipAddress,
          userAgent,
        });

        res.status(400).json({
          error: verification.error || 'Invalid 6-digit Google Authenticator code.',
          code: 'TOTP_INVALID',
          attemptsRemaining: maxTotpAttempts - failedAttempts,
        });
        return;
      }
    }

    // TOTP Verification Succeeded!
    const wasPendingSetup = !user.twoFactorEnabled && !!user.totpTempSecretEncrypted;
    const nowIso = new Date().toISOString();

    const updateFields: any = {
      failedTotpAttempts: 0,
      totpLockoutUntil: null,
      lastVerifiedTotpStep: verification.verifiedStep,
    };

    if (wasPendingSetup) {
      // Mark 2FA as fully enabled only AFTER successful verification
      updateFields.twoFactorEnabled = true;
      updateFields.totpSecretEncrypted = user.totpTempSecretEncrypted;
      updateFields.totpTempSecretEncrypted = null;
    }

    await db.users.updateOne({ _id: user._id }, { $set: updateFields });
    user.twoFactorEnabled = true;

    await AuditService.logAuthEvent({
      userEmail: user.email,
      role: user.role,
      event: wasPendingSetup ? 'TOTP_SETUP_SUCCESS' : 'TOTP_VERIFICATION_SUCCESS',
      factor: 'SYSTEM',
      action: wasPendingSetup ? 'COMPLETE_TOTP_SETUP' : 'VERIFY_TOTP_FACTOR',
      result: 'SUCCESS',
      details: wasPendingSetup
        ? 'Google Authenticator 2FA configured and verified. Factor enabled.'
        : 'Google Authenticator TOTP factor verified.',
      ipAddress,
      userAgent,
    });

    // Issue Final Session Token
    const settings = await db.system_settings.findOne({ key: 'GLOBAL_SETTINGS' });
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTimeout = settings?.sessionTimeoutMinutes || 30;
    const expiresAt = new Date(Date.now() + sessionTimeout * 60000).toISOString();
    const authMode = user.role === 'ADMINISTRATOR' ? 'PASSWORD_OTP_EMAIL' : 'PASSWORD_OTP';

    await db.sessions.insertOne({
      token: sessionToken,
      userId: user._id,
      email: user.email,
      role: user.role,
      expiresAt,
      isValid: true,
      authMode,
      ipAddress,
      userAgent,
      lastActivity: nowIso,
    });

    await AuditService.logAuthEvent({
      userEmail: user.email,
      role: user.role,
      event: 'LOGIN_SUCCESS',
      factor: 'SYSTEM',
      action: `AUTHENTICATE_${user.role}_MFA_COMPLETE`,
      result: 'SUCCESS',
      details: `Full role-based authentication completed for ${user.role} with Google Authenticator TOTP.`,
      sessionId: sessionToken,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      completed: true,
      mode: authMode,
      sessionToken,
      user: getSafeUserDTO(user),
    });
  }

  // =========================================================================
  // IN-PROFILE 2FA SETUP & MANAGEMENT (Teacher & Admin Only)
  // Section 7: Generate secret, create otpauth URI, QR code, manual key.
  // Never enable 2FA until user verifies the 6-digit code!
  // =========================================================================
  public static async setupTotp(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (req.user.role === 'STUDENT') {
      res.status(403).json({ error: 'Students are not authorized to configure 2FA.' });
      return;
    }

    try {
      const secretBase32 = CryptoService.generateTotpSecret();
      const encryptedSecret = CryptoService.encrypt(secretBase32);
      const otpauthUri = CryptoService.getOtpAuthUri(req.user.email, secretBase32);
      const qrCodeUrl = await CryptoService.generateQrCodeDataUrl(otpauthUri);

      // Store temporary encrypted secret until verified
      await db.users.updateOne(
        { _id: req.user._id },
        { $set: { totpTempSecretEncrypted: encryptedSecret, failedTotpAttempts: 0 } }
      );

      await AuditService.logAuthEvent({
        userEmail: req.user.email,
        role: req.user.role,
        event: 'TOTP_SETUP_INITIATED',
        factor: 'SYSTEM',
        action: 'INITIATE_PROFILE_2FA_SETUP',
        result: 'SUCCESS',
        details: 'User initiated Google Authenticator setup from Profile/Security area.',
        sessionId: req.session?.token,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        qrCodeUrl,
        manualKey: secretBase32,
        email: req.user.email,
        issuer: 'AuthShield360',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to initiate Google Authenticator setup.' });
    }
  }

  public static async verifyTotpSetup(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (req.user.role === 'STUDENT') {
      res.status(403).json({ error: 'Students are not authorized for 2FA.' });
      return;
    }

    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: '6-digit verification code from Google Authenticator is required.' });
      return;
    }

    const user = await db.users.findOne({ _id: req.user._id });
    if (!user || !user.totpTempSecretEncrypted) {
      res.status(400).json({ error: 'No pending 2FA setup found. Please click Set Up Google Authenticator first.' });
      return;
    }

    let secretBase32: string;
    try {
      secretBase32 = CryptoService.decrypt(user.totpTempSecretEncrypted);
    } catch {
      res.status(500).json({ error: 'Failed to decrypt pending secret.' });
      return;
    }

    const verification = CryptoService.verifyTotp(secretBase32, code, user.lastVerifiedTotpStep || undefined);
    if (!verification.valid) {
      res.status(400).json({ error: verification.error || 'Invalid verification code. Please check your app.' });
      return;
    }

    // Verification succeeded: Mark 2FA as permanently ENABLED
    await db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          twoFactorEnabled: true,
          totpSecretEncrypted: user.totpTempSecretEncrypted,
          totpTempSecretEncrypted: null,
          lastVerifiedTotpStep: verification.verifiedStep,
          failedTotpAttempts: 0,
          totpLockoutUntil: null,
        },
      }
    );

    await AuditService.logAuthEvent({
      userEmail: user.email,
      role: user.role,
      event: 'TOTP_SETUP_SUCCESS',
      factor: 'SYSTEM',
      action: 'ENABLE_GOOGLE_AUTHENTICATOR_2FA',
      result: 'SUCCESS',
      details: 'Google Authenticator 2FA successfully configured and verified. Status: ENABLED.',
      sessionId: req.session?.token,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Google Authenticator 2FA has been successfully verified and enabled on your account.',
      twoFactorEnabled: true,
    });
  }

  public static async resetMyTotp(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (req.user.role === 'STUDENT') {
      res.status(403).json({ error: 'Students do not have 2FA.' });
      return;
    }

    const { currentPassword } = req.body;
    if (!currentPassword) {
      res.status(400).json({ error: 'Current password is required to reset 2FA configuration.' });
      return;
    }

    const user = await db.users.findOne({ _id: req.user._id });
    if (!user) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    const isValid = verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid password. Cannot reset 2FA.' });
      return;
    }

    await db.users.updateOne(
      { _id: user._id },
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
      userEmail: user.email,
      role: user.role,
      event: '2FA_RESET',
      factor: 'SYSTEM',
      action: 'USER_SELF_RESET_2FA',
      result: 'SUCCESS',
      details: 'User reset their Google Authenticator 2FA configuration after password verification.',
      sessionId: req.session?.token,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Google Authenticator 2FA has been reset. You must re-configure 2FA.',
      twoFactorEnabled: false,
    });
  }

  public static async getTotpStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (req.user.role === 'STUDENT') {
      res.json({
        eligible: false,
        twoFactorEnabled: false,
        role: 'STUDENT',
      });
      return;
    }

    const user = await db.users.findOne({ _id: req.user._id });
    res.json({
      eligible: true,
      twoFactorEnabled: !!user?.twoFactorEnabled,
      role: req.user.role,
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

    // Role verification for OTP dispatch: Students never receive OTPs
    if (user.role === 'STUDENT') {
      res.status(403).json({ error: 'Students do not participate in OTP authentication.' });
      return;
    }

    // Teachers never receive EMAIL OTPs
    if (user.role === 'TEACHER' && type === 'EMAIL') {
      res.status(403).json({ error: 'Teachers do not use Email OTP.' });
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
      user: getSafeUserDTO(req.user),
      session: {
        token: req.session.token,
        authMode: req.session.authMode,
        expiresAt: req.session.expiresAt,
      },
    });
  }

  // --- Password Reset / Account Recovery ---
  public static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.users.findOne({ email: cleanEmail });

    // Always return safe generic success message to prevent account enumeration
    if (!user) {
      res.json({
        success: true,
        message: 'If the provided institutional account exists, recovery instructions have been initiated.',
      });
      return;
    }

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

    // Invalidate all active sessions for this user to prevent session fixation / hijacking
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

  // --- Public Support Ticket Submission ---
  public static async submitSupportTicket(req: Request, res: Response): Promise<void> {
    const { email, name, category, subject, message } = req.body;
    if (!email || !subject || !message) {
      res.status(400).json({ error: 'Email, subject, and inquiry message are required.' });
      return;
    }

    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    await db.support_tickets.insertOne({
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
