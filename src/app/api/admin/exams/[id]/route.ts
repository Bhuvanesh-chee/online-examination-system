import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examinations, examQuestions, examAttempts, questions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const examId = parseInt(params.id);
    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    const [exam] = await db
      .select()
      .from(examinations)
      .where(eq(examinations.id, examId))
      .limit(1);

    if (!exam) {
      return NextResponse.json({ error: "Examination not found" }, { status: 404 });
    }

    // Get linked questions
    const linkedQuestions = await db
      .select({
        examQuestionId: examQuestions.id,
        order: examQuestions.questionOrder,
        marks: examQuestions.marks,
        id: questions.id,
        questionText: questions.questionText,
        type: questions.type,
        options: questions.options,
        correctOption: questions.correctOption,
        difficulty: questions.difficulty,
      })
      .from(examQuestions)
      .innerJoin(questions, eq(examQuestions.questionId, questions.id))
      .where(eq(examQuestions.examId, examId))
      .orderBy(examQuestions.questionOrder);

    return NextResponse.json({ exam, questions: linkedQuestions });
  } catch (error) {
    console.error("Get exam error:", error);
    return NextResponse.json({ error: "Failed to fetch examination" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const examId = parseInt(params.id);
    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
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

    const [currentExam] = await db.select().from(examinations).where(eq(examinations.id, examId)).limit(1);
    if (!currentExam) return NextResponse.json({ error: "Examination not found" }, { status: 404 });

    const currentLinks = await db.select({ questionId: examQuestions.questionId })
      .from(examQuestions).where(eq(examQuestions.examId, examId)).orderBy(examQuestions.questionOrder);
    const selectedIds: number[] = Array.isArray(questionIds)
      ? questionIds.map(Number)
      : currentLinks.map((link) => link.questionId);
    if (selectedIds.some((id) => !Number.isSafeInteger(id) || id < 1) || new Set(selectedIds).size !== selectedIds.length) {
      return NextResponse.json({ error: "Selected question IDs must be unique valid integers" }, { status: 400 });
    }
    const questionSetChanged = selectedIds.length !== currentLinks.length ||
      selectedIds.some((id, index) => id !== currentLinks[index]?.questionId);
    if (questionSetChanged) {
      const existingAttempts = await db.select({ id: examAttempts.id }).from(examAttempts)
        .where(eq(examAttempts.examId, examId)).limit(1);
      if (existingAttempts.length) {
        return NextResponse.json({ error: "An attempted examination cannot have its questions changed. Create a new draft exam instead." }, { status: 409 });
      }
    }
    if (status === "published" && !selectedIds.length) {
      return NextResponse.json({ error: "Add at least one question before publishing" }, { status: 400 });
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
      : Number(totalMarks) || currentExam.totalMarks;
    const requestedPass = Number(passingMarks);
    const computedPass = Number.isFinite(requestedPass) && requestedPass > 0 && requestedPass <= computedTotal
      ? requestedPass
      : Math.ceil(computedTotal * 0.6);

    const updatedExam = await db.transaction(async (tx) => {
      const [updated] = await tx.update(examinations).set({
        title: title?.trim(),
        code: code?.trim().toUpperCase(),
        description,
        subject,
        durationMinutes: Number(durationMinutes) || currentExam.durationMinutes,
        totalMarks: computedTotal,
        passingMarks: computedPass,
        instructions,
        shuffleQuestions: Boolean(shuffleQuestions),
        shuffleOptions: Boolean(shuffleOptions),
        allowReview: Boolean(allowReview),
        maxAttempts: Number(maxAttempts) || 1,
        status,
        startTime: startTime === undefined ? currentExam.startTime : startTime ? new Date(startTime) : null,
        endTime: endTime === undefined ? currentExam.endTime : endTime ? new Date(endTime) : null,
        updatedAt: new Date(),
      }).where(eq(examinations.id, examId)).returning();

      if (questionSetChanged) {
        await tx.delete(examQuestions).where(eq(examQuestions.examId, examId));
        if (selectedIds.length) {
          await tx.insert(examQuestions).values(selectedIds.map((id, index) => ({
            examId,
            questionId: id,
            questionOrder: index + 1,
            marks: marksById.get(id) ?? 1,
          })));
        }
      }
      return updated;
    });

    return NextResponse.json({ success: true, exam: updatedExam });
  } catch (error) {
    console.error("Update exam error:", error);
    return NextResponse.json({ error: "Failed to update examination" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const examId = parseInt(params.id);
    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    await db.delete(examinations).where(eq(examinations.id, examId));

    return NextResponse.json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Delete exam error:", error);
    return NextResponse.json({ error: "Failed to delete examination" }, { status: 500 });
  }
}
