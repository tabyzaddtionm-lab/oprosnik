import { NextRequest, NextResponse } from "next/server";

import { processPendingComments } from "@questionhub/core/ai";
import { calculateScoreAverage } from "@questionhub/core/analytics";
import { insertResponse } from "@questionhub/core/db";
import { assertBodySize, validateSurveyPayload, ValidationError } from "@questionhub/core/validation";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    assertBodySize(request.headers.get("content-length"));
    const payload = await request.json();
    const { answers, freeText } = validateSurveyPayload(payload);
    const id = await insertResponse({
      answers,
      freeText,
      scoreAverage: calculateScoreAverage(answers),
    });

    let analysis: Awaited<ReturnType<typeof processPendingComments>> = {
      status: "idle",
      processed: 0,
    };
    try {
      analysis = await processPendingComments();
    } catch (error) {
      console.error("Survey AI processing failed; response is safely stored", error);
    }

    return NextResponse.json({ saved: true, id, analysis }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Некорректный формат данных" }, { status: 400 });
    }
    console.error("Survey submission failed", error);
    const message = error instanceof Error && error.message.includes("DATABASE_URL")
      ? "База данных ещё не подключена"
      : "Не удалось сохранить ответ. Попробуйте ещё раз.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

