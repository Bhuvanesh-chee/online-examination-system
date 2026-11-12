"use client";

import { portalFetch } from "@/lib/browser-session";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  ArrowRight,
  Loader2,
  ArrowLeft,
  FileText,
  AlertCircle,
  Sparkles,
  Download,
  RotateCcw,
  History,
  ListChecks,
} from "lucide-react";

interface ResultAttempt {
  id: number;
  attemptNumber: number;
  status: string;
  startTime: string;
  endTime: string;
  timeSpentSeconds: number;
  totalScore: number;
  mcqScore: number;
  descriptiveScore: number;
  isPassed: boolean;
  tabSwitchCount: number;
  evaluationNotes: string | null;
  examId: number;
  examTitle: string;
  examCode: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  allowReview: boolean;
}

interface AnswerReviewItem {
  answerId: number;
  questionId: number;
  questionText: string;
  type: string;
  options: Array<{ id: string; text: string }> | null;
  correctOption: string | null;
  explanation: string | null;
  maxMarks: number;
  negativeMarks: number;
  selectedOption: string | null;
  descriptiveAnswer: string | null;
  isCorrect: boolean | null;
  marksAwarded: number;
  teacherFeedback: string | null;
}

interface HistoryItem {
  attemptId: number;
  examId: number;
  attemptNumber: number;
  status: string;
  totalScore: number;
  totalMarks: number;
  isPassed: boolean;
  examTitle: string;
  examCode: string;
  subject: string;
  startTime: string;
  timeSpentSeconds: number;
}

