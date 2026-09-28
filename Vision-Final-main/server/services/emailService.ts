import nodemailer from 'nodemailer';
import { AuditService } from './auditService';

export interface EmailSendResult {
  success: boolean;
  status: 'SENT' | 'SIMULATED' | 'FAILED' | 'NOT_CONFIGURED';
  provider: string;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static getGmailUser(): string | undefined {
    return process.env.GMAIL_USER?.trim() || process.env.SMTP_USER?.trim();
  }

  private static getGmailAppPassword(): string | undefined {
    return process.env.GMAIL_APP_PASSWORD?.trim() || process.env.SMTP_PASS?.trim();
  }

  public static isConfigured(): boolean {
    const user = this.getGmailUser();
    const pass = this.getGmailAppPassword();
    return Boolean(user && pass && user.length > 0 && pass.length > 0);
  }

  public static getSafeStatus(): { configured: boolean; provider: string; userMasked?: string } {
    const user = this.getGmailUser();
    let maskedUser: string | undefined;
    if (user) {
      maskedUser = user.replace(/(.{2})(.*)(@.*)/, '$1••••$3');
    }
    return {
      configured: this.isConfigured(),
      provider: 'Gmail / SMTP Transport Layer',
      userMasked: maskedUser,
    };
  }

  /**
   * Dispatches branded Email OTP via Nodemailer with Gmail/SMTP credentials.
   * Note: NEVER logs password or plaintext OTP per SRS requirements.
   */
  public static async sendEmailOtp(
    recipientEmail: string,
    otpCode: string,
    expiryMinutes: number = 5
  ): Promise<EmailSendResult> {
    const user = this.getGmailUser();
    const pass = this.getGmailAppPassword();

    if (!user || !pass) {
      await AuditService.logAuthEvent({
        userEmail: recipientEmail,
        event: 'OTP_DISPATCH_NOTICE',
        factor: 'EMAIL_OTP',
        action: 'DISPATCH_EMAIL_SMTP',
        result: 'SUCCESS',
        details: `Gmail / SMTP credentials not configured in environment. Using in-memory test stream for ${recipientEmail}.`,
      });

      return {
        success: false,
        status: 'NOT_CONFIGURED',
        provider: 'Gmail / SMTP Transport Layer',
        error: 'Gmail credentials not configured in .env (GMAIL_USER, GMAIL_APP_PASSWORD).',
      };
    }

    try {
      // Create transport with short connection timeout
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
      });

      const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b132b; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 1px;">AuthShield 360</h1>
            <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px;">VerifyVault — Identity Beyond Passwords</p>
          </div>
          
          <div style="padding: 32px 24px; background-color: #020617;">
            <p style="font-size: 14px; color: #94a3b8; margin-top: 0;">Step-Up Multi-Factor Verification Challenge</p>
            <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">
              A sign-in attempt was initiated for your institutional account. Please use the verification code below to authorize your session:
            </p>
            
            <div style="margin: 28px 0; text-align: center;">
              <div style="display: inline-block; background-color: #0f172a; border: 2px dashed #38bdf8; border-radius: 12px; padding: 16px 36px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${otpCode}</span>
              </div>
            </div>
            
            <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 24px;">
              ⏱ <strong>Expiration:</strong> This verification code expires in <strong>${expiryMinutes} minutes</strong>.<br>
              🛡️ <strong>Security Warning:</strong> AuthShield 360 staff will NEVER ask for this code. If you did not request this sign-in, please notify your SOC administrator immediately.
            </p>
            
            <div style="border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
              This is an automated security dispatch from the AuthShield 360 Zero-Trust Identity Gateway.
            </div>
          </div>
        </div>
      `;

      const info = await transporter.sendMail({
        from: `"AuthShield 360 Security Gateway" <${user}>`,
        to: recipientEmail,
        subject: `[AuthShield 360] Your Step-Up Verification Code`,
        text: `Your AuthShield 360 Verification Code is: ${otpCode}. Valid for ${expiryMinutes} minutes. Never share this code.`,
        html: htmlBody,
      });

      await AuditService.logAuthEvent({
        userEmail: recipientEmail,
        event: 'OTP_SENT',
        factor: 'EMAIL_OTP',
        action: 'DISPATCH_EMAIL_SMTP',
        result: 'SUCCESS',
        details: `Step-up email OTP dispatched successfully via Gmail SMTP to ${recipientEmail}. Message ID: ${info.messageId}`,
      });

      return {
        success: true,
        status: 'SENT',
        provider: 'Gmail / SMTP Transport Layer',
        messageId: info.messageId,
      };
    } catch (err: any) {
      const safeErrorMsg = err.message || 'SMTP delivery rejected by host';
      await AuditService.logAuthEvent({
        userEmail: recipientEmail,
        event: 'OTP_DISPATCH_ERROR',
        factor: 'EMAIL_OTP',
        action: 'DISPATCH_EMAIL_SMTP',
        result: 'FAILED',
        details: `SMTP dispatch error: ${safeErrorMsg}`,
      });

      return {
        success: false,
        status: 'FAILED',
        provider: 'Gmail / SMTP Transport Layer',
        error: safeErrorMsg,
      };
    }
  }
}
