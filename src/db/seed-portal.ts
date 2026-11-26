import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, pool } from "./index";
import {
  users,
  questionBanks,
  questions,
  examinations,
  examQuestions,
  examAttempts,
  studentAnswers,
  teacherAllocations,
} from "./schema";
import { eq } from "drizzle-orm";

type Mcq = {
  topic: string;
  text: string;
  options: [string, string, string, string];
  correct: "a" | "b" | "c" | "d";
  explanation: string;
};

/** 15 Java MCQs — one per required topic */
const JAVA_MCQS: Mcq[] = [
  {
    topic: "Java Fundamentals",
    text: "Which of the following is the correct signature of the main method that the JVM invokes?",
    options: [
      "public void main(String args)",
      "public static void main(String[] args)",
      "static public int main(String[] args)",
      "public static main(String[] args)",
    ],
    correct: "b",
    explanation:
      "The JVM looks for `public static void main(String[] args)` — public so it is reachable, static so no object is needed, and void because it returns nothing.",
  },
  {
    topic: "Data Types",
    text: "What is the size of the Java `int` primitive data type?",
    options: ["2 bytes (16 bits)", "4 bytes (32 bits)", "8 bytes (64 bits)", "It depends on the operating system"],
    correct: "b",
    explanation:
      "`int` is always 32 bits in Java. Unlike C/C++, primitive sizes are fixed by the specification, which is why Java is platform-independent.",
  },
  {
    topic: "Variables",
    text: "Which keyword is used to declare a variable whose value cannot be changed after assignment?",
    options: ["static", "final", "const", "immutable"],
    correct: "b",
    explanation:
      "`final int MAX = 100;` makes the variable a constant. `const` is a reserved but unused keyword in Java.",
  },
  {
    topic: "Operators",
    text: "What is the value of the expression `10 % 3` in Java?",
    options: ["3", "1", "3.33", "0"],
    correct: "b",
    explanation: "The `%` (modulus) operator returns the remainder: 10 divided by 3 leaves a remainder of 1.",
  },
  {
    topic: "Conditional Statements",
    text: "Which statement is best suited for checking a variable against many constant values in a single construct?",
    options: ["if-else ladder", "switch statement", "while loop", "do-while loop"],
    correct: "b",
    explanation:
      "A `switch` selects one branch among several constant cases and is cleaner and faster than a long if-else chain.",
  },
  {
    topic: "Loops",
    text: "How many times does the body of `for (int i = 0; i < 5; i++)` execute?",
    options: ["4 times", "5 times", "6 times", "Infinite times"],
    correct: "b",
    explanation: "i takes values 0, 1, 2, 3, 4 — that is five iterations. The loop stops when i == 5.",
  },
  {
    topic: "Arrays",
    text: "What is the default value of each element in a newly created `int[]` array in Java?",
    options: ["null", "0", "1", "Undefined"],
    correct: "b",
    explanation: "Array elements are always initialised to the type's default — 0 for int, false for boolean, null for objects.",
  },
  {
    topic: "Strings",
    text: "Which method should be used to compare the contents of two String objects?",
    options: ["==", "equals()", "compare()", "toString()"],
    correct: "b",
    explanation:
      "`==` compares object references, whereas `equals()` on String is overridden to compare the actual character content.",
  },
  {
    topic: "Object-Oriented Programming",
    text: "Which of the following is NOT one of the four pillars of object-oriented programming?",
    options: ["Encapsulation", "Inheritance", "Compilation", "Polymorphism"],
    correct: "c",
    explanation:
      "The four pillars are encapsulation, inheritance, polymorphism and abstraction. Compilation is a build step, not an OOP principle.",
  },
  {
    topic: "Inheritance",
    text: "Which keyword is used by a subclass to inherit from a superclass in Java?",
    options: ["implements", "extends", "inherits", "super"],
    correct: "b",
    explanation:
      "Classes use `extends` for inheritance; `implements` is used for interfaces, and `super` refers to the parent implementation.",
  },
  {
    topic: "Polymorphism",
    text: "Method overriding in Java is an example of which type of polymorphism?",
    options: ["Compile-time polymorphism", "Runtime polymorphism", "Operator overloading", "Static binding"],
    correct: "b",
    explanation:
      "Overriding is resolved at runtime by dynamic method dispatch based on the actual object type. Overloading is compile-time polymorphism.",
  },
  {
    topic: "Encapsulation",
    text: "What is the standard Java technique for achieving encapsulation?",
    options: [
      "Declare all fields public",
      "Declare fields private and expose public getters/setters",
      "Use only static methods",
      "Make the class abstract",
    ],
    correct: "b",
    explanation:
      "Hiding state behind private fields and controlling access via accessors protects invariants and hides implementation details.",
  },
  {
    topic: "Abstraction",
    text: "Which keyword is used to declare a method that has no body and must be implemented by a subclass?",
    options: ["native", "abstract", "interface", "virtual"],
    correct: "b",
    explanation:
      "An `abstract` method has no body; the containing class must also be abstract and concrete subclasses must implement it.",
  },
  {
    topic: "Exception Handling",
    text: "Which block always executes regardless of whether an exception was thrown in the try block?",
    options: ["catch", "finally", "throw", "try"],
    correct: "b",
    explanation:
      "`finally` runs for normal completion, for a `return`, and also when an exception propagates — ideal for releasing resources.",
  },
  {
    topic: "Collections Framework",
    text: "Which collection class allows duplicate elements and gives constant-time access by index?",
    options: ["HashSet", "ArrayList", "TreeMap", "HashMap"],
    correct: "b",
    explanation:
      "`ArrayList` is a growable array: it permits duplicates, preserves insertion order and offers O(1) indexed access. `HashSet` forbids duplicates.",
  },
];

