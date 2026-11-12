"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  FileText,
  AlertTriangle,
  Search,
} from "lucide-react";

interface HistoryRow {
  attemptId: number;
  examId: number;
  attemptNumber: number;
  status: string;
  startTime: string;
  endTime: string | null;
  timeSpentSeconds: number;
  totalScore: number;
  mcqScore: number;
  descriptiveScore: number;
  isPassed: boolean;
  examTitle: string;
  examCode: string;
  subject: string;
  totalMarks: number;
  passingMarks: number;
}

export default function StudentHistoryPage() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await portalFetch("/api/student/results");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = history.filter((h) => {
    const matchesSearch =
      h.examTitle.toLowerCase().includes(search.toLowerCase()) ||
      h.examCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "passed" && h.isPassed && h.status === "evaluated") ||
      (statusFilter === "failed" && !h.isPassed && h.status === "evaluated") ||
      (statusFilter === "pending" && h.status !== "evaluated") ||
      (statusFilter === "in_progress" && h.status === "in_progress");
    return matchesSearch && matchesStatus;
  });

  const totalTime = history.reduce((sum, h) => sum + h.timeSpentSeconds, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-600" />
          Examination History
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          A complete timestamped log of every attempt you have made on the platform
        </p>
      </div>

      {/* Quick counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Attempts</span>
          <div className="text-2xl font-bold text-slate-900">{history.length}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Passed</span>
          <div className="text-2xl font-bold text-emerald-600">
            {history.filter((h) => h.status === "evaluated" && h.isPassed).length}
          </div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Pending Review</span>
          <div className="text-2xl font-bold text-amber-600">
            {history.filter((h) => h.status !== "evaluated").length}
          </div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Time On Tests</span>
          <div className="text-2xl font-bold text-blue-600">{Math.round(totalTime / 60)} min</div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by exam title or code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Outcome:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">All Records</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending Evaluation</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Timeline list */}
      {loading ? (
        <div className="py-20 flex justify-center items-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm">Loading attempt history...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No attempts recorded</p>
          <p className="text-xs text-slate-400 mt-1">
            Start with the JAVA101 demo paper from Available Examinations.
          </p>
          <Link
            href="/student/exams"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Browse Examinations <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => {
            const pct = Math.round((h.totalScore / (h.totalMarks || 1)) * 100);
            const isEvaluated = h.status === "evaluated";

            return (
              <div
                key={h.attemptId}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      !isEvaluated
                        ? "bg-amber-50 text-amber-600"
                        : h.isPassed
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {!isEvaluated ? (
                      <Clock className="w-5 h-5" />
                    ) : h.isPassed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{h.examTitle}</span>
                      <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                        {h.examCode}
                      </span>
                      <span className="text-[10px] text-slate-400">Attempt #{h.attemptNumber}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {h.subject} • Started {new Date(h.startTime).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {Math.floor(h.timeSpentSeconds / 60)}m{" "}
                        {h.timeSpentSeconds % 60}s
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> MCQ {h.mcqScore} pts
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Descriptive {h.descriptiveScore} pts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-slate-900">
                      {h.totalScore} <span className="text-xs font-medium text-slate-400">/ {h.totalMarks}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{pct}% • pass {h.passingMarks}</div>
                  </div>

                  {!isEvaluated ? (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 whitespace-nowrap">
                      {h.status === "in_progress" ? "IN PROGRESS" : "PENDING"}
                    </span>
                  ) : h.isPassed ? (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      PASSED
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800">
                      FAILED
                    </span>
                  )}

                  {h.status === "in_progress" ? (
                    <Link
                      href={`/student/exams/${h.examId}/live`}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                    >
                      Resume
                    </Link>
                  ) : (
                    <Link
                      href={`/student/results?attemptId=${h.attemptId}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5" /> Scorecard
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
