import { db } from "@/db";
import {
  examAttempts,
  examinations,
  examQuestions,
  questions,
  studentAnswers,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const SUBMISSION_GRACE_MS = 10_000;

export type FinalizeReason = "submitted" | "expired";

export interface FinalizeResult {
  attemptId: number;
  status: string;
  totalScore: number;
  mcqScore: number;
  descriptiveScore: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  hasDescriptive: boolean;
  expired: boolean;
  alreadyFinalized: boolean;
}

type AttemptRow = typeof examAttempts.$inferSelect;

export function attemptDeadline(
  startTime: Date | string,
  durationMinutes: number
): number {
  return new Date(startTime).getTime() + durationMinutes * 60_000;
}

function resultFromAttempt(
  attempt: AttemptRow,
  expired: boolean,
  alreadyFinalized: boolean
): FinalizeResult {
  return {
    attemptId: attempt.id,
    status: attempt.status,
    totalScore: Number(attempt.totalScore),
    mcqScore: Number(attempt.mcqScore),
    descriptiveScore: Number(attempt.descriptiveScore),
    isPassed: attempt.isPassed,
    timeSpentSeconds: attempt.timeSpentSeconds,
    hasDescriptive: attempt.status === "submitted",
    expired,
    alreadyFinalized,
  };
}

/**
 * Grades and closes an in-progress attempt exactly once. The attempt row is
 * locked for the duration of the transaction so concurrent save/submit/start
 * requests cannot grade it twice or create conflicting answers.
 */
export async function finalizeAttempt(
  attemptId: number,
  reason: FinalizeReason = "submitted"
): Promise<FinalizeResult> {
  return db.transaction(async (tx) => {
    const [attempt] = await tx
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.id, attemptId))
      .for("update");

    if (!attempt) {
      throw new Error("Attempt not found");
    }

    if (attempt.status !== "in_progress") {
      return resultFromAttempt(attempt, reason === "expired", true);
    }

    const [exam] = await tx
      .select()
      .from(examinations)
      .where(eq(examinations.id, attempt.examId))
      .limit(1);

    if (!exam) {
      throw new Error("Exam definition not found");
    }

    const deadline = attemptDeadline(attempt.startTime, exam.durationMinutes);
    const now = Date.now();
    const cutoff = deadline + SUBMISSION_GRACE_MS;
    const expired = reason === "expired" || now > cutoff;

    const examQList = await tx
      .select({
        questionId: questions.id,
        type: questions.type,
        correctOption: questions.correctOption,
        marks: examQuestions.marks,
        negativeMarks: questions.negativeMarks,
      })
      .from(examQuestions)
      .innerJoin(questions, eq(examQuestions.questionId, questions.id))
      .where(eq(examQuestions.examId, attempt.examId));

    const studentAnsList = await tx
      .select()
      .from(studentAnswers)
      .where(eq(studentAnswers.attemptId, attemptId));

    const ansMap = new Map(studentAnsList.map((answer) => [answer.questionId, answer]));

    let mcqScore = 0;
    let hasDescriptive = false;

    for (const question of examQList) {
      const studentAnswer = ansMap.get(question.questionId);
      if (!studentAnswer) continue;

      if (question.type === "mcq") {
        if (
          studentAnswer.selectedOption &&
          new Date(studentAnswer.answeredAt).getTime() <= cutoff
        ) {
          const isCorrect =
            studentAnswer.selectedOption.toLowerCase() ===
            (question.correctOption || "").toLowerCase();
          const marksAwarded = isCorrect
            ? Number(question.marks)
            : -Number(question.negativeMarks || 0);

          mcqScore += marksAwarded;

          await tx
            .update(studentAnswers)
            .set({ isCorrect, marksAwarded })
            .where(eq(studentAnswers.id, studentAnswer.id));
        }
      } else if (question.type === "descriptive") {
        hasDescriptive = true;
      }
    }

    mcqScore = Math.max(0, Math.round(mcqScore * 10) / 10);

    const endTime = expired ? new Date(deadline) : new Date(now);
    const effectiveEnd = expired ? deadline : now;
    const timeSpentSeconds = Math.min(
      exam.durationMinutes * 60,
      Math.max(
        1,
        Math.floor((effectiveEnd - new Date(attempt.startTime).getTime()) / 1000)
      )
    );

    const finalStatus = hasDescriptive ? "submitted" : "evaluated";
    const totalScore = mcqScore;
    const isPassed = !hasDescriptive ? totalScore >= exam.passingMarks : false;

    const [updated] = await tx
      .update(examAttempts)
      .set({
        status: finalStatus,
        endTime,
        timeSpentSeconds,
        mcqScore,
        descriptiveScore: 0,
        totalScore,
        isPassed,
        evaluationNotes: hasDescriptive
          ? "Objective MCQs graded automatically. Descriptive answers pending instructor evaluation."
          : "Automated instant evaluation completed.",
        evaluatedAt: hasDescriptive ? null : new Date(now),
      })
      .where(
        and(eq(examAttempts.id, attemptId), eq(examAttempts.status, "in_progress"))
      )
      .returning();

    if (!updated) {
      const [existing] = await tx
        .select()
        .from(examAttempts)
        .where(eq(examAttempts.id, attemptId))
        .limit(1);
      if (!existing) throw new Error("Attempt not found");
      return resultFromAttempt(existing, expired, true);
    }

    return {
      attemptId,
      status: finalStatus,
      totalScore,
      mcqScore,
      descriptiveScore: 0,
      isPassed,
      timeSpentSeconds,
      hasDescriptive,
      expired,
      alreadyFinalized: false,
    };
  });
}
