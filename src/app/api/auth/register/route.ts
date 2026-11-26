import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { databaseIssueResponse, getDatabaseIssue } from "@/lib/database-status";
import { originGuard } from "@/lib/origin-guard";

export const dynamic = "force-dynamic";

const STUDENT_EMAIL_PATTERN = /^\d{10}@kluniversity\.in$/i;

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

    if (!STUDENT_EMAIL_PATTERN.test(rawEmail)) {
      return NextResponse.json(
        {
          error: "Please register using your official KL University student email ID (example: 2500030116@kluniversity.in).",
          code: "INVALID_STUDENT_EMAIL",
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

    try {
      await db.insert(users).values({
        name,
        email: rawEmail,
        password: hashedPassword,
        role: "student",
        studentId: studentId || `STU-${Date.now().toString().slice(-6)}`,
        department: department || "Computer Science and Engineering",
        phone: phone || null,
        isActive: true,
        approvalStatus: "pending",
      });
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

    // A newly registered student never receives a session or access token.
    // They must be approved by an administrator before they can sign in.
    return NextResponse.json(
      {
        success: true,
        pending: true,
        message: "Registration received. An administrator must approve your account before you can sign in.",
      },
      { status: 202, headers: { "Cache-Control": "no-store" } }
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
