import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/db';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'FACULTY';
  department_id?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'college_secret_jwt_key_default_2026';

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization header missing or invalid format' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token is invalid or expired' });
  }
}

export function roleGuard(allowedRoles: ('ADMIN' | 'FACULTY')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden: Insufficient permissions for this action' });
      return;
    }

    next();
  };
}

export async function checkFacultyClassAccess(userId: string, userRole: string, classId: string): Promise<boolean> {
  if (userRole === 'ADMIN') return true;
  if (!classId) return false;

  const assignment = await db.queryOne<any>(
    `SELECT fca.id 
     FROM faculty_class_assignments fca
     JOIN classes c ON fca.class_id = c.id
     WHERE fca.faculty_id = ? AND (fca.class_id = ? OR c.name = ? OR c.id = ?)`,
    [userId, classId, classId, classId]
  );
  return !!assignment;
}

export async function getFacultyAssignedClassIds(userId: string): Promise<string[]> {
  const rows = await db.query<any>(
    'SELECT class_id FROM faculty_class_assignments WHERE faculty_id = ?',
    [userId]
  );
  return rows.map(r => r.class_id);
}

export async function verifyExamAccess(userId: string, userRole: string, examId: string): Promise<{ authorized: boolean; classId?: string; error?: string }> {
  if (userRole === 'ADMIN') return { authorized: true };
  if (!examId) return { authorized: false, error: 'Exam ID is required' };

  const exam = await db.queryOne<any>('SELECT id, class_id, department_id FROM exams WHERE id = ?', [examId]);
  if (!exam) {
    return { authorized: false, error: 'Exam not found' };
  }

  if (!exam.class_id) {
    // If legacy exam has no class_id attached, allow if faculty is from that department or admin
    return { authorized: true, classId: undefined };
  }

  const hasAccess = await checkFacultyClassAccess(userId, userRole, exam.class_id);
  if (!hasAccess) {
    return { authorized: false, classId: exam.class_id, error: 'Forbidden: You do not have access to this exam/class' };
  }

  return { authorized: true, classId: exam.class_id };
}

export async function logAudit(userId: string | undefined, action: string, entity: string, entityId?: string | null, details?: any): Promise<void> {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const detailsStr = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;
    await db.execute(
      `INSERT INTO audit_logs (id, user_id, action, entity, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId || null, action, entity, entity, entityId || null, detailsStr]
    );
  } catch (err) {
    console.error('[Audit Log Error]:', err);
  }
}
