import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { questions, questionBanks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const bankIdParam = searchParams.get("bankId");
    const typeParam = searchParams.get("type");

    let query = db
      .select({
        id: questions.id,
        bankId: questions.bankId,
        bankName: questionBanks.name,
        questionText: questions.questionText,
        type: questions.type,
        options: questions.options,
        correctOption: questions.correctOption,
        descriptiveGuide: questions.descriptiveGuide,
        explanation: questions.explanation,
        marks: questions.marks,
        negativeMarks: questions.negativeMarks,
        difficulty: questions.difficulty,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .leftJoin(questionBanks, eq(questions.bankId, questionBanks.id))
      .orderBy(desc(questions.createdAt));

    const allQuestions = await query;

    // Filter in-memory for simplicity & versatility
    let filtered = allQuestions;
    if (bankIdParam && bankIdParam !== "all") {
      const bId = parseInt(bankIdParam);
      filtered = filtered.filter((q) => q.bankId === bId);
    }
    if (typeParam && typeParam !== "all") {
      filtered = filtered.filter((q) => q.type === typeParam);
    }

    return NextResponse.json({ questions: filtered });
  } catch (error) {
    console.error("Fetch questions error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
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

    if (!questionText) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }

    if (type === "mcq") {
      if (!Array.isArray(options) || options.length < 2) {
        return NextResponse.json({ error: "MCQ requires at least 2 options" }, { status: 400 });
      }
      if (!correctOption) {
        return NextResponse.json({ error: "Please designate the correct MCQ option" }, { status: 400 });
      }
    }

    const [newQuestion] = await db
      .insert(questions)
      .values({
        bankId: bankId ? Number(bankId) : null,
        questionText: questionText.trim(),
        type: type || "mcq",
        options: options || null,
        correctOption: correctOption || null,
        descriptiveGuide: descriptiveGuide || null,
        explanation: explanation || null,
        marks: Number(marks) || 4,
        negativeMarks: Number(negativeMarks) || 0,
        difficulty: difficulty || "medium",
      })
      .returning();

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}
