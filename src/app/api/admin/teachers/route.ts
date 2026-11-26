import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { users, teacherAllocations } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { originGuard } from "@/lib/origin-guard";

async function findTeacher(id: unknown) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;
  const [target] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, numericId), eq(users.role, "teacher")))
    .limit(1);
  return target ?? null;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const teachers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        department: users.department,
        phone: users.phone,
        isActive: users.isActive,
        approvalStatus: users.approvalStatus,
        approvedAt: users.approvedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "teacher"))
      .orderBy(desc(users.createdAt));

    const allocationCounts = await db
      .select({
        teacherId: teacherAllocations.teacherId,
        count: sql<number>`count(*)`,
      })
      .from(teacherAllocations)
      .groupBy(teacherAllocations.teacherId);

    const countMap = new Map(allocationCounts.map((row) => [row.teacherId, Number(row.count)]));

    return NextResponse.json({
      teachers: teachers.map((teacher) => ({
        ...teacher,
        allocatedStudents: countMap.get(teacher.id) || 0,
      })),
    });
  } catch (error) {
    console.error("Fetch teachers error:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
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
    const { action, teacherId, isActive, newPassword, name, email, department } = body;

    if (action === "create-teacher") {
      if (!name || !email || !newPassword) {
        return NextResponse.json({ error: "Name, email, and password required" }, { status: 400 });
      }
      if (String(newPassword).length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      const normalizedEmail = String(email).trim().toLowerCase();
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email address already exists.", code: "EMAIL_TAKEN" },
          { status: 409 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(String(newPassword), salt);
      const [newTeacher] = await db
        .insert(users)
        .values({
          name: String(name).trim(),
          email: normalizedEmail,
          password: hash,
          role: "teacher",
          department: department || "Computer Science and Engineering",
          isActive: true,
          approvalStatus: "pending",
        })
        .returning();
      return NextResponse.json({ success: true, teacher: newTeacher });
    }

    if (action === "approve") {
      const target = await findTeacher(teacherId);
      if (!target) {
        return NextResponse.json({ error: "Teacher account not found" }, { status: 404 });
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
      return NextResponse.json({ success: true, message: "Teacher approved" });
    }

    if (action === "reject") {
      const target = await findTeacher(teacherId);
      if (!target) {
        return NextResponse.json({ error: "Teacher account not found" }, { status: 404 });
      }
      await db
        .update(users)
        .set({ approvalStatus: "rejected", updatedAt: new Date() })
        .where(eq(users.id, target.id));
      return NextResponse.json({ success: true, message: "Teacher rejected" });
    }

    if (action === "toggle-status") {
      const target = await findTeacher(teacherId);
      if (!target) {
        return NextResponse.json({ error: "Teacher account not found" }, { status: 404 });
      }
      await db
        .update(users)
        .set({ isActive: Boolean(isActive), updatedAt: new Date() })
        .where(eq(users.id, target.id));
      return NextResponse.json({ success: true, message: "Status updated" });
    }

    if (action === "reset-password") {
      const target = await findTeacher(teacherId);
      if (!target) {
        return NextResponse.json({ error: "Teacher account not found" }, { status: 404 });
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

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Teacher action error:", error);
    return NextResponse.json({ error: "Failed to perform teacher action" }, { status: 500 });
  }
}
