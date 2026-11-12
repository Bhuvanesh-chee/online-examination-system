import { db } from "./index";
import {
  users,
  questionBanks,
  questions,
  examinations,
  examQuestions,
  examAttempts,
  studentAnswers,
} from "./schema";
import { eq, and } from "drizzle-orm";

type QDef = {
  text: string;
  type: "mcq" | "descriptive";
  options?: { id: string; text: string }[];
  correctOption?: string;
  explanation?: string;
  guide?: string;
  marks: number;
  negativeMarks: number;
  difficulty: "easy" | "medium" | "hard";
};

const mcq = (
  text: string,
  options: [string, string, string, string],
  correctOption: string,
  explanation: string,
  difficulty: QDef["difficulty"] = "medium"
): QDef => ({
  text,
  type: "mcq",
  options: ["a", "b", "c", "d"].map((id, i) => ({ id, text: options[i] })),
  correctOption,
  explanation,
  marks: 4,
  negativeMarks: 1,
  difficulty,
});

const essay = (
  text: string,
  guide: string,
  difficulty: QDef["difficulty"] = "medium"
): QDef => ({
  text,
  type: "descriptive",
  guide,
  marks: 10,
  negativeMarks: 0,
  difficulty,
});

/** 20 MCQs (4 marks each) + 5 descriptive questions (10 marks each) = 130 marks */
const JAVA_QUESTIONS: QDef[] = [
  mcq(
    "Which Java keyword is used to prevent a class from being inherited (subclassed)?",
    ["static", "final", "sealed", "abstract"],
    "b",
    "A class declared `final` cannot be extended. Records and enums are implicitly final.",
    "easy"
  ),
  mcq(
    "Which Java collection type guarantees that it will never contain duplicate elements?",
    ["java.util.List", "java.util.Set", "java.util.Map", "java.util.Queue"],
    "b",
    "The Set contract forbids duplicates (decided via equals/hashCode for HashSet, compareTo for TreeSet).",
    "easy"
  ),
  mcq(
    "Which class is the ultimate superclass of every class in Java?",
    ["java.lang.Class", "java.lang.Object", "java.lang.System", "java.io.Serializable"],
    "b",
    "java.lang.Object is the root of the class hierarchy and declares equals(), hashCode(), toString() and getClass().",
    "easy"
  ),
  mcq(
    "What is the correct signature of the standard Java application entry point?",
    [
      "public void main(String[] args)",
      "static void main(String args)",
      "public static void main(String[] args)",
      "public static int main(String args[])",
    ],
    "c",
    "The JVM looks for `public static void main(String[] args)` — public, static, void, and taking a String array.",
    "easy"
  ),
  mcq(
    "Method overriding in Java is an example of which object-oriented principle?",
    [
      "Compile-time (static) polymorphism",
      "Runtime (dynamic) polymorphism",
      "Encapsulation",
      "Composition",
    ],
    "b",
    "Overriding is resolved at runtime by dynamic method dispatch. Overloading is resolved at compile time.",
    "medium"
  ),
  mcq(
    "Which component of the Java platform is responsible for executing compiled `.class` bytecode?",
    [
      "JDK (Java Development Kit)",
      "JRE launcher only",
      "JVM (Java Virtual Machine)",
      "javac compiler",
    ],
    "c",
    "javac compiles source to bytecode; the JVM loads, verifies and executes it — giving 'write once, run anywhere' portability.",
    "medium"
  ),
  mcq(
    "Which of the following is a checked exception in Java?",
    ["NullPointerException", "ArrayIndexOutOfBoundsException", "IOException", "IllegalArgumentException"],
    "c",
    "IOException extends Exception (not RuntimeException), so it must be caught or declared with `throws`.",
    "medium"
  ),
  mcq(
    "What is the default value of a local variable declared inside a Java method?",
    [
      "null",
      "0",
      "false",
      "There is no default — it must be initialized before use",
    ],
    "d",
    "Local variables are never default-initialized; only fields get defaults (0, false, null).",
    "hard"
  ),
  mcq(
    "In which JVM memory area are objects instantiated with the `new` keyword allocated?",
    ["Thread stack", "Heap", "Metaspace", "Program counter register"],
    "b",
    "All class instances and arrays live on the shared heap; object references themselves are held in thread stacks.",
    "easy"
  ),
  mcq(
    "Which class should be preferred over String when performing thousands of concatenations inside a loop?",
    ["String", "StringBuilder", "Character", "CharSequence"],
    "b",
    "String is immutable, so each concatenation allocates a new object. StringBuilder is mutable (StringBuffer is its synchronized cousin).",
    "easy"
  ),
  mcq(
    "For two String objects s1 and s2, what is the difference between `s1 == s2` and `s1.equals(s2)`?",
    [
      "`==` compares content, `equals` compares references",
      "`==` compares references, `equals` compares content",
      "Both are identical for String",
      "`==` works only on primitives",
    ],
    "b",
    "`==` tests reference identity; String.equals() (overridden) compares character content.",
    "medium"
  ),
  mcq(
    "Which interface must a resource implement to be declared in a try-with-resources statement?",
    ["java.io.Serializable", "java.lang.AutoCloseable", "java.lang.Runnable", "java.util.Iterator"],
    "b",
    "try-with-resources requires AutoCloseable (Closeable extends it); its close() is invoked automatically.",
    "medium"
  ),
  mcq(
    "What is the average time complexity of `get(index)` on a java.util.ArrayList?",
    ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    "a",
    "ArrayList is backed by a contiguous array, so indexed access is constant time. Insertion in the middle is O(n).",
    "easy"
  ),
  mcq(
    "If a class member is declared with no access modifier, where is it visible?",
    [
      "Only inside the declaring class",
      "Only inside subclasses",
      "Any class in the same package",
      "Every class in the JVM",
    ],
    "c",
    "That is package-private (default) access: visible to all classes in the same package, but not to subclasses in other packages.",
    "medium"
  ),
  mcq(
    "What is the result of the expression `10 / 3` when both operands are int in Java?",
    ["3.33", "3", "4", "Compilation error"],
    "b",
    "Integer division truncates toward zero, giving 3. Use 10 / 3.0 (or a cast) to obtain 3.333...",
    "easy"
  ),
  mcq(
    "Which keyword explicitly invokes a superclass constructor or accesses an overridden superclass method?",
    ["this", "parent", "super", "base"],
    "c",
    "`super(...)` must be the first statement of a constructor when used; `super.method()` reaches the parent implementation.",
    "easy"
  ),
  mcq(
    "Which statement about `static` methods is correct?",
    [
      "They can directly access instance variables of the same class",
      "They can only access static members directly and have no `this` reference",
      "They are dispatched dynamically at runtime",
      "They cannot be overloaded",
    ],
    "b",
    "Static members belong to the class, not an instance, so no `this` exists and instance fields need an object reference.",
    "medium"
  ),
  mcq(
    "How many null keys can a java.util.HashMap hold?",
    ["None", "Exactly one", "Unlimited", "It depends on the initial capacity"],
    "b",
    "HashMap permits one null key (stored in bucket 0) but any number of null values. Hashtable and ConcurrentHashMap permit none.",
    "medium"
  ),
  mcq(
    "Which of the following is a functional interface (exactly one abstract method) in Java 8+?",
    ["java.lang.Runnable", "java.util.List", "java.lang.String", "java.util.Date"],
    "a",
    "Runnable declares only run(), so it is a valid lambda target: `Runnable r = () -> System.out.println(\"go\");`",
    "medium"
  ),
  mcq(
    "When does a `finally` block associated with a try statement NOT execute?",
    [
      "When the try block executes a return statement",
      "When an exception is thrown inside the try block",
      "When System.exit() terminates the JVM first",
      "It always executes, without exception",
    ],
    "c",
    "finally runs for normal completion, return, and exceptions — but System.exit() (or a JVM crash) ends the process before it can run.",
    "hard"
  ),
  essay(
    "Explain encapsulation and describe how Java's four access levels (private, package-private/default, protected, public) enforce it. Give a realistic example where encapsulation prevents an invalid object state.",
    "Expect: private fields + controlled accessors; invariants validated in setters (e.g. bank balance can never go negative, age must be >= 0); protected = same package + subclasses; default = same package only; public = API surface; defensive copying for mutable fields to avoid representation exposure; immutability as the strongest form. Award up to 10 for correct access-level semantics plus a concrete validated example.",
    "medium"
  ),
  essay(
    "Differentiate checked and unchecked exceptions in Java. Illustrate with the exception hierarchy and explain when you should catch, declare with throws, or wrap and rethrow.",
    "Expect: Throwable -> Error (not recoverable) and Exception; RuntimeException and subclasses are unchecked, everything else under Exception is checked; checked exceptions must be caught or declared and represent recoverable external failures (IOException, SQLException); unchecked signal programming bugs (NPE, IllegalArgumentException, ArrayIndexOutOfBounds); best practice: catch only what you can handle, never swallow, wrap in a domain exception preserving the cause, try-with-resources for cleanup, multi-catch to reduce duplication, avoid catch(Exception).",
    "medium"
  ),
  essay(
    "Describe how java.util.HashMap stores and retrieves entries internally. Cover hashing, bucket indexing, collision handling, treeification, load factor and resizing.",
    "Expect: table is a Node array (default capacity 16); key.hashCode() is spread with (h ^ (h >>> 16)); index = (n - 1) & hash; equals() disambiguates entries with the same hash; collisions chain in a linked list and are treeified into a red-black tree when a bin reaches 8 nodes and capacity >= 64 (O(log n) worst case); default load factor 0.75 triggers resize to double capacity and rehash; one null key lives in bin 0; average get/put is O(1).",
    "hard"
  ),
  essay(
    "Explain the differences between an interface and an abstract class in Java. Include when you would choose each, and mention at least three concrete language differences.",
    "Expect at least 3 of: abstract classes may hold state and constructors while interfaces cannot hold instance state; a class can implement many interfaces but extend only one class; interfaces support default/static/private methods since Java 8/9; abstract class members may use any access modifier while interface methods are implicitly public; choose abstract class for shared implementation/template-method design, interface for capability contracts and multiple inheritance of type.",
    "medium"
  ),
  essay(
    "Describe how garbage collection works in the JVM. Explain reachability and generations, and clearly distinguish the keywords `final`, `finally`, and `finalize()`.",
    "Expect: heap split into young (Eden + survivor spaces) and old generation; minor GC evacuates young objects, major/full GC covers old gen; objects unreachable from GC roots are collectible; modern JVM uses generational tracing collectors (G1, ZGC). Distinguish: final = non-reassignable variable / non-extendable class / non-overridable method; finally = block that always executes after try/catch; finalize() = deprecated Object hook invoked before collection.",
    "hard"
  ),
];

