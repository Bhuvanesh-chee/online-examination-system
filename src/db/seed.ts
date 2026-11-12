import { db } from "./index";
import { users, questionBanks, questions, examinations, examQuestions, examAttempts, studentAnswers, suspiciousLogs } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("Seeding database...");

  // Check if already seeded
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already contains data. Skipping initial seed.");
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash("admin123", salt);
  const studentPassword = await bcrypt.hash("student123", salt);

  // 1. Create Users
  const [adminUser] = await db.insert(users).values({
    name: "Prof. Ramreddy Admin",
    email: "admin@exam.edu",
    password: adminPassword,
    role: "admin",
    studentId: "FAC-CSE-001",
    department: "Computer Science & Engineering",
    phone: "+91 9876543210",
  }).returning();

  const [student1] = await db.insert(users).values({
    name: "Gagireddy Ramreddy",
    email: "student@exam.edu",
    password: studentPassword,
    role: "student",
    studentId: "2500030116",
    department: "B.Tech Computer Science and Engineering",
    phone: "+91 9876500116",
  }).returning();

  const [student2] = await db.insert(users).values({
    name: "Ananya Sharma",
    email: "ananya@exam.edu",
    password: studentPassword,
    role: "student",
    studentId: "2500030117",
    department: "B.Tech Computer Science and Engineering",
    phone: "+91 9876500117",
  }).returning();

  const [student3] = await db.insert(users).values({
    name: "Rahul Verma",
    email: "rahul@exam.edu",
    password: studentPassword,
    role: "student",
    studentId: "2500030118",
    department: "B.Tech Information Technology",
    phone: "+91 9876500118",
  }).returning();

  const [student4] = await db.insert(users).values({
    name: "Priya Patel",
    email: "priya@exam.edu",
    password: studentPassword,
    role: "student",
    studentId: "2500030119",
    department: "B.Tech Artificial Intelligence",
    phone: "+91 9876500119",
  }).returning();

  // 2. Question Banks
  const [bankDSA] = await db.insert(questionBanks).values({
    name: "Data Structures & Algorithms",
    description: "Core concepts including Trees, Graphs, Sorting, Dynamic Programming and Complexity Analysis.",
    category: "Core Computer Science",
  }).returning();

  const [bankDBMS] = await db.insert(questionBanks).values({
    name: "Database Management Systems",
    description: "Relational modeling, SQL queries, Normalization, ACID transactions, and Indexing.",
    category: "Database Systems",
  }).returning();

  const [bankWeb] = await db.insert(questionBanks).values({
    name: "Web Technologies & Cloud",
    description: "HTTP protocols, REST APIs, React architectures, microservices and serverless fundamentals.",
    category: "Software Engineering",
  }).returning();

  const [bankNetworks] = await db.insert(questionBanks).values({
    name: "Computer Networks & Cybersecurity",
    description: "OSI & TCP/IP models, routing protocols, cryptography, firewalls, and network defense.",
    category: "Systems & Security",
  }).returning();

  // 3. Questions
  // DSA Questions
  const qDSA1 = await db.insert(questions).values({
    bankId: bankDSA.id,
    questionText: "What is the worst-case time complexity of QuickSort when using a naive pivot selection on an already sorted array?",
    type: "mcq",
    options: [
      { id: "a", text: "O(n log n)" },
      { id: "b", text: "O(n^2)" },
      { id: "c", text: "O(log n)" },
      { id: "d", text: "O(n)" },
    ],
    correctOption: "b",
    explanation: "When naive pivot selection (first or last element) is used on an already sorted array, partitions are heavily unbalanced resulting in O(n^2) worst-case time.",
    marks: 4,
    negativeMarks: 1,
    difficulty: "medium",
  }).returning();

  const qDSA2 = await db.insert(questions).values({
    bankId: bankDSA.id,
    questionText: "Which data structure is primarily utilized to implement Breadth-First Search (BFS) on a graph?",
    type: "mcq",
    options: [
      { id: "a", text: "Stack" },
      { id: "b", text: "Queue" },
      { id: "c", text: "Priority Queue" },
      { id: "d", text: "Binary Search Tree" },
    ],
    correctOption: "b",
    explanation: "BFS explores nodes level by level using a FIFO Queue to keep track of discovered vertices.",
    marks: 4,
    negativeMarks: 1,
    difficulty: "easy",
  }).returning();

  const qDSA3 = await db.insert(questions).values({
    bankId: bankDSA.id,
    questionText: "In a Red-Black Tree, what is the maximum possible height of a tree containing n nodes?",
    type: "mcq",
    options: [
      { id: "a", text: "2 * log2(n + 1)" },
      { id: "b", text: "log2(n)" },
      { id: "c", text: "1.44 * log2(n)" },
      { id: "d", text: "n / 2" },
    ],
    correctOption: "a",
    explanation: "A Red-Black tree with n internal nodes has height at most 2 * log2(n + 1), guaranteeing logarithmic operations.",
    marks: 4,
    negativeMarks: 1,
    difficulty: "hard",
  }).returning();

  const qDSA4 = await db.insert(questions).values({
    bankId: bankDSA.id,
    questionText: "Explain the working mechanism of Dijkstra's Algorithm for finding single-source shortest paths in a weighted graph with non-negative edge weights.",
    type: "descriptive",
    descriptiveGuide: "Student must explain: 1) Initialization of distances (0 for source, infinity for others), 2) Use of Min-Heap/Priority Queue, 3) Relaxation step d(v) = min(d(v), d(u) + w(u,v)), 4) Greedy choice property, and 5) Time complexity O((V + E) log V).",
    marks: 10,
    negativeMarks: 0,
    difficulty: "hard",
  }).returning();

  const qDSA5 = await db.insert(questions).values({
    bankId: bankDSA.id,
    questionText: "What is the amortized time complexity of inserting an element into a dynamic array (such as std::vector or ArrayList)?",
    type: "mcq",
    options: [
      { id: "a", text: "O(1)" },
      { id: "b", text: "O(n)" },
      { id: "c", text: "O(log n)" },
      { id: "d", text: "O(n^2)" },
    ],
    correctOption: "a",
    explanation: "Although array doubling takes O(n) intermittently, the amortized cost per append across n insertions is strictly O(1).",
    marks: 4,
    negativeMarks: 1,
    difficulty: "easy",
  }).returning();

  // DBMS Questions
  const qDBMS1 = await db.insert(questions).values({
    bankId: bankDBMS.id,
    questionText: "Which normal form deals specifically with eliminating transitive functional dependencies (X -> Y and Y -> Z)?",
    type: "mcq",
    options: [
      { id: "a", text: "First Normal Form (1NF)" },
      { id: "b", text: "Second Normal Form (2NF)" },
      { id: "c", text: "Third Normal Form (3NF)" },
      { id: "d", text: "Boyce-Codd Normal Form (BCNF)" },
    ],
    correctOption: "c",
    explanation: "3NF requires a relation to be in 2NF and have no transitive dependencies on candidate keys for non-prime attributes.",
    marks: 4,
    negativeMarks: 1,
    difficulty: "easy",
  }).returning();

  const qDBMS2 = await db.insert(questions).values({
    bankId: bankDBMS.id,
    questionText: "In ACID transaction properties, which property ensures that database modifications are permanently saved even in the event of a system crash?",
    type: "mcq",
    options: [
      { id: "a", text: "Atomicity" },
      { id: "b", text: "Consistency" },
      { id: "c", text: "Isolation" },
      { id: "d", text: "Durability" },
    ],
    correctOption: "d",
    explanation: "Durability guarantees that once a transaction commits, its effects survive power loss, crashes, or errors via Write-Ahead Logging (WAL).",
    marks: 4,
    negativeMarks: 1,
    difficulty: "easy",
  }).returning();

  const qDBMS3 = await db.insert(questions).values({
    bankId: bankDBMS.id,
    questionText: "Explain the differences between B-Tree and B+ Tree indexing structures. Why are B+ Trees preferred in relational database disk storage engines?",
    type: "descriptive",
    descriptiveGuide: "Key evaluation points: 1) In B+ trees, data pointers/records exist only in leaf nodes whereas B-trees store them in internal nodes too. 2) B+ leaf nodes are linked sequentially enabling blazing fast range scans. 3) Higher fan-out in B+ trees reduces I/O depth. 4) Predictable lookup times.",
    marks: 10,
    negativeMarks: 0,
    difficulty: "medium",
  }).returning();

  const qDBMS4 = await db.insert(questions).values({
    bankId: bankDBMS.id,
    questionText: "What SQL statement is used to revoke privileges previously granted to a database user?",
    type: "mcq",
    options: [
      { id: "a", text: "DENY" },
      { id: "b", text: "REVOKE" },
      { id: "c", text: "DROP PERMIT" },
      { id: "d", text: "REMOVE ACCESS" },
    ],
    correctOption: "b",
    explanation: "The REVOKE statement in standard SQL removes previously granted permissions from a user or role.",
    marks: 4,
    negativeMarks: 1,
    difficulty: "easy",
  }).returning();

  // Web Technologies Questions
  const qWeb1 = await db.insert(questions).values({
    bankId: bankWeb.id,
    questionText: "Which HTTP status code is most appropriate when a client request lacks valid authentication credentials?",
    type: "mcq",
    options: [
      { id: "a", text: "400 Bad Request" },
      { id: "b", text: "401 Unauthorized" },
      { id: "c", text: "403 Forbidden" },
      { id: "d", text: "404 Not Found" },
    ],
    correctOption: "b",
    explanation: "HTTP 401 Unauthorized indicates that the request requires user authentication credentials that are missing or invalid.",
    marks: 4,
    negativeMarks: 1,
    difficulty: "easy",
  }).returning();

  const qWeb2 = await db.insert(questions).values({
    bankId: bankWeb.id,
    questionText: "In React 18/19, what hook is used to perform side effects such as data fetching, subscriptions, or manual DOM manipulations?",
    type: "mcq",
    options: [
      { id: "a", text: "useState" },
      { id: "b", text: "useMemo" },
      { id: "c", text: "useEffect" },
      { id: "d", text: "useCallback" },
    ],
    correctOption: "c",
    explanation: "useEffect serves to execute side effects following DOM render cycles and handles cleanup routines.",
    marks: 4,
    negativeMarks: 1,
    difficulty: "easy",
  }).returning();

  const qWeb3 = await db.insert(questions).values({
    bankId: bankWeb.id,
    questionText: "Discuss the architectural principles of RESTful APIs. Detail at least four key constraints defined by Roy Fielding.",
    type: "descriptive",
    descriptiveGuide: "Must mention at least 4 constraints: 1) Client-Server separation, 2) Statelessness, 3) Cacheability, 4) Uniform Interface (URI identifiers, standard HTTP verbs GET/POST/PUT/DELETE, self-descriptive messages, HATEOAS), 5) Layered System.",
    marks: 10,
    negativeMarks: 0,
    difficulty: "medium",
  }).returning();

  // Networks & Security Questions
  const qNet1 = await db.insert(questions).values({
    bankId: bankNetworks.id,
    questionText: "Which transport layer protocol provides reliable, connection-oriented byte-stream delivery with flow control and congestion management?",
    type: "mcq",
    options: [
      { id: "a", text: "UDP (User Datagram Protocol)" },
      { id: "b", text: "TCP (Transmission Control Protocol)" },
      { id: "c", text: "ICMP (Internet Control Message Protocol)" },
      { id: "d", text: "IGMP (Internet Group Management Protocol)" },
    ],
    correctOption: "b",
    explanation: "TCP uses 3-way handshakes, sequence numbers, acknowledgments, sliding windows, and congestion algorithms to guarantee delivery.",
    marks: 4,
    negativeMarks: 1,
    difficulty: "easy",
  }).returning();

  const qNet2 = await db.insert(questions).values({
    bankId: bankNetworks.id,
    questionText: "In public-key cryptography (asymmetric), which key does a sender use to encrypt a confidential message destined for a receiver?",
    type: "mcq",
    options: [
      { id: "a", text: "Sender's Private Key" },
      { id: "b", text: "Sender's Public Key" },
      { id: "c", text: "Receiver's Public Key" },
      { id: "d", text: "Shared Symmetric Secret" },
    ],
    correctOption: "c",
    explanation: "The sender encrypts the message with the receiver's public key so that only the receiver possessing the matching private key can decrypt it.",
    marks: 4,
    negativeMarks: 1,
    difficulty: "medium",
  }).returning();

  // 4. Create Examinations
  const [exam1] = await db.insert(examinations).values({
    title: "CS301: Data Structures & Algorithms (DSA) — Midterm",
    code: "CS301-2026",
    description: "Comprehensive mid-term evaluation covering Trees, Graphs, Sorting algorithms, and asymptotic complexity analysis.",
    subject: "Data Structures & Algorithms (DSA)",
    durationMinutes: 30,
    totalMarks: 26,
    passingMarks: 12,
    instructions: "1. The exam contains both Multiple Choice Questions (MCQs) and Descriptive Questions.\n2. Each MCQ carries 4 marks with a negative marking of 1 mark for incorrect answers.\n3. Descriptive questions are evaluated for up to 10 marks.\n4. Switching tabs or exiting fullscreen will trigger security warnings and will be logged.\n5. The examination will automatically submit when the countdown timer reaches zero.",
    shuffleQuestions: true,
    shuffleOptions: true,
    allowReview: true,
    maxAttempts: 2,
    status: "published",
    startTime: new Date(Date.now() - 2 * 24 * 3600 * 1000), // 2 days ago
    endTime: new Date(Date.now() + 14 * 24 * 3600 * 1000), // 14 days later
    createdBy: adminUser.id,
  }).returning();

  const [exam2] = await db.insert(examinations).values({
    title: "CS304: Database Systems & SQL Proficiency Test",
    code: "CS304-2026",
    description: "Assessment on relational algebra, normalization rules (1NF-BCNF), ACID transaction semantics, and index tuning.",
    subject: "Database Management",
    durationMinutes: 25,
    totalMarks: 22,
    passingMarks: 10,
    instructions: "1. All questions are mandatory.\n2. Ensure a stable internet connection.\n3. Anti-cheating proctoring deterrent is active: tab switches are tracked.\n4. Click 'Submit Examination' when complete.",
    shuffleQuestions: true,
    shuffleOptions: true,
    allowReview: true,
    maxAttempts: 1,
    status: "published",
    startTime: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    endTime: new Date(Date.now() + 20 * 24 * 3600 * 1000),
    createdBy: adminUser.id,
  }).returning();

  const [exam3] = await db.insert(examinations).values({
    title: "CS402: Modern Web Technologies & Cloud Systems",
    code: "CS402-2026",
    description: "Exam covering RESTful API architecture, React hooks, HTTP status codes, and cloud application design.",
    subject: "Software Engineering",
    durationMinutes: 20,
    totalMarks: 18,
    passingMarks: 8,
    instructions: "Answer all questions thoroughly. Fullscreen mode is recommended.",
    shuffleQuestions: true,
    shuffleOptions: true,
    allowReview: true,
    maxAttempts: 2,
    status: "published",
    startTime: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    createdBy: adminUser.id,
  }).returning();

  const [exam4] = await db.insert(examinations).values({
    title: "CS308: Computer Networks & Network Security",
    code: "CS308-2026",
    description: "Evaluation covering TCP/IP protocol stack, transport protocols, routing, and asymmetric cryptography fundamentals.",
    subject: "Networks & Security",
    durationMinutes: 25,
    totalMarks: 8,
    passingMarks: 4,
    instructions: "Multiple choice questions with negative marking. Review before final submission.",
    shuffleQuestions: true,
    shuffleOptions: true,
    allowReview: true,
    maxAttempts: 1,
    status: "published",
    startTime: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    endTime: new Date(Date.now() + 10 * 24 * 3600 * 1000),
    createdBy: adminUser.id,
  }).returning();

  // 5. Link Exam Questions
  // Exam 1 Questions (DSA): qDSA1, qDSA2, qDSA3, qDSA4, qDSA5
  await db.insert(examQuestions).values([
    { examId: exam1.id, questionId: qDSA1[0].id, questionOrder: 1, marks: 4 },
    { examId: exam1.id, questionId: qDSA2[0].id, questionOrder: 2, marks: 4 },
    { examId: exam1.id, questionId: qDSA3[0].id, questionOrder: 3, marks: 4 },
    { examId: exam1.id, questionId: qDSA4[0].id, questionOrder: 4, marks: 10 },
    { examId: exam1.id, questionId: qDSA5[0].id, questionOrder: 5, marks: 4 },
  ]);

  // Exam 2 Questions (DBMS): qDBMS1, qDBMS2, qDBMS3, qDBMS4
  await db.insert(examQuestions).values([
    { examId: exam2.id, questionId: qDBMS1[0].id, questionOrder: 1, marks: 4 },
    { examId: exam2.id, questionId: qDBMS2[0].id, questionOrder: 2, marks: 4 },
    { examId: exam2.id, questionId: qDBMS3[0].id, questionOrder: 3, marks: 10 },
    { examId: exam2.id, questionId: qDBMS4[0].id, questionOrder: 4, marks: 4 },
  ]);

  // Exam 3 Questions (Web): qWeb1, qWeb2, qWeb3
  await db.insert(examQuestions).values([
    { examId: exam3.id, questionId: qWeb1[0].id, questionOrder: 1, marks: 4 },
    { examId: exam3.id, questionId: qWeb2[0].id, questionOrder: 2, marks: 4 },
    { examId: exam3.id, questionId: qWeb3[0].id, questionOrder: 3, marks: 10 },
  ]);

  // Exam 4 Questions (Networks): qNet1, qNet2
  await db.insert(examQuestions).values([
    { examId: exam4.id, questionId: qNet1[0].id, questionOrder: 1, marks: 4 },
    { examId: exam4.id, questionId: qNet2[0].id, questionOrder: 2, marks: 4 },
  ]);

  // 6. Sample completed attempt for Student 1 (Gagireddy Ramreddy) on Exam 2 (DBMS)
  const [attempt1] = await db.insert(examAttempts).values({
    examId: exam2.id,
    studentId: student1.id,
    attemptNumber: 1,
    status: "evaluated",
    startTime: new Date(Date.now() - 3600 * 1000 * 12),
    endTime: new Date(Date.now() - 3600 * 1000 * 12 + 18 * 60 * 1000),
    timeSpentSeconds: 1080,
    totalScore: 21,
    mcqScore: 12,
    descriptiveScore: 9,
    isPassed: true,
    tabSwitchCount: 0,
    fullscreenExitCount: 0,
    evaluationNotes: "Excellent comprehension of B+ Tree internals and transaction properties.",
    evaluatedAt: new Date(Date.now() - 3600 * 1000 * 8),
    evaluatedBy: adminUser.id,
  }).returning();

  await db.insert(studentAnswers).values([
    {
      attemptId: attempt1.id,
      questionId: qDBMS1[0].id,
      selectedOption: "c",
      isCorrect: true,
      marksAwarded: 4,
    },
    {
      attemptId: attempt1.id,
      questionId: qDBMS2[0].id,
      selectedOption: "d",
      isCorrect: true,
      marksAwarded: 4,
    },
    {
      attemptId: attempt1.id,
      questionId: qDBMS3[0].id,
      descriptiveAnswer: "B+ trees differ from B-trees because they store data pointers exclusively in leaf nodes, keeping index nodes lightweight and fitting more keys per disk block. Leaf nodes are linked as a doubly-linked list which permits O(log N) first key lookup followed by linear O(K) sequential range scanning. This maximizes cache efficiency in disk engines like InnoDB and PostgreSQL.",
      marksAwarded: 9,
      teacherFeedback: "Very well structured explanation with clear reference to sequential leaf linking and disk page fan-out.",
    },
    {
      attemptId: attempt1.id,
      questionId: qDBMS4[0].id,
      selectedOption: "b",
      isCorrect: true,
      marksAwarded: 4,
    },
  ]);

  // Sample attempt for Ananya Sharma on Exam 1 (DSA)
  const [attempt2] = await db.insert(examAttempts).values({
    examId: exam1.id,
    studentId: student2.id,
    attemptNumber: 1,
    status: "evaluated",
    startTime: new Date(Date.now() - 3600 * 1000 * 24),
    endTime: new Date(Date.now() - 3600 * 1000 * 24 + 24 * 60 * 1000),
    timeSpentSeconds: 1440,
    totalScore: 24,
    mcqScore: 16,
    descriptiveScore: 8,
    isPassed: true,
    tabSwitchCount: 1,
    fullscreenExitCount: 0,
    evaluationNotes: "High performance. Good explanation of Dijkstra's heap relaxation.",
    evaluatedAt: new Date(Date.now() - 3600 * 1000 * 20),
    evaluatedBy: adminUser.id,
  }).returning();

  // Suspicious log for Ananya's 1 tab switch
  await db.insert(suspiciousLogs).values({
    attemptId: attempt2.id,
    studentId: student2.id,
    eventType: "tab_switch",
    details: "Student switched active browser tab or minimized window for 3 seconds.",
  });

  // Sample attempt for Rahul Verma on Exam 2 (DBMS)
  const [attempt3] = await db.insert(examAttempts).values({
    examId: exam2.id,
    studentId: student3.id,
    attemptNumber: 1,
    status: "submitted",
    startTime: new Date(Date.now() - 3600 * 1000 * 4),
    endTime: new Date(Date.now() - 3600 * 1000 * 4 + 20 * 60 * 1000),
    timeSpentSeconds: 1200,
    totalScore: 8,
    mcqScore: 8,
    descriptiveScore: 0, // Pending manual teacher evaluation
    isPassed: false,
    tabSwitchCount: 2,
    fullscreenExitCount: 1,
  }).returning();

  await db.insert(studentAnswers).values([
    { attemptId: attempt3.id, questionId: qDBMS1[0].id, selectedOption: "c", isCorrect: true, marksAwarded: 4 },
    { attemptId: attempt3.id, questionId: qDBMS2[0].id, selectedOption: "d", isCorrect: true, marksAwarded: 4 },
    {
      attemptId: attempt3.id,
      questionId: qDBMS3[0].id,
      descriptiveAnswer: "B+ trees store keys in leaves. B trees store in every node. B+ trees are good for range queries.",
      marksAwarded: 0, // pending evaluation by admin
    },
    { attemptId: attempt3.id, questionId: qDBMS4[0].id, selectedOption: "a", isCorrect: false, marksAwarded: -1 },
  ]);

  await db.insert(suspiciousLogs).values([
    {
      attemptId: attempt3.id,
      studentId: student3.id,
      eventType: "tab_switch",
      details: "Browser tab switched to background window.",
    },
    {
      attemptId: attempt3.id,
      studentId: student3.id,
      eventType: "fullscreen_exit",
      details: "User exited fullscreen mode during active exam.",
    },
  ]);

  const { seedJavaExam } = await import("./seed-java");
  await seedJavaExam();

  console.log("Database seeded successfully with rich sample data (including the Java demonstration exam)!");
}
