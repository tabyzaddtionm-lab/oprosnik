import assert from "node:assert/strict";
import test from "node:test";

import { calculateAnalytics, calculateScoreAverage, type StoredResponse } from "./analytics";

test("calculateScoreAverage ignores non-rating values", () => {
  assert.equal(
    calculateScoreAverage({ q2: "5", q3: "4", q4: ["booking"], q7: "na" }),
    4.5,
  );
});

test("calculateAnalytics builds deterministic percentages", () => {
  const responses: StoredResponse[] = [
    {
      id: 1,
      submittedAt: "2026-09-04T10:00:00Z",
      answers: { q2: "5", q3: "4", q4: ["booking", "support"] },
      freeText: {},
      scoreAverage: 4.5,
      aiStatus: "processed",
      aiSentiment: "positive",
      aiThemes: [],
      aiDigest: null,
    },
    {
      id: 2,
      submittedAt: "2026-09-04T11:00:00Z",
      answers: { q2: "2", q3: "3", q4: ["booking"] },
      freeText: {},
      scoreAverage: 2.5,
      aiStatus: "pending",
      aiSentiment: null,
      aiThemes: [],
      aiDigest: null,
    },
  ];

  const result = calculateAnalytics(responses);
  assert.equal(result.total, 2);
  assert.equal(result.overallAverage, 3.5);
  assert.deepEqual(result.mood, { positive: 50, neutral: 0, negative: 50 });
  assert.equal(result.multiple.q4[0].label, "Удобство записи");
  assert.equal(result.multiple.q4[0].percent, 100);
  assert.equal(result.pendingAi, 1);
});