export async function seedJavaExam(): Promise<{
  created: boolean;
  examId?: number;
  questionCount: number;
  demoAttemptCreated: boolean;
}> {
  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@exam.edu"))
    .limit(1);

  if (!admin) {
    throw new Error("Admin account not found. Seed the base database first.");
  }

  // 1. Question bank (upsert by name)
  const bankName = "Java Programming & Object-Oriented Design";
  let [bank] = await db
    .select()
    .from(questionBanks)
    .where(eq(questionBanks.name, bankName))
    .limit(1);

  if (!bank) {
    [bank] = await db
      .insert(questionBanks)
      .values({
        name: bankName,
        description:
          "Core Java syntax, OOP pillars, collections framework, exception handling, JVM internals and garbage collection.",
        category: "Programming Languages",
      })
      .returning();
  }

  // 2. Questions (upsert by bank + prompt text)
  const rows: { id: number; marks: number }[] = [];
  for (const def of JAVA_QUESTIONS) {
    const [existing] = await db
      .select({ id: questions.id, marks: questions.marks })
      .from(questions)
      .where(and(eq(questions.bankId, bank.id), eq(questions.questionText, def.text)))
      .limit(1);

    if (existing) {
      rows.push({ id: existing.id, marks: existing.marks });
      continue;
    }

    const [inserted] = await db
      .insert(questions)
      .values({
        bankId: bank.id,
        questionText: def.text,
        type: def.type,
        options: def.options ?? null,
        correctOption: def.correctOption ?? null,
        descriptiveGuide: def.guide ?? null,
        explanation: def.explanation ?? null,
        marks: def.marks,
        negativeMarks: def.negativeMarks,
        difficulty: def.difficulty,
      })
      .returning({ id: questions.id, marks: questions.marks });

    rows.push({ id: inserted.id, marks: inserted.marks });
  }

  const totalMarks = rows.reduce((sum, r) => sum + Number(r.marks), 0);
  const passingMarks = Math.round(totalMarks * 0.4);

  // 3. Examination (create or refresh configuration)
  const [existingExam] = await db
    .select()
    .from(examinations)
    .where(eq(examinations.code, "JAVA-2026"))
    .limit(1);

  let examId: number;
  let created = false;

  if (existingExam) {
    await db
      .update(examinations)
      .set({
        title: "JAVA101: Java Programming & Object-Oriented Design",
        description: `A complete ${rows.length}-question demonstration assessment covering Java fundamentals: OOP pillars, the collections framework, exception handling, JVM execution model and garbage collection.`,
        subject: "Java Programming",
        durationMinutes: 45,
        totalMarks,
        passingMarks,
        instructions: `1. This paper has ${rows.filter((_, i) => JAVA_QUESTIONS[i].type === "mcq").length} Multiple Choice Questions (4 marks each, -1 for a wrong answer) and ${rows.filter((_, i) => JAVA_QUESTIONS[i].type === "descriptive").length} Descriptive Questions (10 marks each).\n2. Read every question carefully — question order and options are shuffled for each candidate.\n3. Answers save automatically; the palette shows answered, unanswered and marked-for-review states.\n4. Leaving the tab or exiting fullscreen is logged as a proctoring violation.\n5. The exam auto-submits when the 45-minute timer expires.`,
        shuffleQuestions: true,
        shuffleOptions: true,
        allowReview: true,
        maxAttempts: 2,
        status: "published",
        startTime: new Date(Date.now() - 60 * 60 * 1000),
        endTime: new Date(Date.now() + 60 * 24 * 3600 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(examinations.id, existingExam.id));

    examId = existingExam.id;
  } else {
    const [exam] = await db
      .insert(examinations)
      .values({
        title: "JAVA101: Java Programming & Object-Oriented Design",
        code: "JAVA-2026",
        description: `A complete ${rows.length}-question demonstration assessment covering Java fundamentals: OOP pillars, the collections framework, exception handling, JVM execution model and garbage collection.`,
        subject: "Java Programming",
        durationMinutes: 45,
        totalMarks,
        passingMarks,
        instructions:
          "All questions are compulsory. MCQs carry 4 marks with 1 mark negative marking; descriptive questions carry 10 marks and are graded manually. The exam auto-submits when the timer expires.",
        shuffleQuestions: true,
        shuffleOptions: true,
        allowReview: true,
        maxAttempts: 2,
        status: "published",
        startTime: new Date(Date.now() - 60 * 60 * 1000),
        endTime: new Date(Date.now() + 60 * 24 * 3600 * 1000),
        createdBy: admin.id,
      })
      .returning();
    examId = exam.id;
    created = true;
  }

  // 4. Link questions (only when no candidate is mid-exam)
  const live = await db
    .select({ id: examAttempts.id })
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.status, "in_progress")));

  if (live.length === 0) {
    await db.delete(examQuestions).where(eq(examQuestions.examId, examId));
    await db.insert(examQuestions).values(
      rows.map((row, index) => ({
        examId,
        questionId: row.id,
        questionOrder: index + 1,
        marks: row.marks,
      }))
    );
  }

  // 5. Demo evaluated attempt so reports/analytics show real Java data
  let demoAttemptCreated = false;
  const [ananya] = await db
    .select()
    .from(users)
    .where(eq(users.email, "ananya@exam.edu"))
    .limit(1);

  if (ananya) {
    const [existingAttempt] = await db
      .select({ id: examAttempts.id })
      .from(examAttempts)
      .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, ananya.id)))
      .limit(1);

    if (!existingAttempt) {
      let mcqScore = 0;
      let descriptiveScore = 0;
      const answerRows: {
        questionId: number;
        selectedOption: string | null;
        descriptiveAnswer: string | null;
        isCorrect: boolean | null;
        marksAwarded: number;
        teacherFeedback: string | null;
      }[] = [];

      rows.forEach((row, index) => {
        const def = JAVA_QUESTIONS[index];

        if (def.type === "mcq") {
          // Answer the first 17 MCQs correctly, miss the last 3
          const isCorrect = index < 17;
          const awarded = isCorrect ? def.marks : -def.negativeMarks;
          mcqScore += awarded;
          answerRows.push({
            questionId: row.id,
            selectedOption: isCorrect ? def.correctOption! : "a",
            descriptiveAnswer: null,
            isCorrect,
            marksAwarded: awarded,
            teacherFeedback: null,
          });
        } else {
          const awarded = [8, 7, 9, 6, 5][index - 20] ?? 6;
          descriptiveScore += awarded;
          answerRows.push({
            questionId: row.id,
            selectedOption: null,
            descriptiveAnswer:
              "Demo response submitted for the Java assessment. Covers the requested concepts with supporting examples.",
            isCorrect: null,
            marksAwarded: awarded,
            teacherFeedback:
              awarded >= 8
                ? "Excellent, well organised answer with correct terminology and examples."
                : "Good attempt — expand technical depth and add a concrete code example.",
          });
        }
      });

      mcqScore = Math.max(0, mcqScore);
      const totalScore = mcqScore + descriptiveScore;
      const start = new Date(Date.now() - 30 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 38 * 60 * 1000);

      const [attempt] = await db
        .insert(examAttempts)
        .values({
          examId,
          studentId: ananya.id,
          attemptNumber: 1,
          status: "evaluated",
          startTime: start,
          endTime: end,
          timeSpentSeconds: 38 * 60,
          mcqScore,
          descriptiveScore,
          totalScore,
          isPassed: totalScore >= passingMarks,
          tabSwitchCount: 0,
          fullscreenExitCount: 0,
          evaluationNotes:
            "Demo Java attempt — automatically graded MCQs plus manually evaluated descriptive answers.",
          evaluatedAt: new Date(),
          evaluatedBy: admin.id,
        })
        .returning();

      await db.insert(studentAnswers).values(
        answerRows.map((a) => ({ ...a, attemptId: attempt.id }))
      );

      demoAttemptCreated = true;
    }
  }

  return {
    created,
    examId,
    questionCount: rows.length,
    demoAttemptCreated,
  };
}
