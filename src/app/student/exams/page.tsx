"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { portalFetch } from "@/lib/browser-session";
import {
  BookOpen,
  Search,
  Clock,
  Award,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Coffee,
  Binary,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface ExamRow {
  id: number;
  title: string;
  code: string;
  description: string | null;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  maxAttempts: number;
  questionCount: number;
  usedAttempts: number;
  canTake: boolean;
  inProgressAttemptId: number | null;
}

function tagFor(exam: ExamRow): { label: string; Icon: typeof Coffee } | null {
  const haystack = `${exam.code} ${exam.title} ${exam.subject}`.toLowerCase();
  if (haystack.includes("java")) return { label: "Java", Icon: Coffee };
  if (haystack.includes("dsa") || haystack.includes("data structure") || haystack.includes("algorithm")) {
    return { label: "DSA", Icon: Binary };
  }
  return null;
}

export default function StudentExamsPage() {
  const { user } = useAuth();
  const [allExams, setAllExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    portalFetch("/api/student/exams")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load examinations");
        if (active) setAllExams(data.examinations ?? []);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load examinations");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [retryCount]);

  const subjects = Array.from(new Set(allExams.map((exam) => exam.subject)));
  const exams = allExams.filter((exam) => {
    const matchQuery = `${exam.title} ${exam.code} ${exam.subject}`.toLowerCase().includes(query.toLowerCase());
    return matchQuery && (subjectFilter === "all" || exam.subject === subjectFilter);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-500" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        Loading Java and DSA examinations…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700" role="alert">
        <AlertTriangle className="mx-auto mb-3 h-7 w-7" />
        <p className="font-semibold">Unable to load examinations</p>
        <p className="mt-1 text-sm">{error}</p>
        <button onClick={() => setRetryCount((count) => count + 1)} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          Available Examinations ({allExams.length})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Welcome {user?.name ?? "Student"} — choose a Java or DSA examination
        </p>
      </div>

      {allExams.length === 0 ? (
        <div className="p-10 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <p className="font-semibold text-amber-900">No published examinations found</p>
          <p className="text-xs text-amber-700 mt-1">
            An administrator must publish an exam before it appears here.
          </p>
        </div>
      ) : (
        <>
          {/* Instant client-side filtering; no page reload or lost session. */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="q"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, subject, or code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <label htmlFor="subject" className="text-xs font-semibold text-slate-600">
                Subject:
              </label>
              <select
                id="subject"
                name="subject"
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Subjects ({allExams.length})</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => { setQuery(""); setSubjectFilter("all"); }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          {exams.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center">
              <Search className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No examination matches your filter</p>
              <Link
                href="/student/exams"
                className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Reset filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => {
                const tag = tagFor(exam);
                const TagIcon = tag?.Icon;

                return (
                  <div
                    key={exam.id}
                    className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition ${
                      tag ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200/80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                            {exam.code}
                          </span>
                          {tag && TagIcon && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-0.5 rounded">
                              <TagIcon className="w-3 h-3" />
                              {tag.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">{exam.subject}</span>
                      </div>

                      <h2 className="font-bold text-slate-900 text-base mb-2 line-clamp-2">{exam.title}</h2>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                        {exam.description || "Course assessment evaluation."}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>{exam.durationMinutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-indigo-500" />
                          <span>
                            {exam.totalMarks} Marks (Pass: {exam.passingMarks})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                          <span>{exam.questionCount} Questions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                          <span>
                            Attempts: {exam.usedAttempts}/{exam.maxAttempts}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      {exam.inProgressAttemptId ? (
                        <Link
                          href={`/student/exams/${exam.id}/live`}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow flex items-center justify-center gap-1.5 transition"
                        >
                          Resume Active Attempt <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : exam.canTake ? (
                        <Link
                          href={`/student/exams/${exam.id}/instructions`}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow flex items-center justify-center gap-1.5 transition"
                        >
                          View Instructions &amp; Start <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href="/student/results"
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium text-center flex items-center justify-center gap-1.5 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Attempts used ({exam.usedAttempts}/{exam.maxAttempts}) — view result
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
