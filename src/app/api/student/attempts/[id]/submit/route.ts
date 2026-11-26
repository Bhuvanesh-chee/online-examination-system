import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { originGuard } from "@/lib/origin-guard";
import { finalizeAttempt } from "@/lib/exam-session";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const blocked = originGuard(request);
  if (blocked) return blocked;

  try {
    const params = await props.params;
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attemptId = Number(params.id);
    if (!Number.isInteger(attemptId) || attemptId <= 0) {
      return NextResponse.json({ error: "Invalid attempt ID" }, { status: 400 });
    }

    const [attempt] = await db
      .select({ id: examAttempts.id })
      .from(examAttempts)
      .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.studentId, user.id)))
      .limit(1);

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const result = await finalizeAttempt(attemptId, "submitted");

    return NextResponse.json({
      success: true,
      ...result,
      timeExpired: result.expired,
      alreadySubmitted: result.alreadyFinalized,
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    return NextResponse.json({ error: "Failed to submit examination" }, { status: 500 });
  }
}
