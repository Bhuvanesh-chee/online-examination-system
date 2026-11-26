import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setSessionCookie, issueAccessToken } from "@/lib/auth";
import { databaseIssueResponse, getDatabaseIssue } from "@/lib/database-status";
import { originGuard } from "@/lib/origin-guard";
import { clearLoginFailures, loginRateLimit, recordLoginFailure } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const blocked = originGuard(request);
  if (blocked) return blocked;

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

    const rateKey = `${email}|${clientIp(request)}`;
    const rate = loginRateLimit(rateKey);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Too many failed sign-in attempts. Please wait a few minutes and try again.",
          code: "RATE_LIMITED",
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { db } = await import("@/db");
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      recordLoginFailure(rateKey);
      return NextResponse.json(
        {
          error: "Invalid email address or password. Please try again.",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    if (!(await bcrypt.compare(password, user.password))) {
      recordLoginFailure(rateKey);
      return NextResponse.json(
        { error: "Incorrect password. Please try again.", code: "BAD_PASSWORD" },
        { status: 401 }
      );
    }

    // Admin accounts bypass approval checks entirely.
    if (user.role !== "admin") {
      if (user.approvalStatus === "rejected") {
        return NextResponse.json(
          {
            error: "Your account request was rejected. Please contact the administrator.",
            code: "ACCOUNT_REJECTED",
          },
          { status: 403 }
        );
      }

      if (user.approvalStatus === "pending") {
        return NextResponse.json(
          {
            error: "Your account is awaiting administrator approval. Please try again once you have been approved.",
            code: "PENDING_APPROVAL",
          },
          { status: 403 }
        );
      }
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
          error: `This account is registered as a ${user.role}.`,
          code: "ROLE_MISMATCH",
        },
        { status: 403 }
      );
    }

    if (user.role !== "admin" && user.role !== "student" && user.role !== "teacher") {
      return NextResponse.json(
        { error: "This account does not have a valid role. Please contact the administrator.", code: "INVALID_ROLE" },
        { status: 403 }
      );
    }

    clearLoginFailures(rateKey);
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
