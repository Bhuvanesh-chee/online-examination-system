import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts, examinations, questions, studentAnswers, examQuestions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attemptIdParam = searchParams.get("attemptId");

    // Single attempt detailed review
    if (attemptIdParam) {
      const attemptId = Number(attemptIdParam);
      if (!Number.isInteger(attemptId) || attemptId <= 0) {
        return NextResponse.json({ error: "Invalid attempt ID" }, { status: 400 });
      }

      const [attempt] = await db
        .select({
          id: examAttempts.id,
          attemptNumber: examAttempts.attemptNumber,
          status: examAttempts.status,
          startTime: examAttempts.startTime,
          endTime: examAttempts.endTime,
          timeSpentSeconds: examAttempts.timeSpentSeconds,
          totalScore: examAttempts.totalScore,
          mcqScore: examAttempts.mcqScore,
          descriptiveScore: examAttempts.descriptiveScore,
          isPassed: examAttempts.isPassed,
          tabSwitchCount: examAttempts.tabSwitchCount,
          fullscreenExitCount: examAttempts.fullscreenExitCount,
          evaluationNotes: examAttempts.evaluationNotes,
          evaluatedAt: examAttempts.evaluatedAt,
          examId: examinations.id,
          examTitle: examinations.title,
          examCode: examinations.code,
          subject: examinations.subject,
          durationMinutes: examinations.durationMinutes,
          totalMarks: examinations.totalMarks,
          passingMarks: examinations.passingMarks,
          allowReview: examinations.allowReview,
          examEndTime: examinations.endTime,
        })
        .from(examAttempts)
        .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
        .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.studentId, user.id)))
        .limit(1);

      if (!attempt) {
        return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
      }

      const attemptCompleted = attempt.status === "submitted" || attempt.status === "evaluated";
      const reviewWindowOpen =
        attempt.examEndTime === null || new Date(attempt.examEndTime).getTime() <= Date.now();
      const canReview = attempt.allowReview && attemptCompleted && reviewWindowOpen;

      // Review answers only after completion, when enabled, and once the exam window is closed.
      let answersReview: unknown[] = [];
      if (canReview) {
        answersReview = await db
          .select({
            answerId: studentAnswers.id,
            questionId: questions.id,
            questionText: questions.questionText,
            type: questions.type,
            options: questions.options,
            correctOption: questions.correctOption,
            explanation: questions.explanation,
            maxMarks: examQuestions.marks,
            negativeMarks: questions.negativeMarks,
            selectedOption: studentAnswers.selectedOption,
            descriptiveAnswer: studentAnswers.descriptiveAnswer,
            isCorrect: studentAnswers.isCorrect,
            marksAwarded: studentAnswers.marksAwarded,
            teacherFeedback: studentAnswers.teacherFeedback,
          })
          .from(studentAnswers)
          .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
          .innerJoin(
            examQuestions,
            and(
              eq(examQuestions.examId, attempt.examId),
              eq(examQuestions.questionId, questions.id)
            )
          )
          .where(
            and(
              eq(studentAnswers.attemptId, attemptId),
              eq(examQuestions.examId, attempt.examId)
            )
          );
      }

      const percentage =
        attempt.totalMarks > 0
          ? Math.round((Number(attempt.totalScore) / Number(attempt.totalMarks)) * 100)
          : 0;

      return NextResponse.json({
        attempt: { ...attempt, allowReview: canReview },
        percentage,
        answers: answersReview,
        reviewAvailable: canReview,
      });
    }

    // List all completed/evaluated attempts for this student
    const history = await db
      .select({
        attemptId: examAttempts.id,
        examId: examAttempts.examId,
        attemptNumber: examAttempts.attemptNumber,
        status: examAttempts.status,
        startTime: examAttempts.startTime,
        endTime: examAttempts.endTime,
        timeSpentSeconds: examAttempts.timeSpentSeconds,
        totalScore: examAttempts.totalScore,
        mcqScore: examAttempts.mcqScore,
        descriptiveScore: examAttempts.descriptiveScore,
        isPassed: examAttempts.isPassed,
        examTitle: examinations.title,
        examCode: examinations.code,
        subject: examinations.subject,
        totalMarks: examinations.totalMarks,
        passingMarks: examinations.passingMarks,
      })
      .from(examAttempts)
      .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
      .where(eq(examAttempts.studentId, user.id))
      .orderBy(desc(examAttempts.startTime));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Results fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
