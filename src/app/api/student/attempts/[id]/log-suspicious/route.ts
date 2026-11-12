import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts, suspiciousLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attemptId = parseInt(params.id);
    if (isNaN(attemptId)) {
      return NextResponse.json({ error: "Invalid attempt ID" }, { status: 400 });
    }

    const [attempt] = await db
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.studentId, user.id)))
      .limit(1);

    if (!attempt || attempt.status !== "in_progress") {
      return NextResponse.json({ error: "Invalid attempt or already completed" }, { status: 400 });
    }

    const body = await request.json();
    const { eventType, details } = body;

    let newTabCount = attempt.tabSwitchCount;
    let newFullscreenCount = attempt.fullscreenExitCount;

    if (eventType === "tab_switch" || eventType === "window_blur") {
      newTabCount += 1;
    } else if (eventType === "fullscreen_exit") {
      newFullscreenCount += 1;
    }

    // Update counts
    await db
      .update(examAttempts)
      .set({
        tabSwitchCount: newTabCount,
        fullscreenExitCount: newFullscreenCount,
      })
      .where(eq(examAttempts.id, attemptId));

    // Record log entry
    await db.insert(suspiciousLogs).values({
      attemptId,
      studentId: user.id,
      eventType: eventType || "suspicious_activity",
      details: details || `Suspicious event recorded: ${eventType}`,
    });

    return NextResponse.json({
      success: true,
      tabSwitchCount: newTabCount,
      fullscreenExitCount: newFullscreenCount,
      warningMessage: `Anti-cheating notice: Event logged. Warnings: ${newTabCount}. Exceeding limit will result in proctor disqualification.`,
    });
  } catch (error) {
    console.error("Log suspicious error:", error);
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}
