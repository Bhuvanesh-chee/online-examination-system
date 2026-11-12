import { NextResponse } from "next/server";
import { getSessionUser, clearSessionCookie } from "@/lib/auth";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ?? null }, { headers: NO_STORE });
}

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true }, { headers: NO_STORE });
}
