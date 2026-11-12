import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { setSessionCookie, issueAccessToken } from "@/lib/auth";
import { databaseIssueResponse, getDatabaseIssue } from "@/lib/database-status";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const configurationIssue = getDatabaseIssue();
  if (configurationIssue) return databaseIssueResponse(configurationIssue);

  try {
    const { role } = await request.json();
    const targetEmail = role === "admin" ? "admin@exam.edu" : "gagireddyramreddy@gmail.com";
    const { db } = await import("@/db");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, targetEmail))
      .limit(1);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Demo account not found. Load the project demo data on this deployment." },
        { status: 404 }
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
    console.error("Quick login error:", error);
    const databaseIssue = getDatabaseIssue(error);
    if (databaseIssue) return databaseIssueResponse(databaseIssue);
    return NextResponse.json({ error: "Failed to perform quick login" }, { status: 500 });
  }
}