function StudentResultsContent() {
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get("attemptId");

  const [attempt, setAttempt] = useState<ResultAttempt | null>(null);
  const [percentage, setPercentage] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerReviewItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResultData(attemptIdParam);
  }, [attemptIdParam]);

  const fetchResultData = async (id: string | null) => {
    setLoading(true);
    try {
      const url = id ? `/api/student/results?attemptId=${id}` : "/api/student/results";
      const res = await portalFetch(url);
      if (res.ok) {
        const data = await res.json();
        if (id) {
          setAttempt(data.attempt);
          setPercentage(data.percentage);
          setAnswers(data.answers || []);
        } else {
          setHistory(data.history || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Generating performance report...</span>
      </div>
    );
  }

  // Detailed Scorecard View
  if (attemptIdParam && attempt) {
    const isPending = attempt.status === "submitted";
    const isPassed = attempt.isPassed;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/student/exams/${attempt.examId}/instructions`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retake Exam
            </Link>
            <Link
              href="/student/history"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <History className="w-3.5 h-3.5" /> History
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>

        {/* Scorecard Hero Banner */}
        <div
          className={`p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden ${
            isPending
              ? "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700"
              : isPassed
              ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700"
              : "bg-gradient-to-r from-rose-700 via-rose-800 to-purple-900"
          }`}
        >
          <div className="max-w-2xl space-y-2 relative z-10">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              Official Examination Scorecard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{attempt.examTitle}</h1>
            <p className="text-white/80 text-xs sm:text-sm">
              Code: <strong className="font-mono text-white">{attempt.examCode}</strong> • Subject: {attempt.subject}
            </p>

            <div className="pt-4 flex flex-wrap items-baseline gap-4">
              <div>
                <span className="text-xs uppercase font-medium text-white/80 block">Score Earned</span>
                <div className="text-4xl font-extrabold">
                  {attempt.totalScore}{" "}
                  <span className="text-xl font-medium text-white/70">/ {attempt.totalMarks}</span>
                </div>
              </div>

              <div className="border-l border-white/20 pl-4">
                <span className="text-xs uppercase font-medium text-white/80 block">Percentage</span>
                <div className="text-3xl font-bold">{percentage}%</div>
              </div>

              <div className="border-l border-white/20 pl-4">
                <span className="text-xs uppercase font-medium text-white/80 block">Outcome</span>
                <div className="text-2xl font-black uppercase tracking-wider">
                  {isPending ? "Pending Evaluation" : isPassed ? "PASSED" : "FAILED"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Breakdown Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <Award className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase">MCQ Score</span>
            <div className="text-lg font-bold text-slate-900">{attempt.mcqScore} pts</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Descriptive Score</span>
            <div className="text-lg font-bold text-slate-900">{attempt.descriptiveScore} pts</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <Clock className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Time Utilized</span>
            <div className="text-lg font-bold text-slate-900">
              {Math.floor(attempt.timeSpentSeconds / 60)}m {attempt.timeSpentSeconds % 60}s
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Passing Benchmark</span>
            <div className="text-lg font-bold text-slate-900">{attempt.passingMarks} Marks</div>
          </div>
        </div>

        {/* Correct / Incorrect summary */}
        {answers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Correct</span>
              <div className="text-2xl font-extrabold text-emerald-700">
                {answers.filter((a) => a.isCorrect === true).length}
              </div>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-center">
              <span className="text-[11px] font-semibold text-rose-700 uppercase">Incorrect</span>
              <div className="text-2xl font-extrabold text-rose-700">
                {answers.filter((a) => a.isCorrect === false).length}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-600 uppercase">Unanswered</span>
              <div className="text-2xl font-extrabold text-slate-700">
                {answers.filter((a) => !a.selectedOption && !a.descriptiveAnswer).length}
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
              <span className="text-[11px] font-semibold text-blue-700 uppercase">Total Questions</span>
              <div className="text-2xl font-extrabold text-blue-700">{answers.length}</div>
            </div>
          </div>
        )}

        {/* Faculty Feedback Card */}
        {attempt.evaluationNotes && (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Faculty Evaluation Remarks
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {attempt.evaluationNotes}
            </p>
          </div>
        )}

        {/* Question Review Section */}
        {attempt.allowReview && answers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Question-by-Question Review</h2>
                <p className="text-xs text-slate-500">
                  Inspect correct options, model answers, and individual score deductions
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {answers.map((ans, idx) => (
                <div
                  key={ans.answerId}
                  className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ans.type === "mcq"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {ans.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {ans.type === "mcq" ? (
                        ans.isCorrect ? (
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> +{ans.marksAwarded} Marks
                          </span>
                        ) : (
                          <span className="font-bold text-rose-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> {ans.marksAwarded} Marks
                          </span>
                        )
                      ) : (
                        <span className="font-bold text-purple-700">
                          Awarded: {ans.marksAwarded} / {ans.maxMarks} Marks
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {ans.questionText}
                  </p>

                  {/* MCQ Options Review */}
                  {ans.type === "mcq" && ans.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {ans.options.map((opt) => {
                        const isStudent =
                          opt.id.toLowerCase() === (ans.selectedOption || "").toLowerCase();
                        const isCorrect =
                          opt.id.toLowerCase() === (ans.correctOption || "").toLowerCase();

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${
                              isStudent && isCorrect
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                : isStudent && !isCorrect
                                ? "bg-rose-50 border-rose-300 text-rose-900 font-semibold"
                                : isCorrect
                                ? "bg-blue-50 border-blue-200 text-blue-900 font-semibold"
                                : "bg-slate-50 border-slate-200 text-slate-600"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <strong className="uppercase">{opt.id}:</strong> {opt.text}
                            </span>
                            <div className="text-[10px] font-bold">
                              {isStudent && <span className="mr-1 text-slate-500">(Your Choice)</span>}
                              {isCorrect && <span className="text-emerald-700">✓ Correct Key</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Descriptive Review */}
                  {ans.type === "descriptive" && (
                    <div className="space-y-3 pt-1">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Your Submitted Answer:</span>
                        <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">
                          {ans.descriptiveAnswer || "No answer submitted."}
                        </p>
                      </div>

                      {ans.teacherFeedback && (
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900">
                          <span className="font-bold block mb-0.5">Instructor Remarks:</span>
                          <p className="leading-relaxed">{ans.teacherFeedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  {ans.explanation && (
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
                      <span className="font-bold block mb-0.5">Answer Explanation:</span>
                      <p className="leading-relaxed text-blue-800">{ans.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // All Results History View
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-blue-600" />
          Examination Results & Scorecards
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View all your completed examinations, scores, and performance feedback
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {history.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            No examination results found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Examination</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Score Earned</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Time Spent</th>
                  <th className="px-6 py-3 text-right">Scorecard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => {
                  const pct = Math.round((h.totalScore / (h.totalMarks || 1)) * 100);

                  return (
                    <tr key={h.attemptId} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{h.examTitle}</div>
                        <div className="text-xs text-slate-400 font-mono">{h.examCode}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{h.subject}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">
                          {h.totalScore} / {h.totalMarks}
                        </div>
                        <div className="text-[11px] text-slate-400">{pct}%</div>
                      </td>
                      <td className="px-6 py-4">
                        {h.status === "evaluated" ? (
                          h.isPassed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                              PASSED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                              FAILED
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                            PENDING EVALUATION
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {Math.floor(h.timeSpentSeconds / 60)} min {h.timeSpentSeconds % 60} sec
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/student/results?attemptId=${h.attemptId}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
                        >
                          View Scorecard
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

export default function StudentResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex items-center justify-center text-sm text-slate-500">
          Loading scorecards…
        </div>
      }
    >
      <StudentResultsContent />
    </Suspense>
  );
}