/** 15 DSA MCQs — one per required topic */
const DSA_MCQS: Mcq[] = [
  {
    topic: "Arrays",
    text: "What is the time complexity of accessing an element by index in an array?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct: "a",
    explanation: "Elements are contiguous, so address arithmetic (base + index × size) finds any element in constant time.",
  },
  {
    topic: "Linked Lists",
    text: "Which technique finds the middle of a singly linked list in a single traversal?",
    options: ["Binary search", "Slow and fast pointers", "Recursion with memoisation", "Stack reversal"],
    correct: "b",
    explanation:
      "Advance one pointer by one node and another by two; when the fast pointer reaches the end, the slow pointer is at the middle.",
  },
  {
    topic: "Stacks",
    text: "A stack follows which order of element access?",
    options: ["FIFO (First In First Out)", "LIFO (Last In First Out)", "Random access", "Priority based"],
    correct: "b",
    explanation: "A stack pushes and pops at the same end (the top), so the most recently inserted element leaves first.",
  },
  {
    topic: "Queues",
    text: "A queue processes elements in which order?",
    options: ["LIFO (Last In First Out)", "FIFO (First In First Out)", "Sorted order", "Reverse insertion order"],
    correct: "b",
    explanation: "A queue inserts at the rear and removes from the front, giving First In First Out behaviour.",
  },
  {
    topic: "Trees",
    text: "How many edges does a tree with n nodes contain?",
    options: ["n", "n - 1", "n + 1", "2n"],
    correct: "b",
    explanation: "Every node except the root has exactly one incoming edge, so a tree with n nodes has n - 1 edges.",
  },
  {
    topic: "Binary Search Trees",
    text: "Which traversal of a Binary Search Tree yields keys in ascending sorted order?",
    options: ["Pre-order", "Post-order", "In-order", "Level-order"],
    correct: "c",
    explanation: "In-order traversal (left, root, right) visits a BST's keys in non-decreasing order.",
  },
  {
    topic: "Graphs",
    text: "Which data structure is used to implement Breadth-First Search (BFS)?",
    options: ["Stack", "Queue", "Priority queue", "Hash table"],
    correct: "b",
    explanation: "BFS explores level by level and stores the frontier in a FIFO queue. DFS uses a stack instead.",
  },
  {
    topic: "Sorting Algorithms",
    text: "Which sorting algorithm guarantees O(n log n) time in the worst case and is stable?",
    options: ["Quick Sort", "Merge Sort", "Selection Sort", "Heap Sort"],
    correct: "b",
    explanation:
      "Merge Sort always divides the array in half — O(n log n) worst case — and preserves the relative order of equal keys.",
  },
  {
    topic: "Searching Algorithms",
    text: "What is the mandatory precondition for applying binary search?",
    options: ["The array must contain unique values", "The array must be sorted", "The array length must be even", "The array must be an ArrayList"],
    correct: "b",
    explanation:
      "Binary search discards half the search space each step, which is only valid when the data is ordered.",
  },
  {
    topic: "Recursion",
    text: "What is the purpose of a base case in a recursive function?",
    options: [
      "To improve performance by caching results",
      "To terminate the recursion and prevent a stack overflow",
      "To call the function again",
      "To convert recursion into a loop",
    ],
    correct: "b",
    explanation:
      "Without a base case the function calls itself forever until the call stack overflows. The base case is the stopping condition.",
  },
  {
    topic: "Time Complexity",
    text: "What is the worst-case time complexity of binary search on a sorted array of n elements?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: "b",
    explanation: "Each comparison halves the remaining search space, so at most log₂n comparisons are needed.",
  },
  {
    topic: "Space Complexity",
    text: "A recursive algorithm of depth n without memoisation uses additional space in which structure?",
    options: ["The heap", "The call stack", "The static area", "The instruction cache"],
    correct: "b",
    explanation:
      "Each pending call keeps a stack frame, so the auxiliary space is O(n) for depth n. Deep recursion risks StackOverflowError.",
  },
  {
    topic: "Hashing",
    text: "Which technique resolves hash collisions by storing colliding entries in a list at the same bucket?",
    options: ["Linear probing", "Separate chaining", "Quadratic probing", "Double hashing"],
    correct: "b",
    explanation:
      "Separate chaining keeps a linked list (or tree) per bucket, which is how java.util.HashMap stores colliding keys.",
  },
  {
    topic: "Dynamic Programming",
    text: "Which two properties make a problem suitable for dynamic programming?",
    options: [
      "Sorting and searching",
      "Overlapping subproblems and optimal substructure",
      "Recursion and backtracking",
      "Greedy choice and hashing",
    ],
    correct: "b",
    explanation:
      "DP applies when subproblems repeat (so results can be cached) and an optimal solution is built from optimal sub-solutions.",
  },
  {
    topic: "Data Structures Fundamentals",
    text: "Which of the following is a NON-LINEAR data structure?",
    options: ["Array", "Linked List", "Stack", "Tree"],
    correct: "d",
    explanation:
      "Trees and graphs are non-linear: an element may be connected to many others. Arrays, lists, stacks and queues are linear.",
  },
];

