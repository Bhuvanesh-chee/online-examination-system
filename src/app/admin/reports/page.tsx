"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  Filter,
  Award,
  CheckCircle2,
  XCircle,
  Users,
  Printer,
  Loader2,
  Search,
} from "lucide-react";

interface ExamOption {
  id: number;
  title: string;
  code: string;
}

interface ReportRecord {
  attemptId: number;
  examId: number;
  examTitle: string;
  examCode: string;
  subject: string;
  totalMarks: number;
  passingMarks: number;
  studentName: string;
  studentRollNo: string | null;
  studentEmail: string;
  department: string | null;
  totalScore: number;
  mcqScore: number;
  descriptiveScore: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  tabSwitchCount: number;
  status: string;
  submittedAt: string | null;
}

interface SummaryData {
  totalSubmissions: number;
  passedSubmissions: number;
  failedSubmissions: number;
  passPercentage: number;
  averageScore: number;
  highestScore: number;
}

export default function AdminReportsPage() {
  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);
  const [selectedExam, setSelectedExam] = useState("all");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData(selectedExam);
  }, [selectedExam]);

  const fetchReportData = async (examId: string) => {
    setLoading(true);
    try {
      const res = await portalFetch(`/api/admin/reports?examId=${examId}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setRecords(data.records || []);
        setExamOptions(data.examOptions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      "Student Name",
      "Roll No",
      "Email",
      "Department",
      "Exam Code",
      "Exam Title",
      "Score",
      "Total Marks",
      "Percentage",
      "Result",
      "Status",
      "Tab Switches",
    ];

    const rows = records.map((r) => [
      `"${r.studentName}"`,
      `"${r.studentRollNo || ""}"`,
      `"${r.studentEmail}"`,
      `"${r.department || ""}"`,
      `"${r.examCode}"`,
      `"${r.examTitle}"`,
      r.totalScore,
      r.totalMarks,
      `${Math.round((r.totalScore / (r.totalMarks || 1)) * 100)}%`,
      r.isPassed ? "PASSED" : "FAILED",
      r.status,
      r.tabSwitchCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exam_reports_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter(
    (r) =>
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      (r.studentRollNo && r.studentRollNo.toLowerCase().includes(search.toLowerCase())) ||
      r.examTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Examination Results & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated statistics, candidate scorecards, and audit analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export CSV Report
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600">Filter Exam:</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Examinations Combined</option>
            {examOptions.map((ex) => (
              <option key={ex.id} value={String(ex.id)}>
                {ex.code} - {ex.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name or roll no..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Tests</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{summary.totalSubmissions}</div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Passed</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.passedSubmissions}</div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Failed</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">{summary.failedSubmissions}</div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Pass Rate</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{summary.passPercentage}%</div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg Score</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{summary.averageScore} pts</div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Highest Score</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">{summary.highestScore} pts</div>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-sm">Calculating metrics...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No matching submission records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Roll No</th>
                  <th className="px-6 py-3">Exam</th>
                  <th className="px-6 py-3">MCQ</th>
                  <th className="px-6 py-3">Descriptive</th>
                  <th className="px-6 py-3">Total Score</th>
                  <th className="px-6 py-3">Result</th>
                  <th className="px-6 py-3">Anti-Cheating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => {
                  const pct = Math.round((r.totalScore / (r.totalMarks || 1)) * 100);

                  return (
                    <tr key={r.attemptId} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{r.studentName}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {r.studentRollNo || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 text-xs">{r.examCode}</div>
                        <div className="text-[11px] text-slate-400">{r.examTitle}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">{r.mcqScore}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {r.descriptiveScore}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">
                          {r.totalScore} / {r.totalMarks}
                        </div>
                        <div className="text-[11px] text-slate-400">{pct}%</div>
                      </td>
                      <td className="px-6 py-4">
                        {r.isPassed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                            PASSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                            FAILED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {r.tabSwitchCount > 0 ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                            {r.tabSwitchCount} flag(s)
                          </span>
                        ) : (
                          <span className="text-emerald-600">Clean</span>
                        )}
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
