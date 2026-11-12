import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts, examinations, studentAnswers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempts = await db
      .select({
        attemptId: examAttempts.id,
        examId: examAttempts.examId,
        examTitle: examinations.title,
        subject: examinations.subject,
        totalMarks: examinations.totalMarks,
        passingMarks: examinations.passingMarks,
        totalScore: examAttempts.totalScore,
        mcqScore: examAttempts.mcqScore,
        descriptiveScore: examAttempts.descriptiveScore,
        isPassed: examAttempts.isPassed,
        timeSpentSeconds: examAttempts.timeSpentSeconds,
        tabSwitchCount: examAttempts.tabSwitchCount,
        createdAt: examAttempts.createdAt,
      })
      .from(examAttempts)
      .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
      .where(eq(examAttempts.studentId, user.id))
      .orderBy(desc(examAttempts.createdAt));

    // Subject breakdown
    const subjectMap = new Map<
      string,
      { subject: string; attempts: number; totalScored: number; totalPossible: number }
    >();

    for (const a of attempts) {
      const current = subjectMap.get(a.subject) || {
        subject: a.subject,
        attempts: 0,
        totalScored: 0,
        totalPossible: 0,
      };
      current.attempts += 1;
      current.totalScored += Number(a.totalScore);
      current.totalPossible += Number(a.totalMarks);
      subjectMap.set(a.subject, current);
    }

    const subjectAnalytics = Array.from(subjectMap.values()).map((s) => ({
      subject: s.subject,
      attempts: s.attempts,
      averagePercentage:
        s.totalPossible > 0 ? Math.round((s.totalScored / s.totalPossible) * 100) : 0,
    }));

    // Accuracy calculation from student answers
    const answers = await db
      .select({
        isCorrect: studentAnswers.isCorrect,
      })
      .from(studentAnswers)
      .innerJoin(examAttempts, eq(studentAnswers.attemptId, examAttempts.id))
      .where(eq(examAttempts.studentId, user.id));

    const totalEvaluatedMCQs = answers.filter((a) => a.isCorrect !== null).length;
    const correctMCQs = answers.filter((a) => a.isCorrect === true).length;
    const accuracy = totalEvaluatedMCQs > 0 ? Math.round((correctMCQs / totalEvaluatedMCQs) * 100) : 0;

    return NextResponse.json({
      totalAttempts: attempts.length,
      passedCount: attempts.filter((a) => a.isPassed).length,
      accuracyPercentage: accuracy,
      subjectAnalytics,
      scoreTimeline: attempts.map((a) => ({
        examTitle: a.examTitle,
        subject: a.subject,
        score: a.totalScore,
        totalMarks: a.totalMarks,
        percentage:
          a.totalMarks > 0 ? Math.round((Number(a.totalScore) / Number(a.totalMarks)) * 100) : 0,
        date: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch student analytics" }, { status: 500 });
  }
}
