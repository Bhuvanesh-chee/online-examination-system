import { sql } from "drizzle-orm";
import { databaseIssueResponse, getDatabaseIssue } from "@/lib/database-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const configurationIssue = getDatabaseIssue();
  if (configurationIssue) return databaseIssueResponse(configurationIssue);

  try {
    // Import only after checking configuration so the route can report a
    // missing DATABASE_URL in JSON rather than crashing during module import.
    const { db } = await import("@/db");
    await db.execute(sql`select 1`);
    return Response.json(
      { ok: true, database: "ready" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Database readiness check failed:", error);
    return databaseIssueResponse(
      getDatabaseIssue(error) ?? {
        code: "DB_UNAVAILABLE",
        error: "The examination database is unavailable on this deployment. Verify its server-side PostgreSQL connection and try again.",
      }
    );
  }
}
