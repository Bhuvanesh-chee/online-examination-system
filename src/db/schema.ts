import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // "admin" | "student"
  studentId: text("student_id"), // Academic Roll No / ID e.g. 2500030116
  department: text("department").default("B.Tech Computer Science and Engineering"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  approvalStatus: text("approval_status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by").references((): AnyPgColumn => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const questionBanks = pgTable("question_banks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("General"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  bankId: integer("bank_id").references(() => questionBanks.id, { onDelete: "set null" }),
  questionText: text("question_text").notNull(),
  type: text("type").notNull().default("mcq"), // "mcq" | "descriptive"
  options: jsonb("options"), // Array<{ id: string, text: string }>
  correctOption: text("correct_option"), // "a", "b", "c", "d" for MCQ
  descriptiveGuide: text("descriptive_guide"), // Grading rubric/sample answer for manual grading
  explanation: text("explanation"), // Explanation shown in review
  marks: real("marks").notNull().default(1),
  negativeMarks: real("negative_marks").notNull().default(0),
  difficulty: text("difficulty").notNull().default("medium"), // "easy" | "medium" | "hard"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const examinations = pgTable("examinations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  subject: text("subject").notNull().default("Computer Science"),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  totalMarks: integer("total_marks").notNull().default(50),
  passingMarks: integer("passing_marks").notNull().default(20),
  instructions: text("instructions"),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(true),
  shuffleOptions: boolean("shuffle_options").notNull().default(true),
  allowReview: boolean("allow_review").notNull().default(true),
  maxAttempts: integer("max_attempts").notNull().default(1),
  status: text("status").notNull().default("published"), // "draft" | "published" | "archived"
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const examQuestions = pgTable("exam_questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => examinations.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  questionOrder: integer("question_order").notNull().default(0),
  marks: real("marks").notNull().default(1),
});

export const examAttempts = pgTable("exam_attempts", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => examinations.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  attemptNumber: integer("attempt_number").notNull().default(1),
  status: text("status").notNull().default("in_progress"), // "in_progress" | "submitted" | "evaluated" | "disqualified"
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
  totalScore: real("total_score").notNull().default(0),
  mcqScore: real("mcq_score").notNull().default(0),
  descriptiveScore: real("descriptive_score").notNull().default(0),
  isPassed: boolean("is_passed").notNull().default(false),
  tabSwitchCount: integer("tab_switch_count").notNull().default(0),
  fullscreenExitCount: integer("fullscreen_exit_count").notNull().default(0),
  evaluationNotes: text("evaluation_notes"),
  evaluatedAt: timestamp("evaluated_at"),
  evaluatedBy: integer("evaluated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentAnswers = pgTable("student_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => examAttempts.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  selectedOption: text("selected_option"),
  descriptiveAnswer: text("descriptive_answer"),
  isMarkedForReview: boolean("is_marked_for_review").notNull().default(false),
  isCorrect: boolean("is_correct"),
  marksAwarded: real("marks_awarded").notNull().default(0),
  teacherFeedback: text("teacher_feedback"),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
});

export const suspiciousLogs = pgTable("suspicious_logs", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => examAttempts.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // "tab_switch" | "fullscreen_exit" | "right_click" | "copy_paste" | "window_blur"
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const teacherAllocations = pgTable(
  "teacher_allocations",
  {
    id: serial("id").primaryKey(),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studentId: integer("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedBy: integer("assigned_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    teacherStudentUnique: uniqueIndex("teacher_allocations_teacher_student_unique").on(
      table.teacherId,
      table.studentId
    ),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  attempts: many(examAttempts),
  examinations: many(examinations),
}));

export const examinationsRelations = relations(examinations, ({ one, many }) => ({
  creator: one(users, {
    fields: [examinations.createdBy],
    references: [users.id],
  }),
  examQuestions: many(examQuestions),
  attempts: many(examAttempts),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  bank: one(questionBanks, {
    fields: [questions.bankId],
    references: [questionBanks.id],
  }),
  examQuestions: many(examQuestions),
  answers: many(studentAnswers),
}));

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  exam: one(examinations, {
    fields: [examQuestions.examId],
    references: [examinations.id],
  }),
  question: one(questions, {
    fields: [examQuestions.questionId],
    references: [questions.id],
  }),
}));

export const examAttemptsRelations = relations(examAttempts, ({ one, many }) => ({
  exam: one(examinations, {
    fields: [examAttempts.examId],
    references: [examinations.id],
  }),
  student: one(users, {
    fields: [examAttempts.studentId],
    references: [users.id],
  }),
  answers: many(studentAnswers),
  suspiciousLogs: many(suspiciousLogs),
}));

export const studentAnswersRelations = relations(studentAnswers, ({ one }) => ({
  attempt: one(examAttempts, {
    fields: [studentAnswers.attemptId],
    references: [examAttempts.id],
  }),
  question: one(questions, {
    fields: [studentAnswers.questionId],
    references: [questions.id],
  }),
}));

export const suspiciousLogsRelations = relations(suspiciousLogs, ({ one }) => ({
  attempt: one(examAttempts, {
    fields: [suspiciousLogs.attemptId],
    references: [examAttempts.id],
  }),
  student: one(users, {
    fields: [suspiciousLogs.studentId],
    references: [users.id],
  }),
}));

export const teacherAllocationsRelations = relations(teacherAllocations, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherAllocations.teacherId],
    references: [users.id],
  }),
  student: one(users, {
    fields: [teacherAllocations.studentId],
    references: [users.id],
  }),
  assigner: one(users, {
    fields: [teacherAllocations.assignedBy],
    references: [users.id],
  }),
}));
