"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Users,
  Search,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  ArrowRight,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface AttemptRecord {
  attemptId: number;
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  rollNo?: string;
  examId: number;
  examTitle: string;
  subject: string;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  status: string;
  endTime: string | null;
  createdAt: string;
}

interface AllocatedStudent {
  allocationId: number;
  studentId: number;
  name: string;
  email: string;
  rollNo: string | null;
  department: string | null;
  isActive: boolean;
  approvalStatus: string;
  totalAttempts: number;
  averageScore: number;
  passedCount: number;
  latestScore: number | null;
  latestExamTitle: string | null;
  attempts: AttemptRecord[];
}

interface Analytics {
  totalStudents: number;
  totalCompletedExams: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  passPercentage: number;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<AllocatedStudent[]>([]);
  const [results, setResults] = useState<AttemptRecord[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"students" | "results">("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamFilter, setSelectedExamFilter] = useState("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  const [selectedStudent, setSelectedStudent] = useState<AllocatedStudent | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/teacher/students", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(data.error || "Failed to load teacher data");
        setStudents(data.students ?? []);
        setResults(data.results ?? []);
        setAnalytics(data.analytics ?? null);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load student performance data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const uniqueExams = useMemo(() => {
    const set = new Set(results.map((r) => r.examTitle));
    return Array.from(set);
  }, [results]);

  const uniqueSubjects = useMemo(() => {
    const set = new Set(results.map((r) => r.subject));
    return Array.from(set);
  }, [results]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q));
      return matchQuery;
    });
  }, [students, searchQuery]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        (r.studentName && r.studentName.toLowerCase().includes(q)) ||
        (r.studentEmail && r.studentEmail.toLowerCase().includes(q)) ||
        (r.rollNo && r.rollNo.toLowerCase().includes(q)) ||
        r.examTitle.toLowerCase().includes(q);

      const matchExam = selectedExamFilter === "all" || r.examTitle === selectedExamFilter;
      const matchSubject = selectedSubjectFilter === "all" || r.subject === selectedSubjectFilter;
      const matchStatus =
        selectedStatusFilter === "all" ||
        (selectedStatusFilter === "passed" && r.isPassed) ||
        (selectedStatusFilter === "failed" && !r.isPassed);

      return matchQuery && matchExam && matchSubject && matchStatus;
    });
  }, [results, searchQuery, selectedExamFilter, selectedSubjectFilter, selectedStatusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-slate-600">
        <Loader2 className="w-6 h-6 animate-spin text-[#A12D33]" />
        <span className="text-sm font-semibold">Loading Student Performance & Examination Results...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#A12D33]/10 text-[#A12D33] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Student Performance & Results</h1>
            <p className="text-xs text-slate-500">
              Monitor assigned cohort examination scores, completion rates, and historical analytics.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === "students" ? "bg-white text-[#A12D33] shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Assigned Students ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === "results" ? "bg-white text-[#A12D33] shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Examination Results ({results.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Students</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{analytics.totalStudents}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Completed Exams</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{analytics.totalCompletedExams}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Avg Score</div>
            <div className="text-2xl font-extrabold text-[#A12D33] mt-1">{analytics.averageMarks}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Highest Score</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{analytics.highestMarks}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Lowest Score</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{analytics.lowestMarks}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pass Rate</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">{analytics.passPercentage}%</div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll no..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#A12D33]"
          />
        </div>

        {activeTab === "results" && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedExamFilter}
              onChange={(e) => setSelectedExamFilter(e.target.value)}
              aria-label="Filter by examination"
              className="text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#A12D33] bg-white"
            >
              <option value="all">All Examinations</option>
              {uniqueExams.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>

            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              aria-label="Filter by subject"
              className="text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#A12D33] bg-white"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#A12D33] bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        )}
      </div>

      {/* Content Tab 1: Assigned Students */}
      {activeTab === "students" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No allocated students match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-5 py-3 font-semibold">Roll No</th>
                    <th className="px-5 py-3 font-semibold">Department</th>
                    <th className="px-5 py-3 font-semibold text-center">Completed Exams</th>
                    <th className="px-5 py-3 font-semibold text-center">Avg. Score</th>
                    <th className="px-5 py-3 font-semibold text-center">Latest Result</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.allocationId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{student.name}</div>
                        <div className="text-xs text-slate-500">{student.email}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {student.rollNo || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        {student.department || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                        {student.totalAttempts}
                      </td>
                      <td className="px-5 py-3.5 text-center font-extrabold text-[#A12D33]">
                        {student.averageScore}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {student.latestScore !== null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                            {student.latestScore} marks ({student.latestExamTitle})
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No exams yet</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#A12D33]/10 hover:bg-[#A12D33] text-[#A12D33] hover:text-white text-xs font-semibold transition"
                        >
                          View Performance <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Content Tab 2: Examination Results */}
      {activeTab === "results" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredResults.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No completed examination results match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-5 py-3 font-semibold">Examination</th>
                    <th className="px-5 py-3 font-semibold">Subject</th>
                    <th className="px-5 py-3 font-semibold text-center">Marks</th>
                    <th className="px-5 py-3 font-semibold text-center">Percentage</th>
                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                    <th className="px-5 py-3 font-semibold">Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result.attemptId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{result.studentName}</div>
                        <div className="text-xs text-slate-500 font-mono">{result.rollNo || result.studentEmail}</div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {result.examTitle}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        {result.subject}
                      </td>
                      <td className="px-5 py-3.5 text-center font-extrabold text-slate-900">
                        {result.totalScore} <span className="text-xs font-normal text-slate-400">/ {result.totalMarks}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-[#A12D33]">
                        {result.percentage}%
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {result.isPassed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {result.endTime ? new Date(result.endTime).toLocaleString() : new Date(result.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Individual Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#A12D33]" /> {selectedStudent.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedStudent.email} {selectedStudent.rollNo ? `• Roll No: ${selectedStudent.rollNo}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-semibold uppercase">Exams Completed</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">{selectedStudent.totalAttempts}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-semibold uppercase">Average Score</div>
                <div className="text-xl font-extrabold text-[#A12D33] mt-1">{selectedStudent.averageScore}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-semibold uppercase">Exams Passed</div>
                <div className="text-xl font-extrabold text-emerald-600 mt-1">{selectedStudent.passedCount}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Examination History & Results</h3>
              {selectedStudent.attempts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  This student has not completed any examinations yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedStudent.attempts.map((att) => (
                    <div key={att.attemptId} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{att.examTitle}</div>
                        <div className="text-slate-500 mt-0.5">Subject: {att.subject} • Submitted: {new Date(att.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-slate-900">
                          {att.totalScore} / {att.totalMarks} <span className="text-[#A12D33]">({att.percentage}%)</span>
                        </div>
                        <div className="mt-0.5">
                          {att.isPassed ? (
                            <span className="text-emerald-700 font-semibold">Passed</span>
                          ) : (
                            <span className="text-red-600 font-semibold">Failed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
