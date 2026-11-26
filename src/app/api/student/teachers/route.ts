import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { users, teacherAllocations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const student = await requireRole(["student"]);
    if (!student) {
      return NextResponse.json({ error: "Student access required" }, { status: 403 });
    }

    const teachers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        department: users.department,
      })
      .from(teacherAllocations)
      .innerJoin(users, eq(teacherAllocations.teacherId, users.id))
      .where(eq(teacherAllocations.studentId, student.id))
      .orderBy(asc(users.name));

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Student teachers error:", error);
    return NextResponse.json({ error: "Failed to load assigned teachers" }, { status: 500 });
  }
}
