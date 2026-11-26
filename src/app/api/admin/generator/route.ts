import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  DEMO_TOPICS,
  DIFFICULTIES,
  SUBJECTS,
  generateOfflineQuestions,
  type GeneratorSubject,
  type GeneratorDifficulty,
} from "@/lib/question-generator";
import { generateAIQuestions } from "@/lib/ai-question-service";
import { originGuard } from "@/lib/origin-guard";

export const dynamic = "force-dynamic";

const aiRequestTimes = new Map<number, number[]>();

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  return NextResponse.json({
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    subjects: SUBJECTS,
    difficulties: DIFFICULTIES,
    demoTopics: DEMO_TOPICS,
    maxBatch: 8,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const blocked = originGuard(request);
  if (blocked) return blocked;

  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const subject = input.subject;
  const difficulty = input.difficulty;
  const topic = typeof input.topic === "string" ? input.topic.trim() : "";
  const count = input.count ?? 1;
  const mode = input.mode ?? "auto";

  if (typeof subject !== "string" || !SUBJECTS.includes(subject as GeneratorSubject)) {
    return NextResponse.json({ error: "Choose Java, DSA, or Frontend Development" }, { status: 400 });
  }
  if (typeof difficulty !== "string" || !DIFFICULTIES.includes(difficulty as GeneratorDifficulty)) {
    return NextResponse.json({ error: "Choose easy, medium, or hard difficulty" }, { status: 400 });
  }
  if (!topic || topic.length > 80) {
    return NextResponse.json({ error: "Enter a topic of 1 to 80 characters, or select Mixed topics" }, { status: 400 });
  }
  if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 8) {
    return NextResponse.json({ error: "Choose between 1 and 8 questions per request" }, { status: 400 });
  }
  if (mode !== "auto" && mode !== "ai" && mode !== "demo") {
    return NextResponse.json({ error: "Invalid generation mode" }, { status: 400 });
  }

  const typedSubject = subject as GeneratorSubject;
  const typedDifficulty = difficulty as GeneratorDifficulty;
  const aiConfigured = Boolean(process.env.GEMINI_API_KEY);

  if (mode === "ai" && !aiConfigured) {
    return NextResponse.json({
      code: "AI_NOT_CONFIGURED",
      error: "Real AI generation requires GEMINI_API_KEY on the server. Choose Offline demo mode to generate curated sample questions without a key.",
    }, { status: 503 });
  }

  let aiError = false;
  if (mode !== "demo" && aiConfigured) {
    const now = Date.now();
    const recent = (aiRequestTimes.get(user.id) ?? []).filter((time) => now - time < 60_000);
    if (recent.length >= 5) {
      return NextResponse.json({ error: "AI request limit reached. Wait one minute, then try again." }, { status: 429 });
    }
    aiRequestTimes.set(user.id, [...recent, now]);

    try {
      const questions = await generateAIQuestions(typedSubject, topic, typedDifficulty, count);
      return NextResponse.json({
        questions,
        source: "ai",
        resolvedTopic: topic,
        requestedCount: count,
        generatedCount: questions.length,
        notice: "AI-generated questions need instructor review before they are saved or published.",
      }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      console.error("AI question generation failed:", error);
      aiError = true;
      if (mode === "ai") {
        return NextResponse.json({
          code: "AI_UNAVAILABLE",
          error: "The AI provider could not generate a valid question right now. Switch to Offline demo mode, or check the server's AI key and model settings.",
        }, { status: 502 });
      }
    }
  }

  const offline = generateOfflineQuestions(typedSubject, topic, typedDifficulty, count);
  if (!offline.resolvedTopic || offline.questions.length === 0) {
    return NextResponse.json({
      code: "TOPIC_NOT_IN_DEMO",
      error: `Offline demo has no ${typedDifficulty} sample for “${topic}”. Choose one of the suggested topics or configure OPENAI_API_KEY to generate for any topic.`,
      suggestedTopics: DEMO_TOPICS[typedSubject],
    }, { status: 422 });
  }

  const limited = offline.questions.length < count;
  const notice = aiError
    ? "The AI provider was unavailable, so verified offline sample questions were used instead. Review before saving."
    : limited
      ? `Offline demo contains ${offline.questions.length} vetted ${typedDifficulty} question for this topic. Choose Mixed topics for larger packs, or add OPENAI_API_KEY for new variations.`
      : "Offline demo uses vetted sample questions; add OPENAI_API_KEY for newly generated AI questions.";

  return NextResponse.json({
    questions: offline.questions,
    source: "demo",
    resolvedTopic: offline.resolvedTopic,
    requestedCount: count,
    generatedCount: offline.questions.length,
    notice,
  }, { headers: { "Cache-Control": "no-store" } });
}
