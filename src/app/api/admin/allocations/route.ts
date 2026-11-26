import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { users, teacherAllocations } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { originGuard } from "@/lib/origin-guard";

const teacherUser = alias(users, "teacher_user");
const studentUser = alias(users, "student_user");

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const rows = await db
      .select({
        id: teacherAllocations.id,
        teacherId: teacherUser.id,
        teacherName: teacherUser.name,
        teacherEmail: teacherUser.email,
        studentId: studentUser.id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        studentRoll: studentUser.studentId,
        createdAt: teacherAllocations.createdAt,
      })
      .from(teacherAllocations)
      .innerJoin(teacherUser, eq(teacherAllocations.teacherId, teacherUser.id))
      .innerJoin(studentUser, eq(teacherAllocations.studentId, studentUser.id))
      .orderBy(desc(teacherAllocations.createdAt));

    return NextResponse.json({ allocations: rows });
  } catch (error) {
    console.error("Fetch allocations error:", error);
    return NextResponse.json({ error: "Failed to fetch allocations" }, { status: 500 });
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
    const teacherId = Number(body.teacherId);
    const studentId = Number(body.studentId);

    if (!Number.isInteger(teacherId) || !Number.isInteger(studentId) || teacherId <= 0 || studentId <= 0) {
      return NextResponse.json({ error: "A valid teacher and student are required." }, { status: 400 });
    }

    const [teacher] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, teacherId), eq(users.role, "teacher")))
      .limit(1);
    const [student] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, studentId), eq(users.role, "student")))
      .limit(1);

    if (!teacher) {
      return NextResponse.json({ error: "Teacher account not found." }, { status: 404 });
    }
    if (!student) {
      return NextResponse.json({ error: "Student account not found." }, { status: 404 });
    }
    if (teacher.approvalStatus !== "approved" || !teacher.isActive) {
      return NextResponse.json(
        { error: "Only approved and active teachers can be allocated." },
        { status: 400 }
      );
    }
    if (student.approvalStatus !== "approved" || !student.isActive) {
      return NextResponse.json(
        { error: "Only approved and active students can be allocated." },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(teacherAllocations)
      .values({ teacherId, studentId, assignedBy: user.id })
      .onConflictDoNothing({
        target: [teacherAllocations.teacherId, teacherAllocations.studentId],
      })
      .returning({ id: teacherAllocations.id });

    if (inserted.length === 0) {
      return NextResponse.json(
        { error: "This teacher is already allocated to that student.", code: "ALREADY_ALLOCATED" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, id: inserted[0].id });
  } catch (error) {
    console.error("Create allocation error:", error);
    return NextResponse.json({ error: "Failed to create allocation" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const blocked = originGuard(request);
  if (blocked) return blocked;

  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "A valid allocation id is required." }, { status: 400 });
    }

    const removed = await db
      .delete(teacherAllocations)
      .where(eq(teacherAllocations.id, id))
      .returning({ id: teacherAllocations.id });

    if (removed.length === 0) {
      return NextResponse.json({ error: "Allocation not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete allocation error:", error);
    return NextResponse.json({ error: "Failed to remove allocation" }, { status: 500 });
  }
}
