import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts, examinations, examQuestions, questions, studentAnswers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { originGuard } from "@/lib/origin-guard";
import { SUBMISSION_GRACE_MS, finalizeAttempt } from "@/lib/exam-session";

class SaveError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const blocked = originGuard(request);
  if (blocked) return blocked;

  try {
    const params = await props.params;
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attemptId = Number(params.id);
    if (!Number.isInteger(attemptId) || attemptId <= 0) {
      return NextResponse.json({ error: "Invalid attempt ID" }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const questionId = Number(body.questionId);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    let expired = false;

    try {
      const savedAt = await db.transaction(async (tx) => {
        // Serialize saves for this attempt so duplicate answers cannot be created.
        const [attempt] = await tx
          .select()
          .from(examAttempts)
          .where(
            and(eq(examAttempts.id, attemptId), eq(examAttempts.studentId, user.id))
          )
          .for("update");

        if (!attempt) {
          throw new SaveError(404, "Attempt not found");
        }

        if (attempt.status !== "in_progress") {
          throw new SaveError(400, "Examination has already been submitted or concluded");
        }

        const [exam] = await tx
          .select({ durationMinutes: examinations.durationMinutes })
          .from(examinations)
          .where(eq(examinations.id, attempt.examId))
          .limit(1);

        if (!exam) {
          throw new SaveError(404, "Exam definition not found");
        }

        const deadline =
          new Date(attempt.startTime).getTime() + exam.durationMinutes * 60_000;
        if (Date.now() > deadline + SUBMISSION_GRACE_MS) {
          expired = true;
          throw new SaveError(
            409,
            "Time has expired for this examination session.",
            "ATTEMPT_EXPIRED"
          );
        }

        const [examQuestion] = await tx
          .select({
            type: questions.type,
            options: questions.options,
          })
          .from(examQuestions)
          .innerJoin(questions, eq(examQuestions.questionId, questions.id))
          .where(
            and(
              eq(examQuestions.examId, attempt.examId),
              eq(examQuestions.questionId, questionId)
            )
          )
          .limit(1);

        if (!examQuestion) {
          throw new SaveError(
            400,
            "Question does not belong to this examination.",
            "QUESTION_NOT_IN_EXAM"
          );
        }

        let nextSelectedOption: string | null | undefined;
        let nextDescriptiveAnswer: string | null | undefined;

        if (examQuestion.type === "mcq") {
          if (body.selectedOption === undefined) {
            nextSelectedOption = undefined;
          } else if (body.selectedOption === null || body.selectedOption === "") {
            nextSelectedOption = null;
          } else if (typeof body.selectedOption !== "string") {
            throw new SaveError(400, "Invalid option selection.", "INVALID_OPTION");
          } else {
            const selected = body.selectedOption;
            const options = Array.isArray(examQuestion.options)
              ? (examQuestion.options as Array<{ id?: unknown }>)
              : [];
            const match = options.find(
              (option) =>
                typeof option?.id === "string" &&
                option.id.toLowerCase() === selected.toLowerCase()
            );
            if (!match || typeof match.id !== "string") {
              throw new SaveError(400, "Invalid option selection.", "INVALID_OPTION");
            }
            nextSelectedOption = match.id.toLowerCase();
          }
        } else {
          if (
            body.selectedOption !== undefined &&
            body.selectedOption !== null &&
            body.selectedOption !== ""
          ) {
            throw new SaveError(
              400,
              "Option selection is not valid for a descriptive question.",
              "INVALID_OPTION"
            );
          }
          if (body.selectedOption === null || body.selectedOption === "") {
            nextSelectedOption = null;
          }

          if (body.descriptiveAnswer === undefined) {
            nextDescriptiveAnswer = undefined;
          } else if (body.descriptiveAnswer === null) {
            nextDescriptiveAnswer = null;
          } else if (typeof body.descriptiveAnswer !== "string") {
            throw new SaveError(400, "Invalid descriptive answer.");
          } else if (body.descriptiveAnswer.length > 20_000) {
            throw new SaveError(400, "Descriptive answer is too long.");
          } else {
            nextDescriptiveAnswer = body.descriptiveAnswer;
          }
        }

        if (
          body.isMarkedForReview !== undefined &&
          typeof body.isMarkedForReview !== "boolean"
        ) {
          throw new SaveError(400, "Invalid review flag.");
        }

        const [existing] = await tx
          .select()
          .from(studentAnswers)
          .where(
            and(
              eq(studentAnswers.attemptId, attemptId),
              eq(studentAnswers.questionId, questionId)
            )
          )
          .limit(1);

        const answeredAt = new Date();

        if (existing) {
          await tx
            .update(studentAnswers)
            .set({
              selectedOption:
                nextSelectedOption !== undefined
                  ? nextSelectedOption
                  : existing.selectedOption,
              descriptiveAnswer:
                nextDescriptiveAnswer !== undefined
                  ? nextDescriptiveAnswer
                  : existing.descriptiveAnswer,
              isMarkedForReview:
                body.isMarkedForReview !== undefined
                  ? Boolean(body.isMarkedForReview)
                  : existing.isMarkedForReview,
              answeredAt,
            })
            .where(eq(studentAnswers.id, existing.id));
        } else {
          await tx.insert(studentAnswers).values({
            attemptId,
            questionId,
            selectedOption: nextSelectedOption ?? null,
            descriptiveAnswer: nextDescriptiveAnswer ?? null,
            isMarkedForReview: Boolean(body.isMarkedForReview),
            answeredAt,
          });
        }

        return answeredAt;
      });

      return NextResponse.json({ success: true, savedAt });
    } catch (error) {
      if (error instanceof SaveError) {
        if (expired || error.code === "ATTEMPT_EXPIRED") {
          try {
            await finalizeAttempt(attemptId, "expired");
          } catch (finalizeError) {
            console.error("Finalize expired attempt error:", finalizeError);
          }
        }
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.status }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
