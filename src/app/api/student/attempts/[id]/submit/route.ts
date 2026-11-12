import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts, examinations, questions, studentAnswers, examQuestions } from "@/db/schema";
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
        { error: "Examination has already been submitted." },
        { status: 400 }
      );
    }

    const [exam] = await db
      .select()
      .from(examinations)
      .where(eq(examinations.id, attempt.examId))
      .limit(1);

    if (!exam) {
      return NextResponse.json({ error: "Exam definition not found" }, { status: 404 });
    }

    // Get all questions in exam with marks and correct answers
    const examQList = await db
      .select({
        questionId: questions.id,
        type: questions.type,
        correctOption: questions.correctOption,
        marks: examQuestions.marks,
        negativeMarks: questions.negativeMarks,
      })
      .from(examQuestions)
      .innerJoin(questions, eq(examQuestions.questionId, questions.id))
      .where(eq(examQuestions.examId, exam.id));

    // Get all student's answers
    const studentAnsList = await db
      .select()
      .from(studentAnswers)
      .where(eq(studentAnswers.attemptId, attemptId));

    const ansMap = new Map(studentAnsList.map((a) => [a.questionId, a]));

    let mcqScore = 0;
    let hasDescriptive = false;

    for (const q of examQList) {
      const studentAns = ansMap.get(q.questionId);

      if (q.type === "mcq") {
        if (studentAns && studentAns.selectedOption) {
          const isCorrect = studentAns.selectedOption.toLowerCase() === (q.correctOption || "").toLowerCase();
          const marksAwarded = isCorrect ? Number(q.marks) : -Number(q.negativeMarks || 0);

          mcqScore += marksAwarded;

          // Update answer record
          await db
            .update(studentAnswers)
            .set({
              isCorrect,
              marksAwarded,
            })
            .where(eq(studentAnswers.id, studentAns.id));
        }
      } else if (q.type === "descriptive") {
        hasDescriptive = true;
      }
    }

    // mcqScore cannot be lower than 0
    mcqScore = Math.max(0, Math.round(mcqScore * 10) / 10);

    const now = new Date();
    const startTime = new Date(attempt.startTime).getTime();
    const timeSpentSeconds = Math.min(
      exam.durationMinutes * 60,
      Math.max(1, Math.floor((now.getTime() - startTime) / 1000))
    );

    // If there are no descriptive questions, finalize immediately
    const finalStatus = hasDescriptive ? "submitted" : "evaluated";
    const totalScore = mcqScore;
    const isPassed = !hasDescriptive ? totalScore >= exam.passingMarks : false;

    await db
      .update(examAttempts)
      .set({
        status: finalStatus,
        endTime: now,
        timeSpentSeconds,
        mcqScore,
        descriptiveScore: 0,
        totalScore,
        isPassed,
        evaluationNotes: hasDescriptive
          ? "Objective MCQs graded automatically. Descriptive answers pending instructor evaluation."
          : "Automated instant evaluation completed.",
        evaluatedAt: hasDescriptive ? null : now,
      })
      .where(eq(examAttempts.id, attemptId));

    return NextResponse.json({
      success: true,
      attemptId,
      status: finalStatus,
      totalScore,
      mcqScore,
      isPassed,
      hasDescriptive,
      timeSpentSeconds,
      examPassingMarks: exam.passingMarks,
      examTotalMarks: exam.totalMarks,
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    return NextResponse.json({ error: "Failed to submit examination" }, { status: 500 });
  }
}
