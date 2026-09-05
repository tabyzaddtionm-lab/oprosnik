import { NextRequest, NextResponse } from "next/server";

import { calculateAnalytics } from "@questionhub/core/analytics";
import { OWNER_COOKIE, verifyOwnerToken } from "@questionhub/core/auth";
import { getCycle, loadReport, loadResponses } from "@questionhub/core/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyOwnerToken(request.cookies.get(OWNER_COOKIE)?.value)) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  try {
    const [responses, report] = await Promise.all([loadResponses(), loadReport()]);
    return NextResponse.json(
      {
        cycle: getCycle(),
        analytics: calculateAnalytics(responses),
        report,
        responses,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Results loading failed", error);
    const message = error instanceof Error && error.message.includes("DATABASE_URL")
      ? "База данных ещё не подключена"
      : "Не удалось загрузить результаты";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

