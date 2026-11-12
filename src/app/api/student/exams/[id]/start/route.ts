import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examinations, examQuestions, examAttempts, questions, studentAnswers } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let m = result.length;
  let t: T;
  let i: number;
  let s = seed;
  const pseudoRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  while (m) {
    i = Math.floor(pseudoRandom() * m--);
    t = result[m];
    result[m] = result[i];
    result[i] = t;
  }
  return result;
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
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

    if (!exam || exam.status !== "published") {
      return NextResponse.json({ error: "Examination is not available" }, { status: 404 });
    }

    // Check if there is an in-progress attempt
    const existingAttempts = await db
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, user.id)))
      .orderBy(asc(examAttempts.attemptNumber));

    let currentAttempt = existingAttempts.find((a) => a.status === "in_progress");

    if (!currentAttempt) {
      if (existingAttempts.length >= exam.maxAttempts) {
        return NextResponse.json(
          { error: `Maximum attempt limit (${exam.maxAttempts}) reached for this examination` },
          { status: 403 }
        );
      }

      const nextAttemptNum = existingAttempts.length + 1;
      const [newAttempt] = await db
        .insert(examAttempts)
        .values({
          examId,
          studentId: user.id,
          attemptNumber: nextAttemptNum,
          status: "in_progress",
          startTime: new Date(),
          tabSwitchCount: 0,
          fullscreenExitCount: 0,
        })
        .returning();

      currentAttempt = newAttempt;
    }

    // Check time remaining
    const startTime = new Date(currentAttempt.startTime).getTime();
    const durationMs = exam.durationMinutes * 60 * 1000;
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const timeRemainingSeconds = Math.max(0, exam.durationMinutes * 60 - elapsedSeconds);

    // If time has already expired on an in_progress attempt, auto-close it
    if (timeRemainingSeconds <= 0) {
      await db
        .update(examAttempts)
        .set({
          status: "submitted",
          endTime: new Date(),
          timeSpentSeconds: exam.durationMinutes * 60,
        })
        .where(eq(examAttempts.id, currentAttempt.id));

      return NextResponse.json(
        { error: "Time has already expired for this examination session." },
        { status: 410 }
      );
    }

    // Fetch questions
    const rawQuestions = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        type: questions.type,
        options: questions.options,
        marks: examQuestions.marks,
        negativeMarks: questions.negativeMarks,
        difficulty: questions.difficulty,
        order: examQuestions.questionOrder,
      })
      .from(examQuestions)
      .innerJoin(questions, eq(examQuestions.questionId, questions.id))
      .where(eq(examQuestions.examId, examId))
      .orderBy(asc(examQuestions.questionOrder));

    // Seed for deterministic shuffle per attempt
    const attemptSeed = currentAttempt.id * 1000 + user.id;

    let sanitizedQuestions = rawQuestions.map((q) => {
      let options = q.options as Array<{ id: string; text: string }> | null;
      if (q.type === "mcq" && options && exam.shuffleOptions) {
        options = shuffleArray(options, attemptSeed + q.id);
      }
      return {
        id: q.id,
        questionText: q.questionText,
        type: q.type,
        options: options || [],
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        difficulty: q.difficulty,
      };
    });

    if (exam.shuffleQuestions) {
      sanitizedQuestions = shuffleArray(sanitizedQuestions, attemptSeed);
    }

    // Fetch existing answers if student is resuming
    const savedAnswers = await db
      .select({
        questionId: studentAnswers.questionId,
        selectedOption: studentAnswers.selectedOption,
        descriptiveAnswer: studentAnswers.descriptiveAnswer,
        isMarkedForReview: studentAnswers.isMarkedForReview,
      })
      .from(studentAnswers)
      .where(eq(studentAnswers.attemptId, currentAttempt.id));

    return NextResponse.json({
      attemptId: currentAttempt.id,
      exam: {
        id: exam.id,
        title: exam.title,
        code: exam.code,
        subject: exam.subject,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        instructions: exam.instructions,
      },
      student: {
        id: user.id,
        name: user.name,
        rollNo: user.studentId,
        email: user.email,
        department: user.department,
      },
      questions: sanitizedQuestions,
      savedAnswers,
      timeRemainingSeconds,
      startTime: currentAttempt.startTime,
      tabSwitchCount: currentAttempt.tabSwitchCount,
      fullscreenExitCount: currentAttempt.fullscreenExitCount,
    });
  } catch (error) {
    console.error("Start exam error:", error);
    return NextResponse.json({ error: "Failed to initiate examination session" }, { status: 500 });
  }
}
