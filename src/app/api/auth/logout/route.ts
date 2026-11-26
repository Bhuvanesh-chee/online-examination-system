import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { originGuard } from "@/lib/origin-guard";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const blocked = originGuard(request);
  if (blocked) return blocked;
  await clearSessionCookie();
  return NextResponse.json(
    { success: true, message: "Signed out successfully" },
    { headers: NO_STORE }
  );
}
