import { NextRequest, NextResponse } from "next/server";

import {
  createOwnerToken,
  OWNER_COOKIE,
  OWNER_SESSION_MAX_AGE,
  ownerAuthConfigured,
  verifyOwnerPassword,
} from "@questionhub/core/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!ownerAuthConfigured()) {
    return NextResponse.json({ error: "Пароль владельца ещё не настроен" }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!verifyOwnerPassword(password)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(OWNER_COOKIE, createOwnerToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: OWNER_SESSION_MAX_AGE,
  });
  return response;
}

