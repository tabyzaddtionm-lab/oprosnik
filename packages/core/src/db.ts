import { Pool, type PoolClient } from "pg";

import type { StoredResponse } from "./analytics";
import type { SurveyAnswers } from "./survey";

declare global {
  var questionhubPool: Pool | undefined;
}

function getConnectionString(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL не настроен");
  return value;
}

export function getCycle(): string {
  return process.env.SURVEY_CYCLE?.trim() || "default";
}

export function getPool(): Pool {
  if (!global.questionhubPool) {
    const connectionString = getConnectionString();
    const isLocalDatabase = /(?:localhost|127\.0\.0\.1|\[::1\])/i.test(connectionString);
    global.questionhubPool = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
    });
  }
  return global.questionhubPool;
}

export async function ensureSchema(client?: PoolClient): Promise<void> {
  const db = client ?? getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS survey_responses (
      id BIGSERIAL PRIMARY KEY,
      cycle TEXT NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      answers JSONB NOT NULL,
      free_text JSONB NOT NULL DEFAULT '{}'::jsonb,
      score_average NUMERIC(4,2),
      ai_status TEXT NOT NULL DEFAULT 'pending',
      ai_sentiment TEXT,
      ai_themes JSONB NOT NULL DEFAULT '[]'::jsonb,
      ai_digest TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_survey_responses_cycle_submitted
      ON survey_responses (cycle, submitted_at DESC);

    CREATE INDEX IF NOT EXISTS idx_survey_responses_ai_status
      ON survey_responses (cycle, ai_status);

    CREATE TABLE IF NOT EXISTS survey_reports (
      cycle TEXT PRIMARY KEY,
      summary TEXT NOT NULL DEFAULT '',
      strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
      concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
      recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
      themes JSONB NOT NULL DEFAULT '[]'::jsonb,
      processed_responses INTEGER NOT NULL DEFAULT 0,
      provider TEXT,
      updated_at TIMESTAMPTZ
    );
  `);
}

export interface SurveyReportRecord {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  themes: { name: string; sentiment: string; count: number }[];
  processedResponses: number;
  provider: string | null;
  updatedAt: string | null;
}

function jsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function insertResponse(input: {
  answers: SurveyAnswers;
  freeText: Record<string, string>;
  scoreAverage: number | null;
}): Promise<number> {
  const pool = getPool();
  await ensureSchema();
  const hasFreeText = Object.values(input.freeText).some((value) => value.trim().length > 0);
  const result = await pool.query<{ id: string }>(
    `INSERT INTO survey_responses
      (cycle, answers, free_text, score_average, ai_status)
     VALUES ($1, $2::jsonb, $3::jsonb, $4, $5)
     RETURNING id`,
    [
      getCycle(),
      JSON.stringify(input.answers),
      JSON.stringify(input.freeText),
      input.scoreAverage,
      hasFreeText ? "pending" : "not_required",
    ],
  );
  return Number(result.rows[0].id);
}

export async function loadResponses(cycle = getCycle()): Promise<StoredResponse[]> {
  const pool = getPool();
  await ensureSchema();
  const result = await pool.query<{
    id: string;
    submitted_at: Date;
    answers: SurveyAnswers;
    free_text: Record<string, string>;
    score_average: string | null;
    ai_status: string;
    ai_sentiment: string | null;
    ai_themes: string[];
    ai_digest: string | null;
  }>(
    `SELECT id, submitted_at, answers, free_text, score_average,
            ai_status, ai_sentiment, ai_themes, ai_digest
       FROM survey_responses
      WHERE cycle = $1
      ORDER BY submitted_at DESC, id DESC`,
    [cycle],
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    submittedAt: row.submitted_at.toISOString(),
    answers: row.answers ?? {},
    freeText: row.free_text ?? {},
    scoreAverage: row.score_average === null ? null : Number(row.score_average),
    aiStatus: row.ai_status,
    aiSentiment: row.ai_sentiment,
    aiThemes: jsonArray<string>(row.ai_themes),
    aiDigest: row.ai_digest,
  }));
}

export async function loadReport(cycle = getCycle()): Promise<SurveyReportRecord> {
  const pool = getPool();
  await ensureSchema();
  const result = await pool.query<{
    summary: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
    themes: { name: string; sentiment: string; count: number }[];
    processed_responses: number;
    provider: string | null;
    updated_at: Date | null;
  }>(
    `SELECT summary, strengths, concerns, recommendations, themes,
            processed_responses, provider, updated_at
       FROM survey_reports
      WHERE cycle = $1`,
    [cycle],
  );

  const row = result.rows[0];
  if (!row) {
    return {
      summary: "",
      strengths: [],
      concerns: [],
      recommendations: [],
      themes: [],
      processedResponses: 0,
      provider: null,
      updatedAt: null,
    };
  }

  return {
    summary: row.summary,
    strengths: jsonArray<string>(row.strengths),
    concerns: jsonArray<string>(row.concerns),
    recommendations: jsonArray<string>(row.recommendations),
    themes: jsonArray<{ name: string; sentiment: string; count: number }>(row.themes),
    processedResponses: row.processed_responses,
    provider: row.provider,
    updatedAt: row.updated_at?.toISOString() ?? null,
  };
}

