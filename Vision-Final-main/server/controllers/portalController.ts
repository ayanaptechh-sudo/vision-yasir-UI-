import { Response } from 'express';
import { db } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';

export class PortalController {
  // Student Portal Data (accessible by Student, Teacher, Admin)
  public static async getStudentDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const email = req.query.studentEmail as string || req.user?.email || 'student@test.local';

    const record = await db.school_records.findOne({ studentEmail: email });
    const assignments = await db.assignments.find();
    const examResults = await db.exam_results.find({ studentEmail: email });

    res.json({
      studentRecord: record || {
        studentId: 'STU-2026-9041',
        fullName: req.user?.name || 'Alex Rivera',
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
      userEmail: req.user?.email || 'student@test.local',
      role: req.user?.role || 'STUDENT',
      event: 'ASSIGNMENT_SUBMISSION',
      factor: 'SESSION',
      action: 'SUBMIT_ACADEMIC_WORK',
      result: 'SUCCESS',
      details: `Submitted work for ${assignment.courseCode}: ${assignment.title}`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: `Assignment "${assignment.title}" submitted successfully for grading.` });
  }

  // Teacher Area Data (strictly Teacher or Admin)
  public static async getTeacherDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const students = await db.school_records.find();
    const assignments = await db.assignments.find();
    const examResults = await db.exam_results.find();

    res.json({
      teacherInfo: {
        name: req.user?.name || 'Prof. Marcus Vance',
        department: req.user?.department || 'Network Defense & Cryptography',
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
      userEmail: req.user?.email || 'teacher@test.local',
      role: req.user?.role || 'TEACHER',
      event: 'GRADE_MODIFICATION',
      factor: 'SESSION',
      action: 'UPDATE_STUDENT_GRADE',
      result: 'SUCCESS',
      details: `Assigned grade ${grade} (${score}/${assignment.maxScore}) for ${assignment.title}.`,
      sessionId: req.session?.token,
    });

    res.json({ success: true, message: 'Grade updated successfully.' });
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
