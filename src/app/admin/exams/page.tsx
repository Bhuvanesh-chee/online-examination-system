"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Clock,
  Award,
  HelpCircle,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface ExamItem {
  id: number;
  title: string;
  code: string;
  description: string | null;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  status: string;
  questionCount: number;
  attemptCount: number;
  createdAt: string;
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await portalFetch("/api/admin/exams");
      if (res.ok) {
        const data = await res.json();
        setExams(data.examinations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this examination? All linked attempts will be deleted.")) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await portalFetch(`/api/admin/exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExams((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert("Failed to delete exam");
      }
    } catch {
      alert("Error deleting exam");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredExams = exams.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Examination Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure test parameters, schedule durations, and assign questions
          </p>
        </div>
        <Link
          href="/admin/exams/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition"
        >
          <PlusCircle className="w-4 h-4" /> Create New Examination
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exam title, code, or subject..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label className="text-xs font-semibold text-slate-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm">Loading examinations...</span>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No examinations found</p>
          <p className="text-xs text-slate-400 mt-1">
            Create an examination to start scheduling tests for students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {exam.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      exam.status === "published"
                        ? "bg-emerald-100 text-emerald-800"
                        : exam.status === "draft"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {exam.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1.5 leading-snug line-clamp-2">
                  {exam.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {exam.description || "No specific description configured."}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>{exam.durationMinutes} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{exam.totalMarks} Marks (Pass: {exam.passingMarks})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                    <span>{exam.questionCount} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{exam.attemptCount} Attempt(s)</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">{exam.subject}</span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/exams/${exam.id}/edit`}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition"
                    title="Edit Exam"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    disabled={deletingId === exam.id}
                    className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-white rounded-lg transition"
                    title="Delete Exam"
                  >
                    {deletingId === exam.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
