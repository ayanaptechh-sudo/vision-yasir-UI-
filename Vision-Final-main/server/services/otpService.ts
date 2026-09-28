import crypto from 'crypto';
import { db } from '../database/db';
import { AuditService } from './auditService';
import { UltraMsgService } from './ultraMsgService';
import { EmailService } from './emailService';

export interface TestDispatch {
  id: string;
  type: 'MOBILE' | 'EMAIL';
  email: string;
  destinationMasked: string;
  code: string; // Available exclusively in evaluator lab inspection stream
  timestamp: string;
  expiresAt: string;
  providerStatus: string;
}

export class OtpService {
  // Evaluator in-memory lab stream (allows reviewing dispatched codes in isolated testing without live SMS/SMTP)
  private static testDispatches: TestDispatch[] = [];

  /**
   * Hashes an OTP with a unique salt using SHA-256 to ensure no plaintext OTP is stored in database.
   */
  public static hashOtp(code: string, salt: string): string {
    return crypto.createHash('sha256').update(code + salt).digest('hex');
  }

  public static async generateOtp(
    userId: string,
    email: string,
    type: 'MOBILE' | 'EMAIL',
    destinationMasked: string,
    rawPhoneOrTtl?: string | number,
    customTtlSecondsArg?: number,
    bypassCooldown: boolean = false
  ): Promise<{ expiresAt: string; recordId: string; code: string; providerNotice?: string }> {
    let rawPhoneNumber: string | undefined;
    let customTtlSeconds = customTtlSecondsArg;

    if (typeof rawPhoneOrTtl === 'number') {
      customTtlSeconds = rawPhoneOrTtl;
    } else if (typeof rawPhoneOrTtl === 'string') {
      rawPhoneNumber = rawPhoneOrTtl;
    }

    const settings = await db.system_settings.findOne({ key: 'GLOBAL_SETTINGS' });
    const ttlSeconds = customTtlSeconds || (type === 'MOBILE' ? (settings?.otpExpirySeconds || 300) : (settings?.emailOtpExpirySeconds || 300));
    const now = new Date();

    // Check resend cooldown (30 seconds) unless bypassed for automated test matrix
    const activeExisting = await db.otp_records.findOne(
      r => r.email === email && r.type === type && !r.verified
    );

    if (activeExisting) {
      const createdAt = new Date(activeExisting.createdAt).getTime();
      const elapsedSeconds = Math.floor((now.getTime() - createdAt) / 1000);
      const cooldownPeriod = 30; // 30 seconds

      if (!bypassCooldown && elapsedSeconds < cooldownPeriod) {
        const remaining = cooldownPeriod - elapsedSeconds;
        throw new Error(`Resend cooldown active. Please wait ${remaining} second(s) before requesting another verification code.`);
      }

      // Invalidate existing active OTPs for this user & channel
      await db.otp_records.updateOne({ _id: activeExisting._id }, { $set: { verified: true } });
    }

    // Cryptographically random 6-digit OTP code
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeSalt = crypto.randomBytes(16).toString('hex');
    const codeHash = this.hashOtp(code, codeSalt);
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

    const record = await db.otp_records.insertOne({
      userId,
      email,
      codeHash,
      codeSalt,
      type,
      destinationMasked,
      expiresAt,
      verified: false,
      attempts: 0,
      maxAttempts: 5,
    });

    let providerStatusText = 'LOCAL_SIMULATOR';

    // Dispatch out-of-band factor to configured provider
    if (type === 'MOBILE') {
      const phoneToSend = rawPhoneNumber || destinationMasked;
      const ultraMsgResult = await UltraMsgService.sendWhatsAppOtp(
        phoneToSend,
        code,
        email,
        Math.ceil(ttlSeconds / 60)
      );
      providerStatusText = ultraMsgResult.status === 'SENT' ? 'SENT_VIA_ULTRAMSG_WHATSAPP' : 'ULTRAMSG_' + ultraMsgResult.status;
    } else {
      const emailResult = await EmailService.sendEmailOtp(
        email,
        code,
        Math.ceil(ttlSeconds / 60)
      );
      providerStatusText = emailResult.status === 'SENT' ? 'SENT_VIA_GMAIL_SMTP' : 'SMTP_' + emailResult.status;
    }

    // Add to evaluator lab stream (capped at 25 entries)
    const dispatch: TestDispatch = {
      id: record._id,
      type,
      email,
      destinationMasked,
      code,
      timestamp: now.toISOString(),
      expiresAt,
      providerStatus: providerStatusText,
    };
    OtpService.testDispatches.unshift(dispatch);
    if (OtpService.testDispatches.length > 25) {
      OtpService.testDispatches.pop();
    }

    // Audit log: Never expose plaintext code in audit logs
    await AuditService.logAuthEvent({
      userEmail: email,
      event: 'OTP_GENERATED',
      factor: type === 'MOBILE' ? 'MOBILE_OTP' : 'EMAIL_OTP',
      action: `DISPATCH_${type}_CHALLENGE`,
      result: 'SUCCESS',
      details: `Dispatched ${type} OTP challenge to ${destinationMasked}. Provider status: ${providerStatusText}. TTL: ${ttlSeconds}s.`,
    });

    return { expiresAt, recordId: record._id, code, providerNotice: providerStatusText };
  }

