import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL;
if (!base) {
  console.error("Set TEST_BASE_URL to the current preview origin.");
  process.exit(1);
}

async function json(path, options = {}, token) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });
  return { status: response.status, body: await response.json() };
}

async function signIn(email, password) {
  const result = await json("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.ok(result.body.accessToken);
  return result.body.accessToken;
}

const adminToken = await signIn("admin@exam.edu", "admin123");
const studentToken = await signIn("GAGIREDDYRAMREDDY@gmail.com", "123456");

const noAuth = await json("/api/admin/generator");
assert.equal(noAuth.status, 403);
const studentAccess = await json("/api/admin/generator", {}, studentToken);
assert.equal(studentAccess.status, 403);
console.log("PASS: Only admins can access Question Studio");

const config = await json("/api/admin/generator", {}, adminToken);
assert.equal(config.status, 200);
assert.equal(config.body.demoTopics.java.length, 8);
assert.equal(config.body.demoTopics.dsa.length, 8);
assert.equal(config.body.demoTopics.frontend.length, 8);
console.log(`PASS: Studio capabilities loaded (${config.body.aiConfigured ? "Live AI configured" : "Offline demo available"})`);

async function generate(subject, topic, difficulty, count) {
  const result = await json("/api/admin/generator", {
    method: "POST",
    body: JSON.stringify({ subject, topic, difficulty, count, mode: "demo" }),
  }, adminToken);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.source, "demo");
  assert.equal(result.body.generatedCount, count);
  for (const question of result.body.questions) {
    assert.equal(question.difficulty, difficulty);
    assert.equal(question.options.length, 4);
    assert.ok(question.options.some((option) => option.id === question.correctOption));
    assert.ok(question.explanation.length > 10);
  }
  return result.body.questions;
}

const java = await generate("java", "OOP", "medium", 1);
const dsa = await generate("dsa", "Graphs", "hard", 1);
const frontendSample = await generate("frontend", "React", "medium", 1);
assert.match(java[0].questionText, /overriding/i);
assert.match(dsa[0].questionText, /Dijkstra/i);
assert.match(frontendSample[0].questionText, /React/i);
for (const subject of ["java", "dsa", "frontend"]) {
  await generate(subject, "Mixed topics", "easy", 5);
}
console.log("PASS: Java OOP, DSA Graphs, Frontend React and three mixed sample packs generate accurately");

const invalidTopic = await json("/api/admin/generator", {
  method: "POST",
  body: JSON.stringify({ subject: "java", topic: "Quantum Teleportation", difficulty: "medium", count: 1, mode: "demo" }),
}, adminToken);
assert.equal(invalidTopic.status, 422);
assert.ok(invalidTopic.body.suggestedTopics.length > 0);
const studentSave = await json("/api/admin/generator/save", {
  method: "POST",
  body: JSON.stringify({ subject: "java", questions: java }),
}, studentToken);
assert.equal(studentSave.status, 403);
console.log("PASS: Unsupported offline topics explain alternatives; student saves are forbidden");

for (const [subject, sample] of [["java", java], ["dsa", dsa]]) {
  const result = await json("/api/admin/generator/save", {
    method: "POST",
    body: JSON.stringify({ subject, questions: sample }),
  }, adminToken);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.questionIds.length, 1);
  console.log(`PASS: ${subject} question stored in ${result.body.bank.name} (new ${result.body.savedCount}, reused ${result.body.duplicateCount})`);
}

const title = "Frontend Development — Question Studio Sample Exam";
const currentExams = await json("/api/admin/exams", {}, adminToken);
assert.equal(currentExams.status, 200);
const existingDraft = currentExams.body.examinations.find((exam) => exam.title === title);
let draftId = existingDraft?.id;
if (!draftId) {
  const frontendPack = await generate("frontend", "Mixed topics", "medium", 5);
  const saved = await json("/api/admin/generator/save", {
    method: "POST",
    body: JSON.stringify({
      subject: "frontend", questions: frontendPack, createDraft: true, draftTitle: title,
    }),
  }, adminToken);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.draftExam.status, "draft");
  assert.equal(saved.body.questionIds.length, 5);
  draftId = saved.body.draftExam.id;
}

const details = await json(`/api/admin/exams/${draftId}`, {}, adminToken);
assert.equal(details.status, 200);
assert.equal(details.body.exam.status, "draft");
assert.equal(details.body.questions.length, 5);
assert.equal(details.body.questions.reduce((sum, item) => sum + Number(item.marks), 0), 5);
assert.equal(details.body.exam.totalMarks, 5);

const studentExams = await json("/api/student/exams", {}, studentToken);
assert.equal(studentExams.status, 200);
assert.deepEqual(studentExams.body.examinations.map((exam) => exam.code).sort(), ["DSA-15", "JAVA-15"]);
console.log("PASS: Frontend five-question draft saved with accurate marks, while students still see only Java and DSA");
