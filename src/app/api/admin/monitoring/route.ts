import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { examAttempts, examinations, users, suspiciousLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { originGuard } from "@/lib/origin-guard";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Live attempts (in_progress)
    const liveAttempts = await db
      .select({
        attemptId: examAttempts.id,
        examId: examAttempts.examId,
        examTitle: examinations.title,
        examCode: examinations.code,
        durationMinutes: examinations.durationMinutes,
        studentId: examAttempts.studentId,
        studentName: users.name,
        studentRollNo: users.studentId,
        studentEmail: users.email,
        startTime: examAttempts.startTime,
        tabSwitchCount: examAttempts.tabSwitchCount,
        fullscreenExitCount: examAttempts.fullscreenExitCount,
        status: examAttempts.status,
      })
      .from(examAttempts)
      .innerJoin(users, eq(examAttempts.studentId, users.id))
      .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
      .where(eq(examAttempts.status, "in_progress"))
      .orderBy(desc(examAttempts.startTime));

    // Suspicious activity logs
    const logs = await db
      .select({
        id: suspiciousLogs.id,
        attemptId: suspiciousLogs.attemptId,
        eventType: suspiciousLogs.eventType,
        details: suspiciousLogs.details,
        timestamp: suspiciousLogs.timestamp,
        studentName: users.name,
        studentRollNo: users.studentId,
        studentEmail: users.email,
        examTitle: examinations.title,
      })
      .from(suspiciousLogs)
      .innerJoin(users, eq(suspiciousLogs.studentId, users.id))
      .innerJoin(examAttempts, eq(suspiciousLogs.attemptId, examAttempts.id))
      .innerJoin(examinations, eq(examAttempts.examId, examinations.id))
      .orderBy(desc(suspiciousLogs.timestamp))
      .limit(50);

    return NextResponse.json({ liveAttempts, logs });
  } catch (error) {
    console.error("Monitoring fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch monitoring data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const blocked = originGuard(request);
  if (blocked) return blocked;

  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const { action, attemptId, reason } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required" }, { status: 400 });
    }

    if (action === "force-submit") {
      await db
        .update(examAttempts)
        .set({
          status: "submitted",
          endTime: new Date(),
          evaluationNotes: reason ? `Force submitted by proctor: ${reason}` : "Force submitted by proctor",
        })
        .where(eq(examAttempts.id, Number(attemptId)));

      return NextResponse.json({ success: true, message: "Attempt force submitted" });
    }

    if (action === "disqualify") {
      await db
        .update(examAttempts)
        .set({
          status: "disqualified",
          endTime: new Date(),
          totalScore: 0,
          isPassed: false,
          evaluationNotes: reason ? `Disqualified due to policy violation: ${reason}` : "Disqualified for suspicious activity violation",
        })
        .where(eq(examAttempts.id, Number(attemptId)));

      return NextResponse.json({ success: true, message: "Attempt disqualified" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Monitoring action error:", error);
    return NextResponse.json({ error: "Failed to perform monitoring action" }, { status: 500 });
  }
}
