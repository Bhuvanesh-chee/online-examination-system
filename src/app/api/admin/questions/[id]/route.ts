import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    const questionId = parseInt(params.id);
    if (isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      bankId,
      questionText,
      type,
      options,
      correctOption,
      descriptiveGuide,
      explanation,
      marks,
      negativeMarks,
      difficulty,
    } = body;

    const [updated] = await db
      .update(questions)
      .set({
        bankId: bankId ? Number(bankId) : null,
        questionText: questionText?.trim(),
        type,
        options,
        correctOption,
        descriptiveGuide,
        explanation,
        marks: Number(marks) || 4,
        negativeMarks: Number(negativeMarks) || 0,
        difficulty,
      })
      .where(eq(questions.id, questionId))
      .returning();

    return NextResponse.json({ success: true, question: updated });
  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
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

    const questionId = parseInt(params.id);
    if (isNaN(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    await db.delete(questions).where(eq(questions.id, questionId));
    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
