import "dotenv/config";
import { seedDatabase } from "./seed";
import { pool } from "./index";

seedDatabase()
  .then(async () => {
    console.log("Seeding complete.");
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Seeding error:", err);
    await pool.end();
    process.exit(1);
  });
