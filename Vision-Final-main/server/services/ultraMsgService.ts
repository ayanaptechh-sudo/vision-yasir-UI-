import { AuditService } from './auditService';

export interface UltraMsgSendResult {
  success: boolean;
  status: 'SENT' | 'SIMULATED' | 'FAILED' | 'NOT_CONFIGURED';
  provider: 'UltraMsg WhatsApp Gateway';
  messageId?: string;
  error?: string;
}

export class UltraMsgService {
  private static getInstanceId(): string | undefined {
    return process.env.ULTRAMSG_INSTANCE_ID?.trim();
  }

  private static getToken(): string | undefined {
    return process.env.ULTRAMSG_TOKEN?.trim();
  }

  public static isConfigured(): boolean {
    const instanceId = this.getInstanceId();
    const token = this.getToken();
    return Boolean(instanceId && token && instanceId.length > 0 && token.length > 0);
  }

  public static getSafeStatus(): { configured: boolean; provider: string; instanceIdMasked?: string } {
    const instanceId = this.getInstanceId();
    return {
      configured: this.isConfigured(),
      provider: 'UltraMsg WhatsApp Gateway (Out-of-Band Mobile OTP)',
      instanceIdMasked: instanceId ? `${instanceId.substring(0, 3)}••••` : undefined,
    };
  }

  /**
   * Dispatches WhatsApp OTP message via UltraMsg REST API.
   * Note: NEVER logs the token or the OTP code per SRS security requirements.
   */
  public static async sendWhatsAppOtp(
    recipientPhone: string,
    otpCode: string,
    recipientEmail: string,
    expiryMinutes: number = 5
  ): Promise<UltraMsgSendResult> {
    const instanceId = this.getInstanceId();
    const token = this.getToken();

    // Normalize phone number: e.g. "+92 370 9001226" -> "923709001226"
    const cleanedPhone = recipientPhone.replace(/\D/g, '');

    if (!instanceId || !token) {
      // Safe audit without leaking token or OTP
      await AuditService.logAuthEvent({
        userEmail: recipientEmail,
        event: 'OTP_DISPATCH_NOTICE',
        factor: 'MOBILE_OTP',
        action: 'DISPATCH_WHATSAPP_ULTRAMSG',
        result: 'SUCCESS',
        details: `UltraMsg credentials not configured in environment. Using in-memory test stream for recipient ending in ...${cleanedPhone.slice(-4)}.`,
      });

      return {
        success: false,
        status: 'NOT_CONFIGURED',
        provider: 'UltraMsg WhatsApp Gateway',
        error: 'UltraMsg instance ID or token is not configured in .env (ULTRAMSG_INSTANCE_ID, ULTRAMSG_TOKEN).',
      };
    }

    const messageBody = `*AuthShield 360 Verification Code*\n\nYour One-Time Password (OTP) is: *${otpCode}*\n\n⏱ Valid for ${expiryMinutes} minutes.\n🛡️ Do NOT share this code with anyone.`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const endpoint = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token,
          to: cleanedPhone,
          body: messageBody,
          priority: '10',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (response.ok && (data?.sent === 'true' || data?.id)) {
        await AuditService.logAuthEvent({
          userEmail: recipientEmail,
          event: 'OTP_SENT',
          factor: 'MOBILE_OTP',
          action: 'DISPATCH_WHATSAPP_ULTRAMSG',
          result: 'SUCCESS',
          details: `WhatsApp OTP delivered successfully via UltraMsg to recipient ending in ...${cleanedPhone.slice(-4)}. Message ID: ${data?.id || 'OK'}`,
        });

        return {
          success: true,
          status: 'SENT',
          provider: 'UltraMsg WhatsApp Gateway',
          messageId: String(data?.id || 'delivered'),
        };
      } else {
        const errorDetail = data?.error || `HTTP ${response.status}: Failed to dispatch WhatsApp OTP`;
        await AuditService.logAuthEvent({
          userEmail: recipientEmail,
          event: 'OTP_DISPATCH_ERROR',
          factor: 'MOBILE_OTP',
          action: 'DISPATCH_WHATSAPP_ULTRAMSG',
          result: 'FAILED',
          details: `UltraMsg API returned failure: ${typeof errorDetail === 'string' ? errorDetail : 'Unknown error'}.`,
        });

        return {
          success: false,
          status: 'FAILED',
          provider: 'UltraMsg WhatsApp Gateway',
          error: typeof errorDetail === 'string' ? errorDetail : 'UltraMsg API rejected message.',
        };
      }
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError';
      const safeError = isTimeout ? 'UltraMsg API connection timed out (8s limit).' : 'Failed to reach UltraMsg gateway.';

      await AuditService.logAuthEvent({
        userEmail: recipientEmail,
        event: 'OTP_DISPATCH_ERROR',
        factor: 'MOBILE_OTP',
        action: 'DISPATCH_WHATSAPP_ULTRAMSG',
        result: 'FAILED',
        details: safeError,
      });

      return {
        success: false,
        status: 'FAILED',
        provider: 'UltraMsg WhatsApp Gateway',
        error: safeError,
      };
    }
  }
}
