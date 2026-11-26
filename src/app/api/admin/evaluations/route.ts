import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts, examinations, users, studentAnswers, questions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { originGuard } from "@/lib/origin-guard";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const attemptIdParam = searchParams.get("attemptId");

    // If specific attempt requested, load full answers breakdown
    if (attemptIdParam) {
      const attemptId = parseInt(attemptIdParam);
      const [attempt] = await db
        .select({
          id: examAttempts.id,
          status: examAttempts.status,
          totalScore: examAttempts.totalScore,
          mcqScore: examAttempts.mcqScore,
          descriptiveScore: examAttempts.descriptiveScore,
          isPassed: examAttempts.isPassed,
          startTime: examAttempts.startTime,
          endTime: examAttempts.endTime,
          timeSpentSeconds: examAttempts.timeSpentSeconds,
          tabSwitchCount: examAttempts.tabSwitchCount,
          evaluationNotes: examAttempts.evaluationNotes,
          studentName: users.name,
          studentRollNo: users.studentId,
          studentEmail: users.email,
          examId: examinations.id,
          examTitle: examinations.title,
          examCode: examinations.code,
          totalMarks: examinations.totalMarks,
          passingMarks: examinations.passingMarks,
        })
        .from(examAttempts)
        .innerJoin(users, eq(examAttempts.studentId, users.id))
        .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
        .where(eq(examAttempts.id, attemptId))
        .limit(1);

      if (!attempt) {
        return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
      }

      const answers = await db
        .select({
          answerId: studentAnswers.id,
          questionId: questions.id,
          questionText: questions.questionText,
          type: questions.type,
          options: questions.options,
          correctOption: questions.correctOption,
          descriptiveGuide: questions.descriptiveGuide,
          explanation: questions.explanation,
          maxMarks: questions.marks,
          selectedOption: studentAnswers.selectedOption,
          descriptiveAnswer: studentAnswers.descriptiveAnswer,
          isCorrect: studentAnswers.isCorrect,
          marksAwarded: studentAnswers.marksAwarded,
          teacherFeedback: studentAnswers.teacherFeedback,
        })
        .from(studentAnswers)
        .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
        .where(eq(studentAnswers.attemptId, attemptId));

      return NextResponse.json({ attempt, answers });
    }

    // Otherwise list all submissions requiring evaluation or evaluated
    const submissions = await db
      .select({
        attemptId: examAttempts.id,
        examId: examAttempts.examId,
        examTitle: examinations.title,
        examCode: examinations.code,
        totalMarks: examinations.totalMarks,
        passingMarks: examinations.passingMarks,
        studentId: examAttempts.studentId,
        studentName: users.name,
        studentRollNo: users.studentId,
        studentEmail: users.email,
        startTime: examAttempts.startTime,
        endTime: examAttempts.endTime,
        status: examAttempts.status,
        totalScore: examAttempts.totalScore,
        mcqScore: examAttempts.mcqScore,
        descriptiveScore: examAttempts.descriptiveScore,
        isPassed: examAttempts.isPassed,
        tabSwitchCount: examAttempts.tabSwitchCount,
      })
      .from(examAttempts)
      .innerJoin(users, eq(examAttempts.studentId, users.id))
      .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
      .orderBy(desc(examAttempts.createdAt))
      .limit(50);

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Evaluations fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const blocked = originGuard(request);
  if (blocked) return blocked;

  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const { attemptId, evaluations, overallNotes } = body;
    // evaluations: Array<{ answerId: number, marksAwarded: number, teacherFeedback?: string }>

    if (!attemptId || !Array.isArray(evaluations)) {
      return NextResponse.json({ error: "Invalid evaluation payload" }, { status: 400 });
    }

    // Update each answer
    for (const ev of evaluations) {
      await db
        .update(studentAnswers)
        .set({
          marksAwarded: Number(ev.marksAwarded) || 0,
          teacherFeedback: ev.teacherFeedback || null,
        })
        .where(eq(studentAnswers.id, ev.answerId));
    }

    // Recalculate total score
    const allAnswers = await db
      .select({
        marksAwarded: studentAnswers.marksAwarded,
        type: questions.type,
      })
      .from(studentAnswers)
      .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
      .where(eq(studentAnswers.attemptId, attemptId));

    let mcqScore = 0;
    let descriptiveScore = 0;

    for (const ans of allAnswers) {
      if (ans.type === "mcq") {
        mcqScore += Number(ans.marksAwarded) || 0;
      } else {
        descriptiveScore += Number(ans.marksAwarded) || 0;
      }
    }

    const totalScore = Math.max(0, mcqScore + descriptiveScore);

    // Fetch exam passing marks
    const [attempt] = await db
      .select({
        examPassingMarks: examinations.passingMarks,
      })
      .from(examAttempts)
      .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
      .where(eq(examAttempts.id, attemptId))
      .limit(1);

    const isPassed = attempt ? totalScore >= (attempt.examPassingMarks || 0) : false;

    await db
      .update(examAttempts)
      .set({
        mcqScore,
        descriptiveScore,
        totalScore,
        isPassed,
        status: "evaluated",
        evaluationNotes: overallNotes || "Evaluation completed by instructor.",
        evaluatedAt: new Date(),
        evaluatedBy: user.id,
      })
      .where(eq(examAttempts.id, attemptId));

    return NextResponse.json({
      success: true,
      totalScore,
      mcqScore,
      descriptiveScore,
      isPassed,
      message: "Evaluation saved successfully",
    });
  } catch (error) {
    console.error("Submit evaluation error:", error);
    return NextResponse.json({ error: "Failed to submit evaluation" }, { status: 500 });
  }
}
