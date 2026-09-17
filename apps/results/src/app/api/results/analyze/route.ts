import { NextRequest, NextResponse } from "next/server";

import { processPendingComments } from "@questionhub/core/ai";
import { OWNER_COOKIE, verifyOwnerToken } from "@questionhub/core/auth";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  if (!verifyOwnerToken(request.cookies.get(OWNER_COOKIE)?.value)) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  try {
    return NextResponse.json(await processPendingComments());
  } catch (error) {
    console.error("Manual AI refresh failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось обновить ИИ-сводку" },
      { status: 503 },
    );
  }
}

