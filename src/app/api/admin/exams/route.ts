import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examinations, examQuestions, examAttempts, questions, users } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const examList = await db
      .select({
        id: examinations.id,
        title: examinations.title,
        code: examinations.code,
        description: examinations.description,
        subject: examinations.subject,
        durationMinutes: examinations.durationMinutes,
        totalMarks: examinations.totalMarks,
        passingMarks: examinations.passingMarks,
        instructions: examinations.instructions,
        shuffleQuestions: examinations.shuffleQuestions,
        shuffleOptions: examinations.shuffleOptions,
        allowReview: examinations.allowReview,
        maxAttempts: examinations.maxAttempts,
        status: examinations.status,
        startTime: examinations.startTime,
        endTime: examinations.endTime,
        createdAt: examinations.createdAt,
        creatorName: users.name,
      })
      .from(examinations)
      .leftJoin(users, eq(examinations.createdBy, users.id))
      .orderBy(desc(examinations.createdAt));

    // Get question counts and attempts counts per exam
    const qCounts = await db
      .select({
        examId: examQuestions.examId,
        count: sql<number>`count(*)`,
      })
      .from(examQuestions)
      .groupBy(examQuestions.examId);

    const aCounts = await db
      .select({
        examId: examAttempts.examId,
        count: sql<number>`count(*)`,
      })
      .from(examAttempts)
      .groupBy(examAttempts.examId);

    const qMap = new Map(qCounts.map((q) => [q.examId, Number(q.count)]));
    const aMap = new Map(aCounts.map((a) => [a.examId, Number(a.count)]));

    const result = examList.map((exam) => ({
      ...exam,
      questionCount: qMap.get(exam.id) || 0,
      attemptCount: aMap.get(exam.id) || 0,
    }));

    return NextResponse.json({ examinations: result });
  } catch (error) {
    console.error("Fetch exams error:", error);
    return NextResponse.json({ error: "Failed to fetch examinations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      code,
      description,
      subject,
      durationMinutes,
      totalMarks,
      passingMarks,
      instructions,
      shuffleQuestions,
      shuffleOptions,
      allowReview,
      maxAttempts,
      status,
      startTime,
      endTime,
      questionIds,
    } = body;

    if (!title || !code) {
      return NextResponse.json({ error: "Title and Exam Code are required" }, { status: 400 });
    }

    // Check duplicate code
    const [existing] = await db
      .select({ id: examinations.id })
      .from(examinations)
      .where(eq(examinations.code, code.trim().toUpperCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "An examination with this code already exists" }, { status: 409 });
    }

    const selectedIds: number[] = Array.isArray(questionIds) ? questionIds.map(Number) : [];
    if (selectedIds.some((id) => !Number.isSafeInteger(id) || id < 1) || new Set(selectedIds).size !== selectedIds.length) {
      return NextResponse.json({ error: "Selected question IDs must be unique valid integers" }, { status: 400 });
    }
    const selectedRows = selectedIds.length
      ? await db.select({ id: questions.id, marks: questions.marks }).from(questions).where(inArray(questions.id, selectedIds))
      : [];
    if (selectedRows.length !== selectedIds.length) {
      return NextResponse.json({ error: "One or more selected questions no longer exist" }, { status: 400 });
    }
    const marksById = new Map(selectedRows.map((question) => [question.id, Number(question.marks)]));
    const computedTotal = selectedIds.length
      ? Math.ceil(selectedIds.reduce((sum, id) => sum + (marksById.get(id) ?? 0), 0))
      : Number(totalMarks) || 50;
    const requestedPass = Number(passingMarks);
    const computedPass = Number.isFinite(requestedPass) && requestedPass > 0 && requestedPass <= computedTotal
      ? requestedPass
      : Math.ceil(computedTotal * 0.6);

    const newExam = await db.transaction(async (tx) => {
      const [created] = await tx.insert(examinations).values({
        title: title.trim(),
        code: code.trim().toUpperCase(),
        description: description || null,
        subject: subject || "General",
        durationMinutes: Number(durationMinutes) || 30,
        totalMarks: computedTotal,
        passingMarks: computedPass,
        instructions: instructions || "Answer all questions to the best of your ability.",
        shuffleQuestions: shuffleQuestions !== false,
        shuffleOptions: shuffleOptions !== false,
        allowReview: allowReview !== false,
        maxAttempts: Number(maxAttempts) || 1,
        status: status || "published",
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        createdBy: user.id,
      }).returning();
      if (selectedIds.length) {
        await tx.insert(examQuestions).values(selectedIds.map((id, index) => ({
          examId: created.id,
          questionId: id,
          questionOrder: index + 1,
          marks: marksById.get(id) ?? 1,
        })));
      }
      return created;
    });

    return NextResponse.json({ success: true, exam: newExam });
  } catch (error) {
    console.error("Create exam error:", error);
    return NextResponse.json({ error: "Failed to create examination" }, { status: 500 });
  }
}
