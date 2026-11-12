import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts, examinations, examQuestions } from "@/db/schema";
import { eq, desc, sql, asc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Get all published examinations
    const allExams = await db
      .select({
        id: examinations.id,
        title: examinations.title,
        code: examinations.code,
        subject: examinations.subject,
        durationMinutes: examinations.durationMinutes,
        totalMarks: examinations.totalMarks,
        passingMarks: examinations.passingMarks,
        maxAttempts: examinations.maxAttempts,
        startTime: examinations.startTime,
        endTime: examinations.endTime,
      })
      .from(examinations)
      .where(eq(examinations.status, "published"))
      .orderBy(asc(examinations.id));

    // Question counts
    const qCounts = await db
      .select({
        examId: examQuestions.examId,
        count: sql<number>`count(*)`,
      })
      .from(examQuestions)
      .groupBy(examQuestions.examId);

    const qCountMap = new Map(qCounts.map((q) => [q.examId, Number(q.count)]));

    // Get student's attempts
    const studentAttempts = await db
      .select({
        id: examAttempts.id,
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
        tabSwitchCount: examAttempts.tabSwitchCount,
        evaluationNotes: examAttempts.evaluationNotes,
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

    // Calculate metrics
    const completedAttempts = studentAttempts.filter(
      (a) => a.status === "evaluated" || a.status === "submitted"
    );
    const passedAttempts = completedAttempts.filter((a) => a.isPassed);

    const totalCompleted = completedAttempts.length;
    const avgScore =
      totalCompleted > 0
        ? Math.round(
            (completedAttempts.reduce((sum, a) => sum + Number(a.totalScore), 0) / totalCompleted) *
              10
          ) / 10
        : 0;

    const passRate = totalCompleted > 0 ? Math.round((passedAttempts.length / totalCompleted) * 100) : 0;

    // Attach attempt status to available exams
    const attemptsByExam = new Map<number, number>();
    for (const a of studentAttempts) {
      attemptsByExam.set(a.examId, (attemptsByExam.get(a.examId) || 0) + 1);
    }

    const availableExams = allExams.map((exam) => {
      const usedAttempts = attemptsByExam.get(exam.id) || 0;
      const canTake = usedAttempts < exam.maxAttempts;
      return {
        ...exam,
        questionCount: qCountMap.get(exam.id) || 0,
        usedAttempts,
        canTake,
      };
    });

    return NextResponse.json({
      stats: {
        availableExamsCount: availableExams.filter((e) => e.canTake).length,
        completedExamsCount: totalCompleted,
        averageScore: avgScore,
        passRate,
      },
      availableExams,
      recentAttempts: studentAttempts.slice(0, 5),
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
