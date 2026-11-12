"use client";

import { portalFetch } from "@/lib/browser-session";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  CheckSquare,
  Square,
  HelpCircle,
  Clock,
  Award,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

interface QuestionItem {
  id: number;
  questionText: string;
  type: string;
  bankName: string | null;
  marks: number;
}

export default function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [totalMarks, setTotalMarks] = useState(50);
  const [passingMarks, setPassingMarks] = useState(20);
  const [instructions, setInstructions] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [allowReview, setAllowReview] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [status, setStatus] = useState("published");

  const [availableQuestions, setAvailableQuestions] = useState<QuestionItem[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExamData();
  }, [examId]);

  const loadExamData = async () => {
    try {
      const [examRes, questionsRes] = await Promise.all([
        portalFetch(`/api/admin/exams/${examId}`),
        portalFetch("/api/admin/questions"),
      ]);

      if (examRes.ok && questionsRes.ok) {
        const examData = await examRes.json();
        const questionsData = await questionsRes.json();

        const exam = examData.exam;
        setTitle(exam.title || "");
        setCode(exam.code || "");
        setDescription(exam.description || "");
        setSubject(exam.subject || "");
        setDurationMinutes(exam.durationMinutes || 30);
        setTotalMarks(exam.totalMarks || 50);
        setPassingMarks(exam.passingMarks || 20);
        setInstructions(exam.instructions || "");
        setShuffleQuestions(exam.shuffleQuestions ?? true);
        setShuffleOptions(exam.shuffleOptions ?? true);
        setAllowReview(exam.allowReview ?? true);
        setMaxAttempts(exam.maxAttempts || 1);
        setStatus(exam.status || "published");

        setAvailableQuestions(questionsData.questions || []);
        // extract currently assigned question ids
        const assignedIds = (examData.questions || []).map((q: { id: number }) => q.id);
        setSelectedQuestionIds(assignedIds);
      } else {
        setError("Failed to load examination details");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (id: number) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((qId) => qId !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await portalFetch(`/api/admin/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          code,
          description,
          subject,
          durationMinutes,
          totalMarks,
          passingMarks,
          instructions,
          shuffleQuestions,
          shuffleOptions,
          allowReview,
          maxAttempts,
          status,
          questionIds: selectedQuestionIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update examination");
      } else {
        router.push("/admin/exams");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm">Loading examination parameters...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/exams"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Edit Examination: {code}</h1>
            <p className="text-xs text-slate-500">Update configuration, questions, and instructions</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            General Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Scoring & Duration */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Duration & Grading Rules
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Min)</label>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Marks</label>
              <input
                type="number"
                min={1}
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value) || 50)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pass Marks</label>
              <input
                type="number"
                min={1}
                value={passingMarks}
                onChange={(e) => setPassingMarks(parseInt(e.target.value) || 20)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Attempts</label>
              <input
                type="number"
                min={1}
                max={5}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono text-xs"
            />
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Shuffle Questions</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Shuffle MCQ Options</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allowReview}
                onChange={(e) => setAllowReview(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Allow Answer Review</span>
            </label>
          </div>
        </div>

        {/* Question Selector Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                Assign Questions
              </h2>
              <p className="text-xs text-slate-500">Selected: {selectedQuestionIds.length} question(s) · {availableQuestions.filter((q) => selectedQuestionIds.includes(q.id)).reduce((sum, q) => sum + Number(q.marks), 0)} calculated marks</p>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {availableQuestions.map((q) => {
              const isSelected = selectedQuestionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuestion(q.id)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                    isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="mt-0.5 text-blue-600">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          q.type === "mcq" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {q.type}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {q.bankName || "General"}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-auto font-semibold">
                        {q.marks} Marks
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium line-clamp-2">
                      {q.questionText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/admin/exams"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow flex items-center gap-2 transition"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
