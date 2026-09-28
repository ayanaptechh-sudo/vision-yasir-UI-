import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AdminController } from '../controllers/adminController';
import { LogsController } from '../controllers/logsController';
import { TestMatrixController } from '../controllers/testMatrixController';
import { ComparisonController } from '../controllers/comparisonController';
import { PortalController } from '../controllers/portalController';
import { authenticateSession, requireRole } from '../middleware/auth';

const router = Router();

// --- Authentication Endpoints ---
router.get('/auth/settings', AuthController.getSystemSettings);
router.post('/auth/mode', AuthController.setAuthMode);
router.post('/auth/login-step-1', AuthController.loginStep1);
router.post('/auth/verify-mobile-otp', AuthController.verifyMobileOtp);
router.post('/auth/verify-email-otp', AuthController.verifyEmailOtp);
router.post('/auth/resend-otp', AuthController.resendOtp);
router.post('/auth/expire-otp-test', AuthController.expireOtpForTesting);
router.get('/auth/test-dispatches', AuthController.getTestDispatches);
router.post('/auth/logout', authenticateSession, AuthController.logout);
router.get('/auth/me', authenticateSession, AuthController.getCurrentUser);
router.post('/auth/forgot-password', AuthController.requestPasswordReset);
router.post('/auth/reset-password', AuthController.completePasswordReset);

// --- Public Support Ticket Submission ---
router.post('/support/submit', AuthController.submitSupportTicket);

// --- User Management (Admin Only) ---
router.get('/admin/users', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.listUsers);
router.post('/admin/user/create', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.createUser);
router.post('/admin/user/update', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.updateUser);
router.post('/admin/user/password-reset', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.adminResetPassword);
router.post('/admin/user/suspend', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.suspendUser);
router.post('/admin/user/ban', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.banUser);
router.post('/admin/user/unban', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.unbanUser);
router.post('/admin/user/delete', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.deleteUser);
router.post('/admin/user/role', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.updateUserRole);
router.post('/admin/user/status', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.toggleUserStatus);
router.post('/admin/user/unlock', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.unlockUser);
router.post('/admin/settings', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.updateSystemConfig);
router.post('/admin/reset-demo', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.resetDemonstration);

// --- Active Session Management (Admin Only - Section 16) ---
router.get('/admin/sessions', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.listActiveSessions);
router.post('/admin/session/revoke', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.revokeSession);

// --- Support / Complaint System (Admin Only - Section 18) ---
router.get('/admin/tickets', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.listSupportTickets);
router.post('/admin/ticket/status', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.updateTicketStatus);

// --- Security Alerts & System Report (Admin Only - Section 26 & 42) ---
router.get('/admin/alerts', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.listSecurityAlerts);
router.post('/admin/alert/ack', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.acknowledgeAlert);
router.get('/admin/report', authenticateSession, requireRole(['ADMINISTRATOR']), AdminController.getSystemReport);

// --- Security & Audit Logs ---
router.get('/logs', authenticateSession, requireRole(['ADMINISTRATOR', 'TEACHER']), LogsController.getLogs);
router.get('/logs/metrics', authenticateSession, requireRole(['ADMINISTRATOR', 'TEACHER']), LogsController.getSecurityMetrics);
router.get('/logs/export', authenticateSession, requireRole(['ADMINISTRATOR']), LogsController.exportLogs);

// --- Identity Security Test Matrix ---
router.get('/matrix', TestMatrixController.getMatrix);
router.post('/matrix/run/:testId', authenticateSession, requireRole(['ADMINISTRATOR']), TestMatrixController.runSingleTestEndpoint);
router.post('/matrix/run-all', authenticateSession, requireRole(['ADMINISTRATOR']), TestMatrixController.runAllTestsEndpoint);
router.post('/matrix/manual', authenticateSession, requireRole(['ADMINISTRATOR']), TestMatrixController.updateManualTest);

// --- Authentication Comparison Benchmark ---
router.get('/comparison', ComparisonController.getComparisonData);
router.post('/comparison/benchmark', authenticateSession, requireRole(['ADMINISTRATOR']), ComparisonController.runBenchmark);

// --- Academic Portal Endpoints with Server-Side RBAC Enforcement ---
router.get('/portal/student', authenticateSession, requireRole(['STUDENT', 'TEACHER', 'ADMINISTRATOR']), PortalController.getStudentDashboard);
router.post('/portal/student/submit-assignment', authenticateSession, requireRole(['STUDENT']), PortalController.submitAssignment);

// Strictly Teacher & Admin (Students attempting this get 403 Forbidden UNAUTHORIZED_ROLE)
router.get('/portal/teacher', authenticateSession, requireRole(['TEACHER', 'ADMINISTRATOR']), PortalController.getTeacherDashboard);
router.post('/portal/teacher/grade', authenticateSession, requireRole(['TEACHER', 'ADMINISTRATOR']), PortalController.updateGrade);

// Strictly Administrator (Students & Teachers attempting this get 403 Forbidden UNAUTHORIZED_ROLE)
router.get('/portal/admin/privileged-probe', authenticateSession, requireRole(['ADMINISTRATOR']), PortalController.privilegedAdminAction);

export default router;
