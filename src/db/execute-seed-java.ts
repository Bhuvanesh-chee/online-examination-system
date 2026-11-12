import "dotenv/config";
import { seedJavaExam } from "./seed-java";
import { pool } from "./index";

seedJavaExam()
  .then(async (result) => {
    console.log(
      `Java exam ${result.created ? "created" : "updated"} (exam id ${result.examId}) with ${result.questionCount} questions.` +
        (result.demoAttemptCreated ? " Demo graded attempt added." : "")
    );
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Java seed error:", err);
    await pool.end();
    process.exit(1);
  });
