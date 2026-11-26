import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Demo quick-login is permanently disabled. It bypassed administrator
 * approval and must never be reachable in the secured portal.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Demo sign-in is disabled. Please sign in with an administrator-approved account.", code: "DEMO_DISABLED" },
    { status: 410 }
  );
}
