import { NextResponse } from "next/server";

/** Never send the database URL, username or password to the browser. */
export function hasDatabaseConfiguration(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export type DatabaseIssue = {
  code: "DB_NOT_CONFIGURED" | "DB_SCHEMA_MISSING" | "DB_UNAVAILABLE";
  error: string;
};

export function getDatabaseIssue(error?: unknown): DatabaseIssue | null {
  if (!hasDatabaseConfiguration()) {
    return {
      code: "DB_NOT_CONFIGURED",
      error:
        "This website deployment has no PostgreSQL connection. Set DATABASE_URL on the server (not in Chrome), or open the project's latest working Preview link.",
    };
  }

  let cause: unknown = error;
  for (let depth = 0; depth < 4 && cause; depth++) {
    const obj = cause as { code?: string; message?: string; cause?: unknown };
    const message = typeof obj.message === "string" ? obj.message : "";
    if (obj.code === "42P01" || /relation [\s\S]* does not exist/i.test(message)) {
      return {
        code: "DB_SCHEMA_MISSING",
        error: "The database is connected but its exam tables are missing. Run npx drizzle-kit push on the server, then load the demo data.",
      };
    }
    if (
      ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EHOSTUNREACH", "28P01", "3D000", "57P01"].includes(obj.code || "") ||
      /DATABASE_URL is required|connection refused|failed to connect|timeout connecting|password authentication failed/i.test(message)
    ) {
      return {
        code: "DB_UNAVAILABLE",
        error: "The examination database cannot be reached from this website deployment. Check its server-side DATABASE_URL and PostgreSQL service, or open the latest working Preview link.",
      };
    }
    cause = obj.cause;
  }
  return null;
}

export function databaseIssueResponse(issue: DatabaseIssue): NextResponse {
  return NextResponse.json(issue, {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
}
