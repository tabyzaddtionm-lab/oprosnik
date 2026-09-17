import { REQUIRED_QUESTIONS, SURVEY_QUESTIONS, type SurveyAnswers } from "./survey";

const MAX_BODY_BYTES = 32_000;

export class ValidationError extends Error {}

export function assertBodySize(contentLength: string | null): void {
  const bytes = Number(contentLength || 0);
  if (Number.isFinite(bytes) && bytes > MAX_BODY_BYTES) {
    throw new ValidationError("Ответ слишком большой");
  }
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, maxLength);
}

export function validateSurveyPayload(payload: unknown): {
  answers: SurveyAnswers;
  freeText: Record<string, string>;
} {
  if (!payload || typeof payload !== "object") throw new ValidationError("Некорректный ответ");
  const source = (payload as { answers?: unknown }).answers;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw new ValidationError("Ответы не найдены");
  }

  const raw = source as Record<string, unknown>;
  const answers: SurveyAnswers = {};
  const freeText: Record<string, string> = {};

  for (const question of SURVEY_QUESTIONS) {
    const value = raw[question.id];
    if (question.type === "text") {
      const text = cleanText(value, question.maxLength ?? 1500);
      if (text) freeText[question.id] = text;
      continue;
    }

    if (question.type === "multiple") {
      const valid = new Set(question.options?.map((option) => option.value));
      const values = Array.isArray(value)
        ? [...new Set(value.filter((item): item is string => typeof item === "string" && valid.has(item)))]
        : [];
      const exclusive = values.find((item) => question.exclusiveValues?.includes(item));
      answers[question.id] = exclusive ? [exclusive] : values;
      continue;
    }

    const stringValue = typeof value === "string" ? value : "";
    if (question.type === "rating") {
      const isRating = /^[1-5]$/.test(stringValue);
      const isNotApplicable = question.notApplicable?.value === stringValue;
      if (isRating || isNotApplicable) answers[question.id] = stringValue;
      continue;
    }

    const allowed = new Set(question.options?.map((option) => option.value));
    if (allowed.has(stringValue)) answers[question.id] = stringValue;
  }

  for (const question of REQUIRED_QUESTIONS) {
    const value = question.type === "text" ? freeText[question.id] : answers[question.id];
    const empty = Array.isArray(value) ? value.length === 0 : !value;
    if (empty) throw new ValidationError(`Ответьте на вопрос ${question.number}`);
  }

  return { answers, freeText };
}

