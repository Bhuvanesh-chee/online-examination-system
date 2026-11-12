import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts, studentAnswers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attemptId = parseInt(params.id);
    if (isNaN(attemptId)) {
      return NextResponse.json({ error: "Invalid attempt ID" }, { status: 400 });
    }

    // Verify attempt ownership & status
    const [attempt] = await db
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.studentId, user.id)))
      .limit(1);

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status !== "in_progress") {
      return NextResponse.json(
        { error: "Examination has already been submitted or concluded" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { questionId, selectedOption, descriptiveAnswer, isMarkedForReview } = body;

    if (!questionId) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    // Check if record exists
    const [existing] = await db
      .select()
      .from(studentAnswers)
      .where(
        and(
          eq(studentAnswers.attemptId, attemptId),
          eq(studentAnswers.questionId, Number(questionId))
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(studentAnswers)
        .set({
          selectedOption: selectedOption !== undefined ? selectedOption : existing.selectedOption,
          descriptiveAnswer:
            descriptiveAnswer !== undefined ? descriptiveAnswer : existing.descriptiveAnswer,
          isMarkedForReview:
            isMarkedForReview !== undefined ? Boolean(isMarkedForReview) : existing.isMarkedForReview,
          answeredAt: new Date(),
        })
        .where(eq(studentAnswers.id, existing.id));
    } else {
      await db.insert(studentAnswers).values({
        attemptId,
        questionId: Number(questionId),
        selectedOption: selectedOption || null,
        descriptiveAnswer: descriptiveAnswer || null,
        isMarkedForReview: Boolean(isMarkedForReview),
        answeredAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, savedAt: new Date() });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
