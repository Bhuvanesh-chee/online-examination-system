"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  WandSparkles,
  HelpCircle,
  PlusCircle,
  Search,
  Trash2,
  Edit,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Check,
} from "lucide-react";

interface BankItem {
  id: number;
  name: string;
}

interface QuestionItem {
  id: number;
  bankId: number | null;
  bankName: string | null;
  questionText: string;
  type: string;
  options: Array<{ id: string; text: string }> | null;
  correctOption: string | null;
  descriptiveGuide: string | null;
  explanation: string | null;
  marks: number;
  negativeMarks: number;
  difficulty: string;
  createdAt: string;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [bankId, setBankId] = useState<string>("");
  const [questionText, setQuestionText] = useState("");
  const [type, setType] = useState<"mcq" | "descriptive">("mcq");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctOption, setCorrectOption] = useState("a");
  const [descriptiveGuide, setDescriptiveGuide] = useState("");
  const [explanation, setExplanation] = useState("");
  const [marks, setMarks] = useState(4);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [difficulty, setDifficulty] = useState("medium");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bankParam = params.get("bankId");
    if (bankParam) setBankFilter(bankParam);
    if (params.get("openAdd") === "true") setShowModal(true);
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [qRes, bRes] = await Promise.all([
        portalFetch("/api/admin/questions"),
        portalFetch("/api/admin/banks"),
      ]);
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData.questions || []);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setBanks(bData.banks || []);
        if (bData.banks?.length > 0) {
          const requestedBank = new URLSearchParams(window.location.search).get("bankId");
          const exists = bData.banks.some((bank: BankItem) => String(bank.id) === requestedBank);
          setBankId(exists && requestedBank ? requestedBank : String(bData.banks[0].id));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setQuestionText("");
    setType("mcq");
    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");
    setCorrectOption("a");
    setDescriptiveGuide("");
    setExplanation("");
    setMarks(4);
    setNegativeMarks(1);
    setDifficulty("medium");
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (q: QuestionItem) => {
    setEditingId(q.id);
    setBankId(q.bankId ? String(q.bankId) : "");
    setQuestionText(q.questionText);
    setType(q.type as "mcq" | "descriptive");

    if (q.type === "mcq" && q.options) {
      const opts = q.options;
      setOptA(opts.find((o) => o.id === "a")?.text || "");
      setOptB(opts.find((o) => o.id === "b")?.text || "");
      setOptC(opts.find((o) => o.id === "c")?.text || "");
      setOptD(opts.find((o) => o.id === "d")?.text || "");
      setCorrectOption(q.correctOption || "a");
    } else {
      setOptA("");
      setOptB("");
      setOptC("");
      setOptD("");
    }

    setDescriptiveGuide(q.descriptiveGuide || "");
    setExplanation(q.explanation || "");
    setMarks(q.marks);
    setNegativeMarks(q.negativeMarks);
    setDifficulty(q.difficulty);
    setError(null);
    setShowModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let optionsPayload = null;
    if (type === "mcq") {
      if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
        setError("Please fill out all 4 MCQ options (A, B, C, and D).");
        setSaving(false);
        return;
      }
      optionsPayload = [
        { id: "a", text: optA.trim() },
        { id: "b", text: optB.trim() },
        { id: "c", text: optC.trim() },
        { id: "d", text: optD.trim() },
      ];
    }

    const payload = {
      bankId: bankId ? parseInt(bankId) : null,
      questionText: questionText.trim(),
      type,
      options: optionsPayload,
      correctOption: type === "mcq" ? correctOption : null,
      descriptiveGuide: type === "descriptive" ? descriptiveGuide.trim() : null,
      explanation: explanation.trim() || null,
      marks: Number(marks),
      negativeMarks: type === "mcq" ? Number(negativeMarks) : 0,
      difficulty,
    };

    try {
      const url = editingId ? `/api/admin/questions/${editingId}` : "/api/admin/questions";
      const method = editingId ? "PUT" : "POST";

      const res = await portalFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save question");
      } else {
        setShowModal(false);
        // refresh questions
        const qRes = await portalFetch("/api/admin/questions");
        if (qRes.ok) {
          const qData = await qRes.json();
          setQuestions(qData.questions || []);
        }
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this question?")) return;
    setDeletingId(id);
    try {
      const res = await portalFetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      } else {
        alert("Failed to delete question");
      }
    } catch {
      alert("Error deleting question");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchSearch = q.questionText.toLowerCase().includes(search.toLowerCase());
    const matchBank = bankFilter === "all" || (q.bankId && String(q.bankId) === bankFilter);
    const matchType = typeFilter === "all" || q.type === typeFilter;
    return matchSearch && matchBank && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Questions Repository</h1>
          <p className="text-xs text-slate-500">
            Create, categorize, and fine-tune multiple choice and descriptive items
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/generator" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow transition hover:from-indigo-700 hover:to-purple-700">
            <WandSparkles className="h-4 w-4" /> Generate with AI Studio
          </Link>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition"
          >
            <PlusCircle className="w-4 h-4" /> Add New Question
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by keyword..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">Bank:</span>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">All Banks</option>
              {banks.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="descriptive">Descriptive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Question List */}
      {loading ? (
        <div className="py-20 flex justify-center items-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm">Loading questions...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No questions match criteria</p>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Add New Question&quot; to expand your assessment library.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, index) => (
            <div
              key={q.id}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      q.type === "mcq"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {q.type}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {q.bankName || "General Bank"}
                  </span>
                  <span className="text-[11px] text-slate-400">• Difficulty: {q.difficulty}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    +{q.marks} Marks {q.negativeMarks > 0 && `(-${q.negativeMarks})`}
                  </span>
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {q.questionText}
              </p>

              {/* MCQ Options Display */}
              {q.type === "mcq" && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {q.options.map((opt) => {
                    const isCorrect = opt.id.toLowerCase() === (q.correctOption || "").toLowerCase();
                    return (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${
                          isCorrect
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-medium"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] uppercase shrink-0 ${
                            isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrect && (
                          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Descriptive Guide Display */}
              {q.type === "descriptive" && q.descriptiveGuide && (
                <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs text-purple-900">
                  <span className="font-bold block mb-0.5">Faculty Evaluation Guide:</span>
                  <p className="text-[11px] leading-relaxed text-purple-800">
                    {q.descriptiveGuide}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                {editingId ? "Edit Question" : "Create New Question"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Question Bank
                  </label>
                  <select
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Question Format
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "mcq" | "descriptive")}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="descriptive">Descriptive / Essay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Text / Prompt *
                </label>
                <textarea
                  rows={3}
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the complete question prompt..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* MCQ Options Config */}
              {type === "mcq" && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-800 block">
                    Multiple Choice 4 Options & Correct Answer Designation
                  </span>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 w-16">
                        <input
                          type="radio"
                          name="correctOption"
                          value="a"
                          checked={correctOption === "a"}
                          onChange={() => setCorrectOption("a")}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Option A:
                      </label>
                      <input
                        type="text"
                        required
                        value={optA}
                        onChange={(e) => setOptA(e.target.value)}
                        placeholder="Option A description"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 w-16">
                        <input
                          type="radio"
                          name="correctOption"
                          value="b"
                          checked={correctOption === "b"}
                          onChange={() => setCorrectOption("b")}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Option B:
                      </label>
                      <input
                        type="text"
                        required
                        value={optB}
                        onChange={(e) => setOptB(e.target.value)}
                        placeholder="Option B description"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 w-16">
                        <input
                          type="radio"
                          name="correctOption"
                          value="c"
                          checked={correctOption === "c"}
                          onChange={() => setCorrectOption("c")}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Option C:
                      </label>
                      <input
                        type="text"
                        required
                        value={optC}
                        onChange={(e) => setOptC(e.target.value)}
                        placeholder="Option C description"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 w-16">
                        <input
                          type="radio"
                          name="correctOption"
                          value="d"
                          checked={correctOption === "d"}
                          onChange={() => setCorrectOption("d")}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Option D:
                      </label>
                      <input
                        type="text"
                        required
                        value={optD}
                        onChange={(e) => setOptD(e.target.value)}
                        placeholder="Option D description"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Descriptive Evaluation Guide */}
              {type === "descriptive" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grading Rubric / Evaluation Guide (for instructor review)
                  </label>
                  <textarea
                    rows={3}
                    value={descriptiveGuide}
                    onChange={(e) => setDescriptiveGuide(e.target.value)}
                    placeholder="List expected points, keywords, diagrams, or solution summary for evaluator..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marks Awarded *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                {type === "mcq" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Negative Marking (deducted if wrong)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={negativeMarks}
                      onChange={(e) => setNegativeMarks(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Explanation (displayed to student in post-exam review)
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Detailed rationale for the correct answer..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow"
                >
                  {saving ? "Saving..." : editingId ? "Update Question" : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
