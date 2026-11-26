import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examinations, examQuestions, examAttempts } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const examId = parseInt(params.id);
    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    const [exam] = await db
      .select()
      .from(examinations)
      .where(eq(examinations.id, examId))
      .limit(1);

    if (!exam) {
      return NextResponse.json({ error: "Examination not found" }, { status: 404 });
    }

    // Question count
    const [qCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId));

    // Existing attempts
    const attempts = await db
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, user.id)));

    const inProgress = attempts.find((a) => a.status === "in_progress");
    const canAttempt = !inProgress && attempts.length < exam.maxAttempts;

    return NextResponse.json({
      exam,
      questionCount: Number(qCount?.count || 0),
      usedAttempts: attempts.length,
      maxAttempts: exam.maxAttempts,
      canAttempt,
      inProgressAttemptId: inProgress ? inProgress.id : null,
      previousAttempts: attempts,
    });
  } catch (error) {
    console.error("Exam details error:", error);
    return NextResponse.json({ error: "Failed to fetch examination details" }, { status: 500 });
  }
}
