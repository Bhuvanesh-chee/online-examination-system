import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts, examinations, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const examIdParam = searchParams.get("examId");

    let query = db
      .select({
        attemptId: examAttempts.id,
        examId: examAttempts.examId,
        examTitle: examinations.title,
        examCode: examinations.code,
        subject: examinations.subject,
        totalMarks: examinations.totalMarks,
        passingMarks: examinations.passingMarks,
        studentName: users.name,
        studentRollNo: users.studentId,
        studentEmail: users.email,
        department: users.department,
        totalScore: examAttempts.totalScore,
        mcqScore: examAttempts.mcqScore,
        descriptiveScore: examAttempts.descriptiveScore,
        isPassed: examAttempts.isPassed,
        timeSpentSeconds: examAttempts.timeSpentSeconds,
        tabSwitchCount: examAttempts.tabSwitchCount,
        status: examAttempts.status,
        submittedAt: examAttempts.endTime,
        createdAt: examAttempts.createdAt,
      })
      .from(examAttempts)
      .innerJoin(users, eq(examAttempts.studentId, users.id))
      .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
      .orderBy(desc(examAttempts.createdAt));

    let rows = await query;
    if (examIdParam && examIdParam !== "all") {
      const eId = parseInt(examIdParam);
      rows = rows.filter((r) => r.examId === eId);
    }

    // Aggregations
    const totalRows = rows.length;
    const passedRows = rows.filter((r) => r.isPassed).length;
    const failedRows = totalRows - passedRows;
    const passRate = totalRows > 0 ? Math.round((passedRows / totalRows) * 100) : 0;
    const avgScore =
      totalRows > 0
        ? Math.round((rows.reduce((sum, r) => sum + Number(r.totalScore), 0) / totalRows) * 10) / 10
        : 0;

    // Highest score
    const maxScore = rows.reduce((max, r) => Math.max(max, Number(r.totalScore)), 0);

    // List of examinations for dropdown filter
    const examOptions = await db
      .select({
        id: examinations.id,
        title: examinations.title,
        code: examinations.code,
      })
      .from(examinations);

    return NextResponse.json({
      summary: {
        totalSubmissions: totalRows,
        passedSubmissions: passedRows,
        failedSubmissions: failedRows,
        passPercentage: passRate,
        averageScore: avgScore,
        highestScore: maxScore,
      },
      records: rows,
      examOptions,
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