async function main() {
  console.log("Resetting portal data for the Java & DSA examination portal…");

  // Wipe exam-related data (cascades to questions links, attempts, answers, logs)
  await db.delete(examAttempts);
  await db.delete(examinations);
  await db.delete(questions);
  await db.delete(questionBanks);

  // ---- Admin (kept for the management console) ----
  const adminHash = await bcrypt.hash("admin123", 10);
  const [existingAdmin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  const adminId = existingAdmin
    ? existingAdmin.id
    : (
        await db
          .insert(users)
          .values({
            name: "Prof. Ramreddy (Administrator)",
            email: "admin@exam.edu",
            password: adminHash,
            role: "admin",
            studentId: "FAC-CSE-001",
            department: "Computer Science & Engineering",
          })
          .returning()
      )[0].id;

  await db
    .update(users)
    .set({
      approvalStatus: "approved",
      approvedAt: new Date(),
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, adminId));

  // ---- Demonstration student: the exact requested credentials ----
  const demoEmail = "gagireddyramreddy@gmail.com";
  const demoHash = await bcrypt.hash("123456", 10);

  const [demoStudent] = await db
    .insert(users)
    .values({
      name: "GAGIREDDY RAMREDDY",
      email: demoEmail,
      password: demoHash,
      role: "student",
      studentId: "2500030116",
      department: "B.Tech Computer Science and Engineering",
      phone: "+91 9876543210",
      isActive: true,
      approvalStatus: "approved",
      approvedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: "GAGIREDDY RAMREDDY",
        password: demoHash,
        role: "student",
        studentId: "2500030116",
        department: "B.Tech Computer Science and Engineering",
        isActive: true,
        approvalStatus: "approved",
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  // ---- Demonstration teacher (approved) ----
  const teacherHash = await bcrypt.hash("teacher123", 10);
  const [demoTeacher] = await db
    .insert(users)
    .values({
      name: "Dr. S. Faculty",
      email: "teacher@kluniversity.in",
      password: teacherHash,
      role: "teacher",
      studentId: "FAC-CSE-002",
      department: "Computer Science and Engineering",
      isActive: true,
      approvalStatus: "approved",
      approvedAt: new Date(),
      approvedBy: adminId,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: "Dr. S. Faculty",
        password: teacherHash,
        role: "teacher",
        department: "Computer Science and Engineering",
        isActive: true,
        approvalStatus: "approved",
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  await db
    .insert(teacherAllocations)
    .values({
      teacherId: demoTeacher.id,
      studentId: demoStudent.id,
      assignedBy: adminId,
    })
    .onConflictDoNothing({
      target: [teacherAllocations.teacherId, teacherAllocations.studentId],
    });

  // ---- Question banks ----
  const [javaBank] = await db
    .insert(questionBanks)
    .values({
      name: "Java Programming",
      description: "15 core Java MCQs covering fundamentals through the collections framework.",
      category: "Programming Languages",
    })
    .returning();

  const [dsaBank] = await db
    .insert(questionBanks)
    .values({
      name: "Data Structures & Algorithms",
      description: "15 DSA MCQs covering arrays through dynamic programming.",
      category: "Core Computer Science",
    })
    .returning();

  async function insertMcqs(bankId: number, list: Mcq[]) {
    const ids: { id: number; marks: number }[] = [];
    for (const q of list) {
      const [row] = await db
        .insert(questions)
        .values({
          bankId,
          questionText: q.text,
          type: "mcq",
          options: [
            { id: "a", text: q.options[0] },
            { id: "b", text: q.options[1] },
            { id: "c", text: q.options[2] },
            { id: "d", text: q.options[3] },
          ],
          correctOption: q.correct,
          explanation: q.explanation,
          marks: 1,
          negativeMarks: 0,
          difficulty: "medium",
        })
        .returning({ id: questions.id, marks: questions.marks });
      ids.push(row);
    }
    return ids;
  }

  const javaQuestionIds = await insertMcqs(javaBank.id, JAVA_MCQS);
  const dsaQuestionIds = await insertMcqs(dsaBank.id, DSA_MCQS);

  // ---- Exams: 15 questions, 15 marks, pass 9, 20 minutes ----
  const [javaExam] = await db
    .insert(examinations)
    .values({
      title: "Java Programming Examination",
      code: "JAVA-15",
      description:
        "15 multiple-choice questions covering Java fundamentals, OOP, exception handling and collections. 1 mark per question.",
      subject: "Java Programming",
      durationMinutes: 20,
      totalMarks: 15,
      passingMarks: 9,
      instructions:
        "1. This examination contains exactly 15 multiple-choice questions.\n2. Each question carries 1 mark and there is no negative marking.\n3. All 15 questions must be attempted; each has only one correct option.\n4. Use the Previous / Next buttons or the question navigation palette.\n5. The examination is automatically submitted when the 20-minute timer reaches zero.\n6. Minimum passing marks: 9 out of 15.",
      shuffleQuestions: false,
      shuffleOptions: false,
      allowReview: true,
      maxAttempts: 50,
      status: "published",
      startTime: new Date(Date.now() - 3600 * 1000),
      endTime: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      createdBy: adminId,
    })
    .returning();

  const [dsaExam] = await db
    .insert(examinations)
    .values({
      title: "Data Structures & Algorithms Examination",
      code: "DSA-15",
      description:
        "15 multiple-choice questions covering arrays, linked lists, stacks, queues, trees, graphs, sorting, searching, complexity, hashing and dynamic programming. 1 mark per question.",
      subject: "Data Structures & Algorithms",
      durationMinutes: 20,
      totalMarks: 15,
      passingMarks: 9,
      instructions:
        "1. This examination contains exactly 15 multiple-choice questions.\n2. Each question carries 1 mark and there is no negative marking.\n3. All 15 questions must be attempted; each has only one correct option.\n4. Use the Previous / Next buttons or the question navigation palette.\n5. The examination is automatically submitted when the 20-minute timer reaches zero.\n6. Minimum passing marks: 9 out of 15.",
      shuffleQuestions: false,
      shuffleOptions: false,
      allowReview: true,
      maxAttempts: 50,
      status: "published",
      startTime: new Date(Date.now() - 3600 * 1000),
      endTime: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      createdBy: adminId,
    })
    .returning();

  await db.insert(examQuestions).values([
    ...javaQuestionIds.map((q, i) => ({
      examId: javaExam.id,
      questionId: q.id,
      questionOrder: i + 1,
      marks: 1,
    })),
    ...dsaQuestionIds.map((q, i) => ({
      examId: dsaExam.id,
      questionId: q.id,
      questionOrder: i + 1,
      marks: 1,
    })),
  ]);

  // ---- One previous attempt so history/latest score is not empty ----
  const start = new Date(Date.now() - 26 * 3600 * 1000);
  const end = new Date(start.getTime() + 14 * 60 * 1000);

  const [attempt] = await db
    .insert(examAttempts)
    .values({
      examId: javaExam.id,
      studentId: demoStudent.id,
      attemptNumber: 1,
      status: "evaluated",
      startTime: start,
      endTime: end,
      timeSpentSeconds: 14 * 60,
      mcqScore: 12,
      descriptiveScore: 0,
      totalScore: 12,
      isPassed: true,
      evaluatedAt: end,
      evaluationNotes: "Automatically evaluated — 12 of 15 correct.",
    })
    .returning();

  const answerRows = javaQuestionIds.map((q, index) => {
    const def = JAVA_MCQS[index];
    const correct = index < 12;
    const chosen = correct ? def.correct : (["a", "b", "c", "d"] as const).find((o) => o !== def.correct)!;
    return {
      attemptId: attempt.id,
      questionId: q.id,
      selectedOption: chosen,
      isCorrect: correct,
      marksAwarded: correct ? 1 : 0,
    };
  });
  await db.insert(studentAnswers).values(answerRows);

  console.log("Portal ready:");
  console.log(`  Admin        : admin@exam.edu / admin123`);
  console.log(`  Demo teacher : teacher@kluniversity.in / teacher123 (allocated to demo student)`);
  console.log(`  Demo student : ${demoEmail} / 123456`);
  console.log(`  Java exam    : ${javaQuestionIds.length} MCQs, 15 marks, pass 9 (id ${javaExam.id})`);
  console.log(`  DSA exam     : ${dsaQuestionIds.length} MCQs, 15 marks, pass 9 (id ${dsaExam.id})`);
  console.log("  History      : 1 evaluated Java attempt (12/15)");

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
