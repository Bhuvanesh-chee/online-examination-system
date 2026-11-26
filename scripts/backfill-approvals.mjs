import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("DATABASE_URL or POSTGRES_URL is required.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();
  try {
    const admins = await client.query(
      `UPDATE users
          SET approval_status = 'approved',
              approved_at = COALESCE(approved_at, NOW()),
              is_active = true,
              updated_at = NOW()
        WHERE role = 'admin'
          AND (approval_status <> 'approved' OR is_active = false)
        RETURNING id`
    );

    const students = await client.query(
      `UPDATE users
          SET approval_status = 'approved',
              approved_at = COALESCE(approved_at, NOW()),
              updated_at = NOW()
        WHERE role = 'student'
          AND approval_status = 'pending'
        RETURNING id`
    );

    console.log("Backfill complete:");
    console.log(`  Admins approved/activated : ${admins.rowCount}`);
    console.log(`  Existing students approved: ${students.rowCount}`);
    console.log("Newly registered students after this run stay pending for admin review.");
  } finally {
    await client.end();
  }
}

main().catch(async (error) => {
  console.error("Backfill failed:", error);
  try {
    await client.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
