import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { questionBanks, questions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const banks = await db.select().from(questionBanks);

    // Count questions per bank
    const counts = await db
      .select({
        bankId: questions.bankId,
        count: sql<number>`count(*)`,
      })
      .from(questions)
      .groupBy(questions.bankId);

    const countMap = new Map(counts.map((c) => [c.bankId, Number(c.count)]));

    const result = banks.map((bank) => ({
      ...bank,
      questionCount: countMap.get(bank.id) || 0,
    }));

    return NextResponse.json({ banks: result });
  } catch (error) {
    console.error("Fetch banks error:", error);
    return NextResponse.json({ error: "Failed to fetch question banks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category } = body;

    if (!name) {
      return NextResponse.json({ error: "Bank name is required" }, { status: 400 });
    }

    const [newBank] = await db
      .insert(questionBanks)
      .values({
        name: name.trim(),
        description: description || null,
        category: category || "General",
      })
      .returning();

    return NextResponse.json({ success: true, bank: newBank });
  } catch (error) {
    console.error("Create bank error:", error);
    return NextResponse.json({ error: "Failed to create question bank" }, { status: 500 });
  }
}
