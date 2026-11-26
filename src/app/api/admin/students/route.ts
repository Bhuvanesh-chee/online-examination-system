import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { users, examAttempts } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { originGuard } from "@/lib/origin-guard";

async function findStudent(id: unknown) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;
  const [target] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, numericId), eq(users.role, "student")))
    .limit(1);
  return target ?? null;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        studentId: users.studentId,
        department: users.department,
        phone: users.phone,
        isActive: users.isActive,
        approvalStatus: users.approvalStatus,
        approvedAt: users.approvedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "student"))
      .orderBy(desc(users.createdAt));

    // Calculate exam attempts per student
    const stats = await db
      .select({
        studentId: examAttempts.studentId,
        attemptsCount: sql<number>`count(*)`,
        avgScore: sql<number>`coalesce(avg(${examAttempts.totalScore}), 0)`,
        passedCount: sql<number>`count(case when ${examAttempts.isPassed} then 1 end)`,
      })
      .from(examAttempts)
      .groupBy(examAttempts.studentId);

    const statsMap = new Map(stats.map((s) => [s.studentId, s]));

    const result = students.map((stu) => {
      const sStat = statsMap.get(stu.id);
      return {
        ...stu,
        totalAttempts: Number(sStat?.attemptsCount || 0),
        averageScore: Math.round(Number(sStat?.avgScore || 0) * 10) / 10,
        passedCount: Number(sStat?.passedCount || 0),
      };
    });

    return NextResponse.json({ students: result });
  } catch (error) {
    console.error("Fetch students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
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
    const { action, studentId, isActive, newPassword, name, email, department } = body;

    if (action === "toggle-status") {
      const target = await findStudent(studentId);
      if (!target) {
        return NextResponse.json({ error: "Student account not found" }, { status: 404 });
      }
      await db
        .update(users)
        .set({ isActive: Boolean(isActive), updatedAt: new Date() })
        .where(eq(users.id, target.id));
      return NextResponse.json({ success: true, message: "Status updated" });
    }

    if (action === "approve") {
      const target = await findStudent(studentId);
      if (!target) {
        return NextResponse.json({ error: "Student account not found" }, { status: 404 });
      }
      await db
        .update(users)
        .set({
          approvalStatus: "approved",
          approvedAt: new Date(),
          approvedBy: user.id,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, target.id));
      return NextResponse.json({ success: true, message: "Student approved" });
    }

    if (action === "reject") {
      const target = await findStudent(studentId);
      if (!target) {
        return NextResponse.json({ error: "Student account not found" }, { status: 404 });
      }
      await db
        .update(users)
        .set({ approvalStatus: "rejected", updatedAt: new Date() })
        .where(eq(users.id, target.id));
      return NextResponse.json({ success: true, message: "Student rejected" });
    }

    if (action === "reset-password") {
      const target = await findStudent(studentId);
      if (!target) {
        return NextResponse.json({ error: "Student account not found" }, { status: 404 });
      }
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      await db
        .update(users)
        .set({ password: hash, updatedAt: new Date() })
        .where(eq(users.id, target.id));
      return NextResponse.json({ success: true, message: "Password reset successfully" });
    }

    if (action === "create-student") {
      if (!name || !email || !newPassword) {
        return NextResponse.json({ error: "Name, email, and password required" }, { status: 400 });
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      const [newStudent] = await db
        .insert(users)
        .values({
          name: String(name).trim(),
          email: String(email).trim().toLowerCase(),
          password: hash,
          role: "student",
          studentId: body.customStudentId || `STU-${Date.now().toString().slice(-5)}`,
          department: department || "Computer Science and Engineering",
          isActive: true,
          approvalStatus: "approved",
          approvedAt: new Date(),
          approvedBy: user.id,
        })
        .returning();
      return NextResponse.json({ success: true, student: newStudent });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Student action error:", error);
    return NextResponse.json({ error: "Failed to perform student action" }, { status: 500 });
  }
}
