"use client";

import { portalFetch } from "@/lib/browser-session";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileCheck,
  CheckCircle2,
  Clock,
  Award,
  User,
  HelpCircle,
  Save,
  Loader2,
  ArrowLeft,
  AlertCircle,
  BookOpen,
} from "lucide-react";

interface SubmissionSummary {
  attemptId: number;
  examId: number;
  examTitle: string;
  examCode: string;
  totalMarks: number;
  passingMarks: number;
  studentName: string;
  studentRollNo: string | null;
  status: string;
  totalScore: number;
  mcqScore: number;
  descriptiveScore: number;
  isPassed: boolean;
  startTime: string;
}

interface AnswerDetail {
  answerId: number;
  questionId: number;
  questionText: string;
  type: string;
  options: Array<{ id: string; text: string }> | null;
  correctOption: string | null;
  descriptiveGuide: string | null;
  explanation: string | null;
  maxMarks: number;
  selectedOption: string | null;
  descriptiveAnswer: string | null;
  isCorrect: boolean | null;
  marksAwarded: number;
  teacherFeedback: string | null;
}

interface AttemptDetail {
  id: number;
  status: string;
  totalScore: number;
  mcqScore: number;
  descriptiveScore: number;
  isPassed: boolean;
  studentName: string;
  studentRollNo: string | null;
  studentEmail: string;
  examTitle: string;
  examCode: string;
  totalMarks: number;
  passingMarks: number;
  evaluationNotes: string | null;
}

