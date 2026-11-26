"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  LogOut,
  User as UserIcon,
  Coffee,
  Binary,
  PlayCircle,
  History,
  Target,
  AlertTriangle,
} from "lucide-react";

interface ExamCard {
  id: number;
  title: string;
  code: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questionCount: number;
  usedAttempts: number;
  maxAttempts: number;
  canTake: boolean;
  inProgressAttemptId: number | null;
}

interface AttemptRow {
  attemptId: number;
  examId: number;
  status: string;
  totalScore: number;
  totalMarks: number;
  isPassed: boolean;
  examTitle: string;
  examCode: string;
  startTime: string;
}

interface AssignedTeacher {
  id: number;
  name: string;
  email: string;
  department: string | null;
}

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const [exams, setExams] = useState<ExamCard[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [teachers, setTeachers] = useState<AssignedTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [examsRes, resultsRes, teachersRes] = await Promise.all([
          portalFetch("/api/student/exams", { cache: "no-store" }),
          portalFetch("/api/student/results", { cache: "no-store" }),
          portalFetch("/api/student/teachers", { cache: "no-store" }),
        ]);
        if (examsRes.ok) {
          const data = await examsRes.json();
          setExams(data.examinations ?? []);
        }
        if (resultsRes.ok) {
          const data = await resultsRes.json();
          setAttempts(data.history ?? []);
        }
        if (teachersRes.ok) {
          const data = await teachersRes.json();
          setTeachers(data.teachers ?? []);
        }
      } catch {
        setError("Could not load your dashboard. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completedAttempts = attempts.filter((a) => a.status !== "in_progress");
  const passedAttempts = attempts.filter((a) => a.isPassed && a.status === "evaluated");
  const bestPercentage =
    completedAttempts.length > 0
      ? Math.max(
          ...completedAttempts.map((a) => Math.round((Number(a.totalScore) / (Number(a.totalMarks) || 1)) * 100))
        )
      : 0;

  const latestByExam = new Map<number, AttemptRow>();
  for (const attempt of attempts) {
    if (attempt.status === "in_progress") continue;
    const existing = latestByExam.get(attempt.examId);
    if (!existing || new Date(attempt.startTime) > new Date(existing.startTime)) {
      latestByExam.set(attempt.examId, attempt);
    }
  }

  const iconFor = (exam: ExamCard) => {
    const hay = `${exam.title} ${exam.subject} ${exam.code}`.toLowerCase();
    if (hay.includes("java")) return Coffee;
    if (hay.includes("dsa") || hay.includes("data structure")) return Binary;
    return BookOpen;
  };

  return (
    <div className="space-y-7">
      {/* Welcome banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#A12D33] via-[#8f272c] to-[#7d1f24] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold backdrop-blur">
              <CheckCircle2 className="w-3.5 h-3.5" /> Online Examination Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name ?? "Student"}
            </h1>
            <p className="text-[#f3d6d8] text-xs sm:text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> {user?.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Roll No: {user?.studentId ?? "2500030116"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/student/exams"
              className="px-4 py-2.5 rounded-xl bg-white text-[#A12D33] text-xs font-bold hover:bg-slate-100 transition shadow"
            >
              All Examinations
            </Link>
            <Link
              href="/student/history"
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold transition inline-flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" /> History
            </Link>
            <button
              onClick={() => logout()}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shadow"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Available Exams
            </span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-blue-700">{loading ? "–" : exams.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Java &amp; DSA papers</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Attempted Exams
            </span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <History className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-indigo-700">
            {loading ? "–" : completedAttempts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Saved attempts</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Exams Passed
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {loading ? "–" : passedAttempts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pass mark 9/15</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Best Score
            </span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-purple-700">
            {loading ? "–" : `${bestPercentage}%`}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all attempts</div>
        </div>
      </div>

      {/* Assigned teachers */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#A12D33]" /> My Teachers
          </h2>
          <Link
            href="/student/teachers"
            className="text-xs font-semibold text-[#A12D33] hover:underline"
          >
            View all
          </Link>
        </div>
        {teachers.length === 0 ? (
          <p className="text-xs text-slate-500">
            No teacher has been allocated to you yet. Please contact the administrator.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teachers.map((teacher) => (
              <span
                key={teacher.id}
                className="inline-flex items-center gap-2 rounded-full border border-[#A12D33]/20 bg-[#A12D33]/5 px-3 py-1.5 text-xs text-slate-700"
              >
                <span className="w-6 h-6 rounded-full bg-[#A12D33] text-white flex items-center justify-center text-[10px] font-bold">
                  {teacher.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="font-semibold">{teacher.name}</span>
                <span className="text-slate-400">{teacher.department || "Faculty"}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Exam cards */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Available Examinations</h2>
            <p className="text-xs text-slate-500">
              Exactly 15 MCQs each · 1 mark per question · 20 minutes · pass 9/15
            </p>
          </div>
          <Link
            href="/student/exams"
            className="text-xs font-semibold text-blue-600 hover:underline hidden sm:inline-flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm">Loading examinations…</span>
          </div>
        ) : exams.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
            No examinations are published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {exams.map((exam) => {
              const Icon = iconFor(exam);
              const latest = latestByExam.get(exam.id);
              const latestPct = latest
                ? Math.round((Number(latest.totalScore) / (Number(latest.totalMarks) || 1)) * 100)
                : null;

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all p-6"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                          {exam.title}
                        </h3>
                        <span className="text-[11px] font-mono text-blue-600">{exam.code}</span>
                      </div>
                    </div>
                    {latest && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          latest.isPassed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {latest.isPassed ? "PASSED" : "FAILED"}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-4">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" /> {exam.questionCount} MCQs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> {exam.durationMinutes} minutes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-500" /> {exam.totalMarks} marks (pass {exam.passingMarks})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-purple-500" /> {exam.usedAttempts} attempt(s)
                    </span>
                  </div>

                  {latest ? (
                    <div className="mb-3 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-slate-700 flex items-center justify-between">
                      <span>
                        Latest score: <strong>{latest.totalScore}/{latest.totalMarks}</strong> ({latestPct}%)
                      </span>
                      <Link
                        href={`/student/results?attemptId=${latest.attemptId}`}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        View result
                      </Link>
                    </div>
                  ) : (
                    <div className="mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                      Not attempted yet — good luck!
                    </div>
                  )}

                  <div className="flex gap-2">
                    {exam.inProgressAttemptId ? (
                      <Link
                        href={`/student/exams/${exam.id}/live`}
                        className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold text-center inline-flex items-center justify-center gap-1.5"
                      >
                        <PlayCircle className="w-4 h-4" /> Resume Exam
                      </Link>
                    ) : (
                      <Link
                        href={`/student/exams/${exam.id}/instructions`}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 shadow"
                      >
                        <PlayCircle className="w-4 h-4" /> Start Examination
                      </Link>
                    )}
                    {latest && (
                      <Link
                        href={`/student/results?attemptId=${latest.attemptId}`}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                      >
                        Scorecard
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent results */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Latest Examination Scores</h2>
            <p className="text-xs text-slate-500">Saved in the database — available after logout</p>
          </div>
          <Link href="/student/history" className="text-xs font-semibold text-blue-600 hover:underline">
            Full history
          </Link>
        </div>

        {attempts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No attempts yet. Start the Java or DSA examination above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Examination</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Percentage</th>
                  <th className="px-5 py-3">Result</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.slice(0, 5).map((a) => {
                  const pct = Math.round((Number(a.totalScore) / (Number(a.totalMarks) || 1)) * 100);
                  const pending = a.status !== "evaluated";
                  return (
                    <tr key={a.attemptId} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 text-xs">{a.examTitle}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{a.examCode}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {new Date(a.startTime).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-900">
                        {a.totalScore}/{a.totalMarks}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-blue-700">{pct}%</td>
                      <td className="px-5 py-3.5">
                        {pending ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            PENDING
                          </span>
                        ) : a.isPassed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            PASS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            FAIL
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/student/results?attemptId=${a.attemptId}`}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
