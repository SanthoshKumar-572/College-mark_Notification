import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

class DatabaseManager {
  private pgPool: Pool | null = null;
  private sqliteDb: SqlJsDatabase | null = null;
  private sqliteFilePath: string = '';
  private isPostgres: boolean = false;
  private isInitialized: boolean = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    const dbUrl = process.env.DATABASE_URL || 'sqlite:./data/college_sms.sqlite';

    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
      try {
        this.pgPool = new Pool({ connectionString: dbUrl });
        await this.pgPool.query('SELECT 1');
        this.isPostgres = true;
        console.log('[DB] Connected to PostgreSQL successfully.');
        await this.runMigrations();
        this.isInitialized = true;
        return;
      } catch (err: any) {
        console.warn('[DB] Could not connect to PostgreSQL:', err.message);
        console.log('[DB] Falling back to SQLite for local development.');
      }
    }

    // Default to SQLite via sql.js with file persistence
    const SQL = await initSqlJs();
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.sqliteFilePath = path.resolve(dataDir, 'college_sms.sqlite');
    if (fs.existsSync(this.sqliteFilePath)) {
      const fileBuffer = fs.readFileSync(this.sqliteFilePath);
      this.sqliteDb = new SQL.Database(fileBuffer);
      console.log(`[DB] Loaded SQLite database from ${this.sqliteFilePath}`);
    } else {
      this.sqliteDb = new SQL.Database();
      console.log(`[DB] Created new SQLite database in memory, will save to ${this.sqliteFilePath}`);
    }

    this.isPostgres = false;
    await this.runMigrations();
    this.saveSqlite();
    this.isInitialized = true;
  }

  private saveSqlite(): void {
    if (this.sqliteDb && this.sqliteFilePath) {
      const data = this.sqliteDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.sqliteFilePath, buffer);
    }
  }

  private async runMigrations(): Promise<void> {
    if (this.isPostgres && this.pgPool) {
      const schemaPath = path.resolve(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await this.pgPool.query(sql);
      }
    } else if (this.sqliteDb) {
      // Run SQLite DDL
      const sqliteSchema = `
        CREATE TABLE IF NOT EXISTS departments (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS classes (
          id TEXT PRIMARY KEY,
          name TEXT,
          department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
          year TEXT NOT NULL,
          semester TEXT,
          section TEXT NOT NULL,
          academic_year TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('ADMIN', 'FACULTY')),
          department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS faculty_class_assignments (
          id TEXT PRIMARY KEY,
          faculty_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          academic_year TEXT,
          assigned_at TEXT DEFAULT (datetime('now')),
          assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE(faculty_id, class_id, academic_year)
        );

        CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY,
          register_number TEXT NOT NULL,
          name TEXT NOT NULL,
          parent_name TEXT,
          parent_phone TEXT,
          email TEXT,
          class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
          department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
          year TEXT,
          section TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS parents (
          id TEXT PRIMARY KEY,
          student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
          parent_name TEXT NOT NULL,
          mobile_number TEXT NOT NULL,
          whatsapp_number TEXT,
          email TEXT,
          sms_enabled INTEGER DEFAULT 1,
          whatsapp_enabled INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS subjects (
          id TEXT PRIMARY KEY,
          subject_code TEXT UNIQUE NOT NULL,
          subject_name TEXT NOT NULL,
          max_marks REAL DEFAULT 20.0,
          pass_marks REAL DEFAULT 10.0,
          semester TEXT DEFAULT '3',
          department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS exams (
          id TEXT PRIMARY KEY,
          name TEXT,
          exam_name TEXT NOT NULL,
          academic_year TEXT NOT NULL,
          semester TEXT NOT NULL,
          department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
          class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
          created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
          exam_date TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS marks (
          id TEXT PRIMARY KEY,
          exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
          student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
          subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
          marks_obtained REAL NOT NULL,
          max_marks REAL NOT NULL,
          source_file TEXT,
          entered_by TEXT REFERENCES users(id) ON DELETE SET NULL,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          UNIQUE(student_id, subject_id, exam_id)
        );

        CREATE TABLE IF NOT EXISTS uploaded_files (
          id TEXT PRIMARY KEY,
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
          total_rows INTEGER DEFAULT 0,
          valid_rows INTEGER DEFAULT 0,
          error_rows INTEGER DEFAULT 0,
          status TEXT NOT NULL CHECK (status IN ('UPLOADED', 'VALIDATED', 'PROCESSED', 'FAILED')),
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS notification_batches (
          id TEXT PRIMARY KEY,
          exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
          uploaded_file_id TEXT REFERENCES uploaded_files(id) ON DELETE SET NULL,
          created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
          total_notifications INTEGER DEFAULT 0,
          successful_notifications INTEGER DEFAULT 0,
          failed_notifications INTEGER DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'PROCESSING',
          created_at TEXT DEFAULT (datetime('now')),
          completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          batch_id TEXT REFERENCES notification_batches(id) ON DELETE SET NULL,
          student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
          exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
          channel TEXT NOT NULL CHECK (channel IN ('WHATSAPP', 'SMS')),
          recipient TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING')),
          provider_message_id TEXT,
          error_message TEXT,
          retry_count INTEGER DEFAULT 0,
          last_error TEXT,
          last_retry_at TEXT,
          sent_at TEXT,
          delivered_at TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          entity TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          details TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS message_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          channel TEXT NOT NULL DEFAULT 'WHATSAPP',
          template_type TEXT NOT NULL DEFAULT 'MARKS',
          body TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS system_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL DEFAULT '',
          "group" TEXT DEFAULT 'general',
          description TEXT,
          updated_at TEXT DEFAULT (datetime('now'))
        );
      `;
      this.sqliteDb.run(sqliteSchema);

      // Safe column additions for SQLite if database already existed
      try {
        this.sqliteDb.run('ALTER TABLE system_settings ADD COLUMN "group" TEXT DEFAULT \'general\'');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE message_templates ADD COLUMN template_type TEXT DEFAULT \'MARKS\'');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE message_templates ADD COLUMN body TEXT');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE subjects ADD COLUMN pass_marks REAL DEFAULT 10.0');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE subjects ADD COLUMN semester TEXT DEFAULT \'3\'');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE classes ADD COLUMN name TEXT');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE classes ADD COLUMN semester TEXT');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE students ADD COLUMN parent_name TEXT');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE students ADD COLUMN parent_phone TEXT');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE exams ADD COLUMN name TEXT');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE exams ADD COLUMN department_id TEXT');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE exams ADD COLUMN class_id TEXT');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE exams ADD COLUMN created_by TEXT');
      } catch (e) { /* ignore */ }

      try {
        this.sqliteDb.run('ALTER TABLE audit_logs ADD COLUMN entity_type TEXT');
      } catch (e) { /* ignore */ }

      this.saveSqlite();
    }
  }

  // Normalizes parameter placeholders: Postgres uses $1, $2, while sql.js supports arrays with bind
  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.init();

    if (this.isPostgres && this.pgPool) {
      // Ensure params are $1, $2 for Postgres
      let pgSql = sql;
      if (sql.includes('?')) {
        let index = 1;
        pgSql = sql.replace(/\?/g, () => `$${index++}`);
      }
      const res = await this.pgPool.query(pgSql, params);
      return res.rows as T[];
    } else if (this.sqliteDb) {
      // In SQLite, convert $1, $2 to ? if present
      let sqliteSql = sql;
      if (/\$\d+/.test(sql)) {
        sqliteSql = sql.replace(/\$\d+/g, '?');
      }

      try {
        const stmt = this.sqliteDb.prepare(sqliteSql);
        stmt.bind(params);
        const rows: T[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject() as T);
        }
        stmt.free();
        return rows;
      } catch (err: any) {
        console.error(`[DB Query Error] SQL: ${sqliteSql}`, err);
        throw err;
      }
    }

    throw new Error('Database is not initialized');
  }

  public async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  public async execute(sql: string, params: any[] = []): Promise<{ changes: number }> {
    await this.init();

    if (this.isPostgres && this.pgPool) {
      let pgSql = sql;
      if (sql.includes('?')) {
        let index = 1;
        pgSql = sql.replace(/\?/g, () => `$${index++}`);
      }
      const res = await this.pgPool.query(pgSql, params);
      return { changes: res.rowCount || 0 };
    } else if (this.sqliteDb) {
      let sqliteSql = sql;
      if (/\$\d+/.test(sql)) {
        sqliteSql = sql.replace(/\$\d+/g, '?');
      }

      try {
        this.sqliteDb.run(sqliteSql, params);
        const changes = this.sqliteDb.getRowsModified();
        this.saveSqlite();
        return { changes };
      } catch (err: any) {
        console.error(`[DB Execute Error] SQL: ${sqliteSql}`, err);
        throw err;
      }
    }

    throw new Error('Database is not initialized');
  }

  public async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.query<T>(sql, params);
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    return this.queryOne<T>(sql, params);
  }

  public async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
    return this.execute(sql, params);
  }
}

export const db = new DatabaseManager();
