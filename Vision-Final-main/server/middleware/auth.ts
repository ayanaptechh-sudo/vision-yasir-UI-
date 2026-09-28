import { Request, Response, NextFunction } from 'express';
import { db, UserDoc, SessionDoc } from '../database/db';
import { AuditService } from '../services/auditService';

export interface AuthenticatedRequest extends Request {
  user?: UserDoc;
  session?: SessionDoc;
}

export async function authenticateSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-session-token'] as string);

  if (!token) {
    res.status(401).json({
      error: 'Authentication token required.',
      code: 'UNAUTHENTICATED'
    });
    return;
  }

  const session = await db.sessions.findOne({ token, isValid: true });
  if (!session) {
    res.status(401).json({
      error: 'Your session has expired. Please log in again.',
      code: 'SESSION_INVALID'
    });
    return;
  }

  // Check expiration
  if (new Date() > new Date(session.expiresAt)) {
    await db.sessions.updateOne({ _id: session._id }, { isValid: false });
    await AuditService.logAuthEvent({
      userEmail: session.email,
      role: session.role,
      event: 'SESSION_EXPIRED',
      factor: 'SESSION',
      action: 'VALIDATE_SESSION',
      result: 'EXPIRED',
      details: 'Session token expired by timeout policy.',
      sessionId: session.token,
    });

    res.status(401).json({
      error: 'Your session has expired. Please log in again.',
      code: 'SESSION_EXPIRED'
    });
    return;
  }

  const user = await db.users.findOne({ email: session.email });
  if (!user || user.status === 'DISABLED') {
    res.status(403).json({
      error: 'Account is inactive or disabled.',
      code: 'ACCOUNT_DISABLED'
    });
    return;
  }

  req.user = user;
  req.session = session;
  next();
}

export function requireRole(allowedRoles: Array<'STUDENT' | 'TEACHER' | 'ADMINISTRATOR'>) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.session) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      await AuditService.logAuthEvent({
        userEmail: req.user.email,
        role: req.user.role,
        event: 'ROLE_VIOLATION',
        factor: 'SESSION',
        action: `ACCESS_${req.method}_${req.originalUrl}`,
        result: 'UNAUTHORIZED',
        details: `Role ${req.user.role} attempted unauthorized access to resource requiring [${allowedRoles.join(', ')}].`,
        sessionId: req.session.token,
        ipAddress: req.ip,
      });

      res.status(403).json({
        error: 'You are not authorized to access this resource.',
        code: 'UNAUTHORIZED_ROLE',
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
      return;
    }

    next();
  };
}
