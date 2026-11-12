import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setSessionCookie, issueAccessToken } from "@/lib/auth";
import { databaseIssueResponse, getDatabaseIssue } from "@/lib/database-status";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const configurationIssue = getDatabaseIssue();
  if (configurationIssue) return databaseIssueResponse(configurationIssue);

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request format. Please reload the page and retry.", code: "BAD_JSON" },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const department = typeof body.department === "string" ? body.department.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!name || !rawEmail || !password) {
      return NextResponse.json(
        { error: "Name, email address and password are all required.", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    if (!EMAIL_PATTERN.test(rawEmail)) {
      return NextResponse.json(
        {
          error: "That email address doesn't look valid. Please check for typos (e.g. name@gmail.com).",
          code: "INVALID_EMAIL",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long.", code: "WEAK_PASSWORD" },
        { status: 400 }
      );
    }

    // The import is deliberately inside the handler. An unconfigured
    // deployment must return the 503 above, not crash while loading this file.
    const { db } = await import("@/db");

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, rawEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        {
          error: "An account with this email address already exists. Please sign in instead.",
          code: "EMAIL_TAKEN",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    let newUser;
    try {
      [newUser] = await db
        .insert(users)
        .values({
          name,
          email: rawEmail,
          password: hashedPassword,
          role: "student",
          studentId: studentId || `STU-${Date.now().toString().slice(-6)}`,
          department: department || "Computer Science and Engineering",
          phone: phone || null,
          isActive: true,
        })
        .returning();
    } catch (dbError) {
      const message = dbError instanceof Error ? dbError.message : "";
      if (/duplicate|unique/i.test(message)) {
        return NextResponse.json(
          {
            error: "An account with this email address already exists. Please sign in instead.",
            code: "EMAIL_TAKEN",
          },
          { status: 409 }
        );
      }
      throw dbError;
    }

    await setSessionCookie(newUser.id);

    return NextResponse.json(
      {
        success: true,
        accessToken: issueAccessToken(newUser.id),
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          studentId: newUser.studentId,
          department: newUser.department,
          avatarUrl: newUser.avatarUrl,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Register API error:", error);
    const databaseIssue = getDatabaseIssue(error);
    if (databaseIssue) return databaseIssueResponse(databaseIssue);
    return NextResponse.json(
      { error: "We couldn't create your account right now. Please try again.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
