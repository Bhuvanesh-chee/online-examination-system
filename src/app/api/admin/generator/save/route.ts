import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { db } from "@/db";
import { questionBanks, questions, examinations, examQuestions } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { originGuard } from "@/lib/origin-guard";
import { and, eq, sql } from "drizzle-orm";
import {
  DIFFICULTIES,
  OPTION_IDS,
  SUBJECTS,
  SUBJECT_LABELS,
  type GeneratedQuestion,
  type GeneratorSubject,
  type GeneratorDifficulty,
  type OptionId,
} from "@/lib/question-generator";

export const dynamic = "force-dynamic";

function validateQuestion(value: unknown): GeneratedQuestion | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const questionText = typeof item.questionText === "string" ? item.questionText.trim() : "";
  const topic = typeof item.topic === "string" ? item.topic.trim() : "";
  const explanation = typeof item.explanation === "string" ? item.explanation.trim() : "";
  const difficulty = item.difficulty;
  const correctOption = item.correctOption;
  const marks = Number(item.marks);
  const negativeMarks = Number(item.negativeMarks ?? 0);

  if (
    questionText.length < 12 || questionText.length > 1400 ||
    topic.length < 1 || topic.length > 80 ||
    explanation.length < 8 || explanation.length > 1500 ||
    typeof difficulty !== "string" || !DIFFICULTIES.includes(difficulty as GeneratorDifficulty) ||
    typeof correctOption !== "string" || !OPTION_IDS.includes(correctOption as OptionId) ||
    !Number.isFinite(marks) || marks < 1 || marks > 20 ||
    !Number.isFinite(negativeMarks) || negativeMarks < 0 || negativeMarks > marks ||
    !Array.isArray(item.options) || item.options.length !== 4
  ) return null;

  const choices = item.options as unknown[];
  const options: { id: OptionId; text: string }[] = [];
  for (let i = 0; i < 4; i++) {
    const choice = choices[i];
    if (!choice || typeof choice !== "object") return null;
    const entry = choice as Record<string, unknown>;
    if (entry.id !== OPTION_IDS[i] || typeof entry.text !== "string") return null;
    const text = entry.text.trim();
    if (!text || text.length > 400) return null;
    options.push({ id: OPTION_IDS[i], text });
  }
  if (new Set(options.map((option) => option.text.toLowerCase())).size !== 4) return null;

  return {
    topic,
    difficulty: difficulty as GeneratorDifficulty,
    questionText,
    options,
    correctOption: correctOption as OptionId,
    explanation,
    marks,
    negativeMarks,
  };
}

export async function POST(request: Request) {
  const blocked = originGuard(request);
  if (blocked) return blocked;

  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof payload.subject !== "string" || !SUBJECTS.includes(payload.subject as GeneratorSubject)) {
    return NextResponse.json({ error: "Choose Java, DSA, or Frontend Development" }, { status: 400 });
  }
  if (!Array.isArray(payload.questions) || payload.questions.length < 1 || payload.questions.length > 8) {
    return NextResponse.json({ error: "Select between 1 and 8 questions to save" }, { status: 400 });
  }

  const selected = payload.questions.map(validateQuestion);
  if (selected.some((question) => question === null)) {
    return NextResponse.json({ error: "A question is incomplete. Enter a prompt, four distinct options, the correct answer, an explanation, and valid marks." }, { status: 400 });
  }
  const verified = selected as GeneratedQuestion[];
  if (new Set(verified.map((question) => question.questionText.toLowerCase())).size !== verified.length) {
    return NextResponse.json({ error: "Remove duplicate questions from this batch before saving." }, { status: 400 });
  }

  const createDraft = payload.createDraft === true;
  const draftTitle = typeof payload.draftTitle === "string" ? payload.draftTitle.trim() : "";
  if (createDraft && (draftTitle.length < 5 || draftTitle.length > 120)) {
    return NextResponse.json({ error: "Enter a draft exam title of 5 to 120 characters" }, { status: 400 });
  }

  const subject = payload.subject as GeneratorSubject;
  const subjectLabel = SUBJECT_LABELS[subject];
  const bankName = `Question Studio · ${subjectLabel}`;

  try {
    const result = await db.transaction(async (tx) => {
      let [bank] = await tx.select().from(questionBanks).where(eq(questionBanks.name, bankName)).limit(1);
      if (!bank) {
        [bank] = await tx.insert(questionBanks).values({
          name: bankName,
          description: `Instructor-reviewed ${subjectLabel} questions from the Question Studio. Can be added to a draft examination.`,
          category: subject === "frontend" ? "Frontend Development" : "Computer Science",
        }).returning();
      }

      let savedCount = 0;
      let duplicateCount = 0;
      const linked: { id: number; marks: number }[] = [];

      for (const question of verified) {
        const [existing] = await tx
          .select({ id: questions.id, marks: questions.marks })
          .from(questions)
          .where(and(
            eq(questions.bankId, bank.id),
            sql`lower(${questions.questionText}) = ${question.questionText.toLowerCase()}`
          ))
          .limit(1);

        if (existing) {
          duplicateCount++;
          linked.push(existing);
          continue;
        }

        const [row] = await tx.insert(questions).values({
          bankId: bank.id,
          questionText: question.questionText,
          type: "mcq",
          options: question.options,
          correctOption: question.correctOption,
          explanation: question.explanation,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          difficulty: question.difficulty,
        }).returning({ id: questions.id, marks: questions.marks });
        savedCount++;
        linked.push(row);
      }

      let draftExam: { id: number; title: string; code: string; status: string } | null = null;
      if (createDraft) {
        const totalMarks = linked.reduce((sum, question) => sum + Number(question.marks), 0);
        const code = `GEN-${subject.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${randomInt(100, 999)}`;
        const [draft] = await tx.insert(examinations).values({
          title: draftTitle,
          code,
          subject: subjectLabel,
          description: `Draft assembled from ${linked.length} instructor-reviewed ${subjectLabel} Question Studio items. Publish after final review.`,
          durationMinutes: Math.max(15, linked.length * 2),
          totalMarks: Math.ceil(totalMarks),
          passingMarks: Math.ceil(totalMarks * 0.6),
          instructions: "Answer all questions. Each question has one correct answer. Review your responses before submitting.",
          status: "draft",
          shuffleQuestions: true,
          shuffleOptions: true,
          allowReview: true,
          maxAttempts: 1,
          createdBy: admin.id,
        }).returning();
        await tx.insert(examQuestions).values(linked.map((question, index) => ({
          examId: draft.id,
          questionId: question.id,
          questionOrder: index + 1,
          marks: question.marks,
        })));
        draftExam = { id: draft.id, title: draft.title, code: draft.code, status: draft.status };
      }

      return {
        bank: { id: bank.id, name: bank.name },
        savedCount,
        duplicateCount,
        questionIds: linked.map((question) => question.id),
        draftExam,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Question Studio save failed:", error);
    return NextResponse.json({ error: "Could not save the selected questions. Please try again." }, { status: 500 });
  }
}
