import { db, AuthLogDoc, SecurityEventDoc } from '../database/db';

export class AuditService {
  public static async logAuthEvent(params: {
    userEmail: string;
    role?: string;
    event: string;
    factor: 'PASSWORD' | 'MOBILE_OTP' | 'EMAIL_OTP' | 'SESSION' | 'SYSTEM';
    action: string;
    result: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'LOCKED' | 'UNAUTHORIZED';
    details: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<AuthLogDoc> {
    const timestamp = new Date().toISOString();
    
    // Strict sanitization: ensure no passwords, otp secrets or tokens are in details
    let safeDetails = params.details;
    safeDetails = safeDetails.replace(/(password|secret|token|auth_key)=([^\s&]+)/gi, '$1=[REDACTED]');

    const logEntry = await db.authentication_logs.insertOne({
      timestamp,
      userEmail: params.userEmail,
      role: params.role || 'UNAUTHENTICATED',
      event: params.event,
      factor: params.factor,
      action: params.action,
      result: params.result,
      details: safeDetails,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'Unknown Client',
      sessionId: params.sessionId ? params.sessionId.slice(0, 8) + '•••' : undefined,
    });

    // Check if security event is warranted (e.g. lockout, unauthorized access)
    if (params.result === 'LOCKED' || params.event === 'ACCOUNT_LOCKED') {
      await db.security_events.insertOne({
        timestamp,
        type: 'LOCKOUT',
        severity: 'HIGH',
        actorEmail: params.userEmail,
        description: `Account lockout enforced for ${params.userEmail} following threshold violation.`,
        resolved: false,
      });
    } else if (params.result === 'UNAUTHORIZED' || params.event === 'UNAUTHORIZED_ACCESS') {
      await db.security_events.insertOne({
        timestamp,
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        actorEmail: params.userEmail,
        description: `RBAC boundary violation attempt: ${params.details}`,
        resolved: false,
      });
    }

    return logEntry;
  }

  public static async logSecurityEvent(params: {
    type: 'BRUTE_FORCE' | 'LOCKOUT' | 'UNAUTHORIZED_ACCESS' | 'MFA_BYPASS_ATTEMPT' | 'SESSION_TAMPERING' | 'CONFIG_CHANGE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    actorEmail: string;
    description: string;
  }): Promise<SecurityEventDoc> {
    return await db.security_events.insertOne({
      timestamp: new Date().toISOString(),
      type: params.type,
      severity: params.severity,
      actorEmail: params.actorEmail,
      description: params.description,
      resolved: false,
    });
  }
}
