import assert from "node:assert/strict";
import test from "node:test";

import { validateSurveyPayload, ValidationError } from "./validation";

function completeAnswers() {
  return {
    q1: "driving",
    q2: "5",
    q3: "4",
    q4: ["instructor_attitude", "nothing_yet"],
    q5: ["enough", "more_slots"],
    q6: ["none", "time"],
    q7: "na",
    q8: "4",
    q9: "4",
    q10: "5",
    q11: "5",
    q12: "5",
    q13: "4",
    q14: "  Больше вечерних окон.  ",
    q15: "Спасибо",
    unknown: "не сохранять",
  };
}

test("validateSurveyPayload separates free text and honors exclusive choices", () => {
  const result = validateSurveyPayload({ answers: completeAnswers() });
  assert.deepEqual(result.answers.q4, ["nothing_yet"]);
  assert.deepEqual(result.answers.q5, ["enough"]);
  assert.deepEqual(result.answers.q6, ["none"]);
  assert.equal(result.freeText.q14, "Больше вечерних окон.");
  assert.equal(result.freeText.q15, "Спасибо");
  assert.equal(result.answers.unknown, undefined);
});

test("validateSurveyPayload rejects a missing required answer", () => {
  const answers: Record<string, unknown> = completeAnswers();
  delete answers.q14;
  assert.throws(
    () => validateSurveyPayload({ answers }),
    (error) => error instanceof ValidationError && error.message === "Ответьте на вопрос 14",
  );
});