function AdminEvaluationsContent() {
  const searchParams = useSearchParams();
  const selectedAttemptId = searchParams.get("attemptId");

  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptDetail | null>(null);
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Grading edits state
  const [gradingMarks, setGradingMarks] = useState<{ [answerId: number]: number }>({});
  const [gradingFeedback, setGradingFeedback] = useState<{ [answerId: number]: string }>({});
  const [overallNotes, setOverallNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (selectedAttemptId) {
      loadAttemptDetails(selectedAttemptId);
    } else {
      loadSubmissions();
    }
  }, [selectedAttemptId]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await portalFetch("/api/admin/evaluations");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttemptDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await portalFetch(`/api/admin/evaluations?attemptId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAttempt(data.attempt);
        setAnswers(data.answers || []);

        const marksInit: { [id: number]: number } = {};
        const feedInit: { [id: number]: string } = {};
        for (const a of data.answers || []) {
          marksInit[a.answerId] = Number(a.marksAwarded) || 0;
          feedInit[a.answerId] = a.teacherFeedback || "";
        }
        setGradingMarks(marksInit);
        setGradingFeedback(feedInit);
        setOverallNotes(data.attempt?.evaluationNotes || "Evaluated by instructor.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedAttempt) return;
    setSaving(true);
    setSaveSuccess(false);

    const evaluations = answers.map((a) => ({
      answerId: a.answerId,
      marksAwarded: gradingMarks[a.answerId] ?? a.marksAwarded,
      teacherFeedback: gradingFeedback[a.answerId] ?? a.teacherFeedback,
    }));

    try {
      const res = await portalFetch("/api/admin/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: selectedAttempt.id,
          evaluations,
          overallNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setSelectedAttempt({
          ...selectedAttempt,
          totalScore: data.totalScore,
          mcqScore: data.mcqScore,
          descriptiveScore: data.descriptiveScore,
          isPassed: data.isPassed,
          status: "evaluated",
        });
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert(data.error || "Failed to save evaluation");
      }
    } catch {
      alert("Error saving evaluation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm">Loading evaluations...</span>
      </div>
    );
  }

  // If a specific attempt is opened for grading
  if (selectedAttemptId && selectedAttempt) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/evaluations"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Grading: {selectedAttempt.studentName}
              </h1>
              <p className="text-xs text-slate-500">
                Exam: {selectedAttempt.examTitle} ({selectedAttempt.examCode}) • Roll:{" "}
                {selectedAttempt.studentRollNo || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedAttempt.status === "evaluated"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              Status: {selectedAttempt.status}
            </span>
            <button
              onClick={handleSaveEvaluation}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Finalize & Publish Score
                </>
              )}
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Scores finalized successfully! Total Score: {selectedAttempt.totalScore} / {selectedAttempt.totalMarks} ({selectedAttempt.isPassed ? "PASSED" : "FAILED"}).</span>
          </div>
        )}

        {/* Current Score Summary Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">MCQ Score</span>
            <div className="text-xl font-bold text-blue-600">{selectedAttempt.mcqScore} pts</div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Descriptive Score</span>
            <div className="text-xl font-bold text-purple-600">
              {Object.entries(gradingMarks).reduce((sum, [aId, val]) => {
                const ans = answers.find((x) => x.answerId === Number(aId));
                return ans && ans.type === "descriptive" ? sum + Number(val) : sum;
              }, 0)}{" "}
              pts
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Score</span>
            <div className="text-xl font-extrabold text-slate-900">
              {selectedAttempt.totalScore} / {selectedAttempt.totalMarks}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Passing Threshold</span>
            <div className="text-xl font-bold text-slate-700">{selectedAttempt.passingMarks} pts</div>
          </div>
        </div>

        {/* Question by question evaluation */}
        <div className="space-y-6">
          {answers.map((ans, idx) => (
            <div
              key={ans.answerId}
              className={`p-6 bg-white rounded-2xl border shadow-sm space-y-4 ${
                ans.type === "descriptive" ? "border-purple-200" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ans.type === "mcq" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {ans.type}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Max Marks: {ans.maxMarks}</span>
                </div>

                {ans.type === "mcq" && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      ans.isCorrect
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {ans.isCorrect ? `Correct (+${ans.marksAwarded})` : `Incorrect (${ans.marksAwarded})`}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <p className="text-sm font-semibold text-slate-900">{ans.questionText}</p>

              {/* If MCQ */}
              {ans.type === "mcq" && ans.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {ans.options.map((opt) => {
                    const isSelected = opt.id.toLowerCase() === (ans.selectedOption || "").toLowerCase();
                    const isCorrect = opt.id.toLowerCase() === (ans.correctOption || "").toLowerCase();

                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isSelected && isCorrect
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-medium"
                            : isSelected && !isCorrect
                            ? "bg-rose-50 border-rose-300 text-rose-900 font-medium"
                            : isCorrect
                            ? "bg-blue-50 border-blue-200 text-blue-900 font-medium"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <strong className="uppercase">{opt.id}:</strong> {opt.text}
                        </span>
                        <div className="flex items-center gap-1">
                          {isSelected && <span className="text-[10px] font-bold text-slate-500">[Selected]</span>}
                          {isCorrect && <span className="text-[10px] font-bold text-emerald-600">[Key]</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* If Descriptive */}
              {ans.type === "descriptive" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      Student Submitted Written Response:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
                      {ans.descriptiveAnswer || (
                        <em className="text-slate-400">No response provided by student.</em>
                      )}
                    </p>
                  </div>

                  {ans.descriptiveGuide && (
                    <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900">
                      <span className="font-bold block mb-1">Grading Rubric / Reference Guide:</span>
                      <p className="leading-relaxed">{ans.descriptiveGuide}</p>
                    </div>
                  )}

                  {/* Manual Marks Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-purple-50/30 rounded-xl border border-purple-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Award Marks (0 to {ans.maxMarks})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={ans.maxMarks}
                        step={0.5}
                        value={gradingMarks[ans.answerId] ?? 0}
                        onChange={(e) =>
                          setGradingMarks({
                            ...gradingMarks,
                            [ans.answerId]: Math.min(
                              ans.maxMarks,
                              Math.max(0, Number(e.target.value))
                            ),
                          })
                        }
                        className="w-full px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Instructor Feedback / Remarks
                      </label>
                      <input
                        type="text"
                        value={gradingFeedback[ans.answerId] ?? ""}
                        onChange={(e) =>
                          setGradingFeedback({
                            ...gradingFeedback,
                            [ans.answerId]: e.target.value,
                          })
                        }
                        placeholder="e.g. Accurate analysis with clear explanation of time complexity..."
                        className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall Evaluation Notes */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            Overall Instructor Evaluation Comments
          </label>
          <textarea
            rows={2}
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            placeholder="Feedback summary visible on the student's final report card..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
          />

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveEvaluation}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Publish Evaluation & Release Result
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Submissions list view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-indigo-600" />
          Examination Evaluations & Grading
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review subjective descriptive answers, award marks, and issue teacher feedback
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No submissions requiring manual evaluation currently.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Examination</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Current Score</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const isPending = sub.status === "submitted";
                  return (
                    <tr key={sub.attemptId} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{sub.studentName}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {sub.studentRollNo || "No Roll"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{sub.examTitle}</div>
                        <div className="text-xs text-slate-400 font-mono">{sub.examCode}</div>
                      </td>
                      <td className="px-6 py-4">
                        {isPending ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Pending Grading
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Evaluated
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">
                          {sub.totalScore} / {sub.totalMarks}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/evaluations?attemptId=${sub.attemptId}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                        >
                          Grade Attempt
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

export default function AdminEvaluationsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex items-center justify-center text-sm text-slate-500">
          Loading evaluations…
        </div>
      }
    >
      <AdminEvaluationsContent />
    </Suspense>
  );
}
