import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { users, examinations, questions, examAttempts } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Counts
    const [studentsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "student"));

    const [teachersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "teacher"));

    const [pendingStudentsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, "student"), eq(users.approvalStatus, "pending")));

    const [pendingTeachersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, "teacher"), eq(users.approvalStatus, "pending")));

    const [examsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(examinations);

    const [questionsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions);

    const [attemptsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(examAttempts);

    const [passedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(examAttempts)
      .where(eq(examAttempts.isPassed, true));

    const [avgScoreResult] = await db
      .select({ avg: sql<number>`coalesce(avg(${examAttempts.totalScore}), 0)` })
      .from(examAttempts);

    // Recent attempts with user & exam details
    const recentSubmissions = await db
      .select({
        attemptId: examAttempts.id,
        status: examAttempts.status,
        totalScore: examAttempts.totalScore,
        isPassed: examAttempts.isPassed,
        timeSpentSeconds: examAttempts.timeSpentSeconds,
        tabSwitchCount: examAttempts.tabSwitchCount,
        createdAt: examAttempts.createdAt,
        studentName: users.name,
        studentId: users.studentId,
        studentEmail: users.email,
        examTitle: examinations.title,
        examCode: examinations.code,
        totalMarks: examinations.totalMarks,
      })
      .from(examAttempts)
      .innerJoin(users, eq(examAttempts.studentId, users.id))
      .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
      .orderBy(desc(examAttempts.createdAt))
      .limit(6);

    const totalAttempts = Number(attemptsCount?.count || 0);
    const totalPassed = Number(passedCount?.count || 0);
    const passRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalStudents: Number(studentsCount?.count || 0),
        totalTeachers: Number(teachersCount?.count || 0),
        pendingStudents: Number(pendingStudentsCount?.count || 0),
        pendingTeachers: Number(pendingTeachersCount?.count || 0),
        totalExams: Number(examsCount?.count || 0),
        totalQuestions: Number(questionsCount?.count || 0),
        totalAttempts,
        passRate,
        averageScore: Math.round(Number(avgScoreResult?.avg || 0) * 10) / 10,
      },
      recentSubmissions,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
