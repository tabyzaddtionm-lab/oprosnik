import { NextResponse } from "next/server";

import { OWNER_COOKIE } from "@questionhub/core/auth";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(OWNER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}

