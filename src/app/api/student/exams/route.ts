import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examinations, examQuestions, examAttempts } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allExams = await db
      .select({
        id: examinations.id,
        title: examinations.title,
        code: examinations.code,
        description: examinations.description,
        subject: examinations.subject,
        durationMinutes: examinations.durationMinutes,
        totalMarks: examinations.totalMarks,
        passingMarks: examinations.passingMarks,
        maxAttempts: examinations.maxAttempts,
        instructions: examinations.instructions,
        shuffleQuestions: examinations.shuffleQuestions,
        shuffleOptions: examinations.shuffleOptions,
        status: examinations.status,
        startTime: examinations.startTime,
        endTime: examinations.endTime,
      })
      .from(examinations)
      .where(eq(examinations.status, "published"))
      .orderBy(desc(examinations.createdAt));

    // Question counts
    const qCounts = await db
      .select({
        examId: examQuestions.examId,
        count: sql<number>`count(*)`,
      })
      .from(examQuestions)
      .groupBy(examQuestions.examId);

    const qCountMap = new Map(qCounts.map((q) => [q.examId, Number(q.count)]));

    // Student attempts
    const userAttempts = await db
      .select({
        id: examAttempts.id,
        examId: examAttempts.examId,
        status: examAttempts.status,
        totalScore: examAttempts.totalScore,
        isPassed: examAttempts.isPassed,
      })
      .from(examAttempts)
      .where(eq(examAttempts.studentId, user.id));

    const attemptsMap = new Map<number, typeof userAttempts>();
    for (const a of userAttempts) {
      const list = attemptsMap.get(a.examId) || [];
      list.push(a);
      attemptsMap.set(a.examId, list);
    }

    const result = allExams.map((exam) => {
      const attempts = attemptsMap.get(exam.id) || [];
      const usedAttempts = attempts.length;
      const inProgressAttempt = attempts.find((a) => a.status === "in_progress");
      const canTake = !inProgressAttempt && usedAttempts < exam.maxAttempts;

      return {
        ...exam,
        questionCount: qCountMap.get(exam.id) || 0,
        usedAttempts,
        canTake,
        inProgressAttemptId: inProgressAttempt ? inProgressAttempt.id : null,
        latestAttempt: attempts[attempts.length - 1] || null,
      };
    });

    return NextResponse.json({ examinations: result });
  } catch (error) {
    console.error("Student exams fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch examinations" }, { status: 500 });
  }
}
