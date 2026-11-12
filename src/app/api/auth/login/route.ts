import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setSessionCookie, issueAccessToken } from "@/lib/auth";
import { databaseIssueResponse, getDatabaseIssue } from "@/lib/database-status";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const configurationIssue = getDatabaseIssue();
  if (configurationIssue) return databaseIssueResponse(configurationIssue);

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request format. Please reload and retry.", code: "BAD_JSON" },
        { status: 400 }
      );
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? body.role : undefined;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter both your email address and password.", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const { db } = await import("@/db");
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return NextResponse.json(
        {
          error: "No account found with that email address. If you are new here, create a student account first.",
          code: "NOT_FOUND",
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          error: "This account has been deactivated. Please contact your administrator.",
          code: "INACTIVE",
        },
        { status: 403 }
      );
    }

    if (role && user.role !== role) {
      return NextResponse.json(
        {
          error: `This account is registered as a ${user.role}. Switch the role tab and try again.`,
          code: "ROLE_MISMATCH",
        },
        { status: 403 }
      );
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again.", code: "BAD_PASSWORD" },
        { status: 401 }
      );
    }

    await setSessionCookie(user.id);
    return NextResponse.json(
      {
        success: true,
        accessToken: issueAccessToken(user.id),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          department: user.department,
          avatarUrl: user.avatarUrl,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Login API error:", error);
    const databaseIssue = getDatabaseIssue(error);
    if (databaseIssue) return databaseIssueResponse(databaseIssue);
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
