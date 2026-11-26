import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { users, teacherAllocations, examAttempts, examinations } from "@/db/schema";
import { eq, asc, desc, inArray, and, sql } from "drizzle-orm";

export async function GET() {
  try {
    const teacher = await requireRole(["teacher"]);
    if (!teacher) {
      return NextResponse.json({ error: "Teacher access required" }, { status: 403 });
    }

    const rows = await db
      .select({
        allocationId: teacherAllocations.id,
        studentId: users.id,
        name: users.name,
        email: users.email,
        rollNo: users.studentId,
        department: users.department,
        isActive: users.isActive,
        approvalStatus: users.approvalStatus,
      })
      .from(teacherAllocations)
      .innerJoin(users, eq(teacherAllocations.studentId, users.id))
      .where(eq(teacherAllocations.teacherId, teacher.id))
      .orderBy(asc(users.name));

    const studentIds = rows.map((row) => row.studentId);

    let attemptsData: Array<{
      attemptId: number;
      studentId: number;
      examId: number;
      examTitle: string;
      subject: string;
      totalScore: number;
      totalMarks: number;
      isPassed: boolean;
      status: string;
      endTime: Date | null;
      createdAt: Date;
    }> = [];

    if (studentIds.length > 0) {
      const rawAttempts = await db
        .select({
          attemptId: examAttempts.id,
          studentId: examAttempts.studentId,
          examId: examinations.id,
          examTitle: examinations.title,
          subject: examinations.subject,
          totalScore: examAttempts.totalScore,
          totalMarks: examinations.totalMarks,
          isPassed: examAttempts.isPassed,
          status: examAttempts.status,
          endTime: examAttempts.endTime,
          createdAt: examAttempts.createdAt,
        })
        .from(examAttempts)
        .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
        .where(
          and(
            inArray(examAttempts.studentId, studentIds),
            sql`${examAttempts.status} IN ('submitted', 'evaluated')`
          )
        )
        .orderBy(desc(examAttempts.createdAt));

      attemptsData = rawAttempts.map(a => ({
        ...a,
        totalScore: Number(a.totalScore || 0),
        totalMarks: Number(a.totalMarks || 100),
      }));
    }

    const studentAttemptsMap = new Map<number, typeof attemptsData>();
    for (const attempt of attemptsData) {
      const list = studentAttemptsMap.get(attempt.studentId) || [];
      list.push(attempt);
      studentAttemptsMap.set(attempt.studentId, list);
    }

    const studentsWithDetails = rows.map((row) => {
      const studentAttempts = studentAttemptsMap.get(row.studentId) || [];
      const totalAttempts = studentAttempts.length;
      const passedCount = studentAttempts.filter(a => a.isPassed).length;
      const avgScore = totalAttempts > 0
        ? Math.round((studentAttempts.reduce((sum, a) => sum + a.totalScore, 0) / totalAttempts) * 10) / 10
        : 0;
      const latest = studentAttempts[0] || null;

      return {
        ...row,
        totalAttempts,
        averageScore: avgScore,
        passedCount,
        latestScore: latest ? latest.totalScore : null,
        latestExamTitle: latest ? latest.examTitle : null,
        attempts: studentAttempts.map(a => ({
          ...a,
          percentage: a.totalMarks > 0 ? Math.round((a.totalScore / a.totalMarks) * 1000) / 10 : 0,
        })),
      };
    });

    const allAttemptsFormatted = attemptsData.map(a => {
      const student = rows.find(r => r.studentId === a.studentId);
      const percentage = a.totalMarks > 0 ? Math.round((a.totalScore / a.totalMarks) * 1000) / 10 : 0;
      return {
        ...a,
        studentName: student?.name || "Unknown",
        studentEmail: student?.email || "",
        rollNo: student?.rollNo || "",
        percentage,
      };
    });

    const totalAssignedStudents = rows.length;
    const totalCompletedExams = attemptsData.length;
    const overallScores = attemptsData.map(a => a.totalScore);
    const avgMarks = totalCompletedExams > 0 ? Math.round((overallScores.reduce((a, b) => a + b, 0) / totalCompletedExams) * 10) / 10 : 0;
    const highestMarks = overallScores.length > 0 ? Math.max(...overallScores) : 0;
    const lowestMarks = overallScores.length > 0 ? Math.min(...overallScores) : 0;
    const totalPassed = attemptsData.filter(a => a.isPassed).length;
    const passPercentage = totalCompletedExams > 0 ? Math.round((totalPassed / totalCompletedExams) * 1000) / 10 : 0;

    return NextResponse.json({
      students: studentsWithDetails,
      results: allAttemptsFormatted,
      analytics: {
        totalStudents: totalAssignedStudents,
        totalCompletedExams,
        averageMarks: avgMarks,
        highestMarks,
        lowestMarks,
        passPercentage,
      },
    });
  } catch (error) {
    console.error("Teacher students error:", error);
    return NextResponse.json({ error: "Failed to load allocated students and results" }, { status: 500 });
  }
}
