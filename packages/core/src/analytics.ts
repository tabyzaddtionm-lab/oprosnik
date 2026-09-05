import {
  MULTIPLE_QUESTION_IDS,
  QUESTION_BY_ID,
  RATING_QUESTION_IDS,
  type SurveyAnswers,
} from "./survey";

export interface StoredResponse {
  id: number;
  submittedAt: string;
  answers: SurveyAnswers;
  freeText: Record<string, string>;
  scoreAverage: number | null;
  aiStatus: string;
  aiSentiment: string | null;
  aiThemes: string[];
  aiDigest: string | null;
}

export interface RatingMetric {
  questionId: string;
  title: string;
  average: number | null;
  answered: number;
  distribution: Record<string, number>;
}

export interface RankedOption {
  value: string;
  label: string;
  count: number;
  percent: number;
}

export interface SurveyAnalytics {
  total: number;
  overallAverage: number | null;
  mood: { positive: number; neutral: number; negative: number };
  ratings: RatingMetric[];
  multiple: Record<string, RankedOption[]>;
  pendingAi: number;
}

function percent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function calculateScoreAverage(answers: SurveyAnswers): number | null {
  const values = RATING_QUESTION_IDS.map((id) => Number(answers[id]))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5);
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

export function calculateAnalytics(responses: StoredResponse[]): SurveyAnalytics {
  const overallValues = responses
    .map((response) => Number(response.answers.q2))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5);

  const moodCounts = overallValues.reduce(
    (acc, value) => {
      if (value >= 4) acc.positive += 1;
      else if (value === 3) acc.neutral += 1;
      else acc.negative += 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 },
  );

  const ratings = RATING_QUESTION_IDS.map((questionId) => {
    const values = responses
      .map((response) => Number(response.answers[questionId]))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5);
    const distribution: Record<string, number> = {};
    for (let rating = 1; rating <= 5; rating += 1) {
      distribution[String(rating)] = values.filter((value) => value === rating).length;
    }
    return {
      questionId,
      title: QUESTION_BY_ID[questionId].title,
      average:
        values.length === 0
          ? null
          : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100,
      answered: values.length,
      distribution,
    };
  });

  const multiple = Object.fromEntries(
    MULTIPLE_QUESTION_IDS.map((questionId) => {
      const question = QUESTION_BY_ID[questionId];
      const counts = new Map<string, number>();
      for (const response of responses) {
        const values = response.answers[questionId];
        if (!Array.isArray(values)) continue;
        for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      const ranked = (question.options ?? [])
        .map((option) => ({
          value: option.value,
          label: option.label,
          count: counts.get(option.value) ?? 0,
          percent: percent(counts.get(option.value) ?? 0, responses.length),
        }))
        .sort((a, b) => b.count - a.count);
      return [questionId, ranked];
    }),
  );

  return {
    total: responses.length,
    overallAverage:
      overallValues.length === 0
        ? null
        : Math.round((overallValues.reduce((sum, value) => sum + value, 0) / overallValues.length) * 100) / 100,
    mood: {
      positive: percent(moodCounts.positive, overallValues.length),
      neutral: percent(moodCounts.neutral, overallValues.length),
      negative: percent(moodCounts.negative, overallValues.length),
    },
    ratings,
    multiple,
    pendingAi: responses.filter((response) => response.aiStatus === "pending").length,
  };
}

