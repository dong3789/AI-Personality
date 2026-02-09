import Database from 'better-sqlite3';
import path from 'path';
import type { AnalysisJob, AnalysisResult } from './types';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database.sqlite');

let db: Database.Database | null = null;

/**
 * 데이터베이스 초기화
 */
export function initDatabase(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);

  // jobs 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      github_url TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      error TEXT
    )
  `);

  // results 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      repo_url TEXT NOT NULL,
      email TEXT NOT NULL,
      result_json TEXT NOT NULL,
      repo_data_json TEXT NOT NULL,
      analyzed_at TEXT NOT NULL,
      share_url TEXT NOT NULL
    )
  `);

  // 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_jobs_email ON jobs(email);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_results_email ON results(email);
  `);

  return db;
}

/**
 * 데이터베이스 가져오기
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Job 생성
 */
export function createJob(job: AnalysisJob): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO jobs (id, github_url, email, status, created_at, completed_at, error)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    job.id,
    job.githubUrl,
    job.email,
    job.status,
    job.createdAt,
    job.completedAt || null,
    job.error || null
  );
}

/**
 * Job 조회
 */
export function getJob(id: string): (AnalysisJob & { resultId?: string }) | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    githubUrl: row.github_url,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    error: row.error,
    resultId: row.result_id,
  };
}

/**
 * Job 상태 업데이트
 */
export function updateJobStatus(
  id: string,
  status: AnalysisJob['status'],
  error?: string
): void {
  const db = getDatabase();
  const completedAt = status === 'completed' || status === 'failed' ? new Date().toISOString() : null;

  const stmt = db.prepare(`
    UPDATE jobs
    SET status = ?, completed_at = ?, error = ?
    WHERE id = ?
  `);

  stmt.run(status, completedAt, error || null, id);
}

/**
 * 대기 중인 Job 목록
 */
export function getPendingJobs(): AnalysisJob[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM jobs WHERE status = ? ORDER BY created_at ASC');
  const rows = stmt.all('pending') as any[];

  return rows.map((row) => ({
    id: row.id,
    githubUrl: row.github_url,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    error: row.error,
  }));
}

/**
 * 결과 저장
 */
export function saveResult(result: AnalysisResult): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO results (id, repo_url, email, result_json, repo_data_json, analyzed_at, share_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    result.id,
    result.repoUrl,
    result.email,
    JSON.stringify(result.result),
    JSON.stringify(result.repoData),
    result.analyzedAt,
    result.shareUrl
  );
}

/**
 * Job에 결과 ID 연결
 */
export function linkJobToResult(jobId: string, resultId: string): void {
  const db = getDatabase();

  // jobs 테이블에 result_id 컬럼 추가 (없으면)
  try {
    db.exec(`ALTER TABLE jobs ADD COLUMN result_id TEXT`);
  } catch (e) {
    // 이미 존재하면 무시
  }

  const stmt = db.prepare(`UPDATE jobs SET result_id = ? WHERE id = ?`);
  stmt.run(resultId, jobId);
}

/**
 * 결과 조회
 */
export function getResult(id: string): AnalysisResult | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM results WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    repoUrl: row.repo_url,
    email: row.email,
    result: JSON.parse(row.result_json),
    repoData: JSON.parse(row.repo_data_json),
    analyzedAt: row.analyzed_at,
    shareUrl: row.share_url,
  };
}

/**
 * 이메일로 결과 조회
 */
export function getResultsByEmail(email: string): AnalysisResult[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM results WHERE email = ? ORDER BY analyzed_at DESC');
  const rows = stmt.all(email) as any[];

  return rows.map((row) => ({
    id: row.id,
    repoUrl: row.repo_url,
    email: row.email,
    result: JSON.parse(row.result_json),
    repoData: JSON.parse(row.repo_data_json),
    analyzedAt: row.analyzed_at,
    shareUrl: row.share_url,
  }));
}

/**
 * 데이터베이스 닫기
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
