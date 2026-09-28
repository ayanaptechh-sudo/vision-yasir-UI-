import { Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';

export class PortalController {
  // Student Portal Data (accessible by Student for own records, or Teacher/Admin)
  public static async getStudentDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    let targetEmail = req.user.email;

    // Resource-level authorization: Students can ONLY query their own records
    if (req.user.role === 'STUDENT') {
      const requestedEmail = req.query.studentEmail as string;
      if (requestedEmail && requestedEmail.toLowerCase().trim() !== req.user.email.toLowerCase().trim()) {
        await AuditService.logAuthEvent({
          userEmail: req.user.email,
          role: req.user.role,
          event: 'UNAUTHORIZED_ACCESS',
          factor: 'SESSION',
          action: 'ACCESS_OTHER_STUDENT_RECORD',
          result: 'UNAUTHORIZED',
          details: `Student ${req.user.email} attempted to inspect record of ${requestedEmail}. Blocked by resource ownership policy.`,
          sessionId: req.session?.token,
          ipAddress: req.ip,
        });

        res.status(403).json({
          error: 'Access Denied: You are not authorized to view another student\'s private academic records.',
          code: 'RESOURCE_ACCESS_DENIED',
        });
        return;
      }
      targetEmail = req.user.email;
    } else {
      // Teachers and Admins can query specific student records
      if (req.query.studentEmail) {
        targetEmail = (req.query.studentEmail as string).toLowerCase().trim();
      }
    }

    const record = await db.school_records.findOne({ studentEmail: targetEmail });
    const assignments = await db.assignments.find();
    const examResults = await db.exam_results.find({ studentEmail: targetEmail });

    res.json({
      studentRecord: record || {
        studentId: req.user.studentId || 'STU-2026-9041',
        fullName: req.user.name,
        gradeLevel: 'Senior Undergraduate',
        gpa: 3.88,
        attendanceRate: 97.4,
        major: 'B.S. Cybersecurity Defense',
        advisor: 'Prof. Marcus Vance',
      },
      assignments,
      examResults,
    });
  }

  public static async submitAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user || req.user.role !== 'STUDENT') {
      res.status(403).json({ error: 'Only enrolled students may submit coursework.' });
      return;
    }

    const { assignmentId } = req.body;
    if (!assignmentId) {
      res.status(400).json({ error: 'Assignment ID is required.' });
      return;
    }

    const assignment = await db.assignments.findOne({ _id: assignmentId });
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }

    await db.assignments.updateOne(
      { _id: assignmentId },
      { $set: { status: 'SUBMITTED', updatedAt: new Date().toISOString() } }
    );

    await AuditService.logAuthEvent({
      userEmail: req.user.email,
      role: req.user.role,
      event: 'ASSIGNMENT_SUBMISSION',
      factor: 'SESSION',
      action: 'SUBMIT_ACADEMIC_WORK',
      result: 'SUCCESS',
      details: `Submitted work for ${assignment.courseCode}: ${assignment.title}`,
      sessionId: req.session?.token,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `Assignment "${assignment.title}" submitted successfully for grading.` });
  }

  // Teacher Area Data (strictly Teacher or Admin)
  public static async getTeacherDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user || (req.user.role !== 'TEACHER' && req.user.role !== 'ADMINISTRATOR')) {
      res.status(403).json({ error: 'Only faculty members may access the Teacher Dashboard.' });
      return;
    }

    const students = await db.school_records.find();
    const assignments = await db.assignments.find();
    const examResults = await db.exam_results.find();

    res.json({
      teacherInfo: {
        name: req.user.name,
        department: req.user.department || 'Network Defense & Cryptography',
        coursesTaught: [
          { code: 'SEC-301', name: 'Network Security Fundamentals', enrolledCount: 28 },
          { code: 'SEC-410', name: 'Modern Identity & Authentication', enrolledCount: 24 },
          { code: 'SEC-450', name: 'Ethical Hacking & Penetration Testing', enrolledCount: 19 },
        ],
      },
      students,
      assignments,
      examResults,
    });
  }

  public static async updateGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user || (req.user.role !== 'TEACHER' && req.user.role !== 'ADMINISTRATOR')) {
      res.status(403).json({ error: 'Only faculty and administrators may modify student grades.' });
      return;
    }

    const { assignmentId, score, grade } = req.body;
    if (!assignmentId || score === undefined) {
      res.status(400).json({ error: 'Assignment ID and score are required.' });
      return;
    }

    const assignment = await db.assignments.findOne({ _id: assignmentId });
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }

    await db.assignments.updateOne(
      { _id: assignmentId },
      { $set: { score, grade: grade || 'A', status: 'GRADED', updatedAt: new Date().toISOString() } }
    );

    await AuditService.logAuthEvent({
      userEmail: req.user.email,
      role: req.user.role,
      event: 'GRADE_MODIFICATION',
      factor: 'SESSION',
      action: 'UPDATE_STUDENT_GRADE',
      result: 'SUCCESS',
      details: `Assigned grade ${grade} (${score}/${assignment.maxScore}) for ${assignment.title}.`,
      sessionId: req.session?.token,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Grade updated successfully.' });
  }

  // Student Complaint / Support Access (Private from Teachers)
  // Section 26: Student complaints remain private from Teachers.
  public static async listStudentComplaints(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (req.user.role === 'TEACHER') {
      await AuditService.logAuthEvent({
        userEmail: req.user.email,
        role: req.user.role,
        event: 'COMPLAINT_PRIVACY_VIOLATION',
        factor: 'SESSION',
        action: 'ACCESS_STUDENT_COMPLAINTS',
        result: 'UNAUTHORIZED',
        details: 'Teacher attempted to view private student complaints. Strictly blocked by privacy policy.',
        sessionId: req.session?.token,
        ipAddress: req.ip,
      });

      res.status(403).json({
        error: 'Access Denied: Student complaints are strictly confidential and inaccessible to faculty members.',
        code: 'COMPLAINT_PRIVACY_RESTRICTION',
      });
      return;
    }

    // Students only see their own tickets
    if (req.user.role === 'STUDENT') {
      const tickets = await db.support_tickets.find({ email: req.user.email });
      res.json({ tickets });
      return;
    }

    // Administrators see all tickets
    const tickets = await db.support_tickets.find();
    res.json({ tickets });
  }

  // Admin Privileged Action Probe (strictly Admin)
  public static async privilegedAdminAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Access granted to high-assurance administrator perimeter.',
      timestamp: new Date().toISOString(),
    });
  }
}
