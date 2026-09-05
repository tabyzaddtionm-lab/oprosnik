import assert from "node:assert/strict";
import test from "node:test";

import { maskSensitiveText, parseAiReport } from "./ai";

test("maskSensitiveText hides direct contacts before AI", () => {
  const result = maskSensitiveText("Позвоните +7 777 123 45 67 или test@example.com");
  assert.equal(result, "Позвоните [телефон скрыт] или [email скрыт]");
});

test("parseAiReport accepts fenced JSON and filters unknown ids", () => {
  const result = parseAiReport(
    '```json\n{"summary":"Итог","strengths":["Запись"],"concerns":[],"recommendations":[],"themes":[],"items":[{"id":4,"sentiment":"positive","themes":["Запись"],"digest":"Удобно"},{"id":9,"sentiment":"negative"}]}\n```',
    new Set([4]),
  );
  assert.equal(result.summary, "Итог");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, 4);
});