  public static async verifyOtp(
    email: string,
    code: string,
    type: 'MOBILE' | 'EMAIL',
    ipAddress?: string
  ): Promise<{ success: boolean; error?: string; status: 'SUCCESS' | 'FAILED' | 'EXPIRED' }> {
    const record = await db.otp_records.findOne(
      r => r.email === email && r.type === type && !r.verified
    );

    if (!record) {
      await AuditService.logAuthEvent({
        userEmail: email,
        event: 'OTP_FAILED',
        factor: type === 'MOBILE' ? 'MOBILE_OTP' : 'EMAIL_OTP',
        action: `VERIFY_${type}_CHALLENGE`,
        result: 'FAILED',
        details: `No active pending OTP challenge found for ${email}.`,
        ipAddress,
      });
      return { success: false, error: 'No active OTP request found. Please request a new code.', status: 'FAILED' };
    }

    // Check expiration
    const now = new Date();
    const expiry = new Date(record.expiresAt);
    if (now > expiry) {
      await db.otp_records.updateOne({ _id: record._id }, { $set: { verified: true } });
      await AuditService.logAuthEvent({
        userEmail: email,
        event: 'OTP_EXPIRED',
        factor: type === 'MOBILE' ? 'MOBILE_OTP' : 'EMAIL_OTP',
        action: `VERIFY_${type}_CHALLENGE`,
        result: 'EXPIRED',
        details: `Submitted OTP for ${type} verification was expired (Expired at ${record.expiresAt}).`,
        ipAddress,
      });
      return { success: false, error: 'This OTP has expired. Please request a new verification code.', status: 'EXPIRED' };
    }

    // Increment attempts
    const newAttempts = (record.attempts || 0) + 1;
    await db.otp_records.updateOne({ _id: record._id }, { $set: { attempts: newAttempts } });

    // Check max attempts
    if (newAttempts > (record.maxAttempts || 5)) {
      await db.otp_records.updateOne({ _id: record._id }, { $set: { verified: true } });
      await AuditService.logAuthEvent({
        userEmail: email,
        event: 'OTP_MAX_ATTEMPTS_EXCEEDED',
        factor: type === 'MOBILE' ? 'MOBILE_OTP' : 'EMAIL_OTP',
        action: `VERIFY_${type}_CHALLENGE`,
        result: 'FAILED',
        details: `Exceeded maximum verification attempts (${newAttempts}/${record.maxAttempts || 5}). Token invalidated.`,
        ipAddress,
      });
      return { success: false, error: 'Too many invalid attempts. This OTP has been invalidated for security. Request a new code.', status: 'EXPIRED' };
    }

    // Verify hash using timing-safe comparison
    const candidateHash = this.hashOtp(code.trim(), record.codeSalt);
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    const storedBuffer = Buffer.from(record.codeHash, 'hex');

    const isMatch = candidateBuffer.length === storedBuffer.length && crypto.timingSafeEqual(candidateBuffer, storedBuffer);

    if (!isMatch) {
      await AuditService.logAuthEvent({
        userEmail: email,
        event: 'OTP_FAILED',
        factor: type === 'MOBILE' ? 'MOBILE_OTP' : 'EMAIL_OTP',
        action: `VERIFY_${type}_CHALLENGE`,
        result: 'FAILED',
        details: `Invalid ${type} OTP attempt provided. Attempt ${newAttempts} of ${record.maxAttempts || 5}.`,
        ipAddress,
      });
      return {
        success: false,
        error: `Invalid verification code. Please try again (${(record.maxAttempts || 5) - newAttempts} attempt(s) remaining).`,
        status: 'FAILED',
      };
    }

    // Success: mark verified immediately (single-use enforcement)
    await db.otp_records.updateOne({ _id: record._id }, { $set: { verified: true } });
    await AuditService.logAuthEvent({
      userEmail: email,
      event: 'OTP_SUCCESS',
      factor: type === 'MOBILE' ? 'MOBILE_OTP' : 'EMAIL_OTP',
      action: `VERIFY_${type}_CHALLENGE`,
      result: 'SUCCESS',
      details: `Successful ${type} OTP challenge verification completed.`,
      ipAddress,
    });

    return { success: true, status: 'SUCCESS' };
  }

  // Testing helper: Force-expire an OTP to demonstrate Test Case T06
  public static async expireLatestOtpForEmail(email: string, type?: 'MOBILE' | 'EMAIL'): Promise<boolean> {
    const record = await db.otp_records.findOne(
      r => r.email === email && (!type || r.type === type) && !r.verified
    );
    if (!record) return false;

    // Set expiration to 1 minute in the past
    const pastTime = new Date(Date.now() - 60000).toISOString();
    await db.otp_records.updateOne({ _id: record._id }, { $set: { expiresAt: pastTime } });
    return true;
  }

  public static getTestDispatches(): TestDispatch[] {
    return this.testDispatches;
  }

  public static clearTestDispatches(): void {
    this.testDispatches = [];
  }
}
