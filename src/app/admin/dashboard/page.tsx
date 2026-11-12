"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileSpreadsheet,
  HelpCircle,
  Award,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  Eye,
  FileCheck,
  BarChart3,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Clock,
  WandSparkles,
} from "lucide-react";

interface AdminStats {
  totalStudents: number;
  totalExams: number;
  totalQuestions: number;
  totalAttempts: number;
  passRate: number;
  averageScore: number;
}

interface RecentSubmission {
  attemptId: number;
  status: string;
  totalScore: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  tabSwitchCount: number;
  createdAt: string;
  studentName: string;
  studentId: string | null;
  studentEmail: string;
  examTitle: string;
  examCode: string;
  totalMarks: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await portalFetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecent(data.recentSubmissions || []);
      }
    } catch (err) {
      console.error("Failed to load admin stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading administrative metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrative Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            System overview, active proctoring status, and exam statistics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/exams/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition"
          >
            <PlusCircle className="w-4 h-4" /> Create Exam
          </Link>
          <Link
            href="/admin/monitoring"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition"
          >
            <Eye className="w-4 h-4 text-emerald-400" /> Live Monitor
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Students</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.totalStudents || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Enrolled examinees</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Examinations</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.totalExams || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Configured tests</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Question Bank</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.totalQuestions || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">MCQ & Descriptive items</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Submissions</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.totalAttempts || 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {stats?.passRate || 0}% overall pass rate
          </div>
        </div>
      </div>

      {/* Question Studio — the project's distinctive admin workflow */}
      <Link href="/admin/generator" className="group flex flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 p-5 text-white shadow-lg transition hover:shadow-xl sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-white/20 bg-white/15 p-3"><WandSparkles className="h-6 w-6 text-amber-200" /></div>
          <div>
            <div className="mb-1 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-100">Unique feature · Saves faculty time</div>
            <h2 className="text-lg font-extrabold sm:text-xl">AI Question Studio</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-indigo-100 sm:text-sm">Choose Java, DSA or Frontend. Set a topic and Easy, Medium or Hard difficulty, then review, edit and save questions to a bank or a draft exam.</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 transition group-hover:bg-indigo-50">Open Question Studio <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </Link>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/questions"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Add Questions</div>
              <div className="text-[11px] text-slate-500">MCQ & Descriptive</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href="/admin/evaluations"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Manual Grading</div>
              <div className="text-[11px] text-slate-500">Review Essay Answers</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href="/admin/monitoring"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-sm transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Live Proctoring</div>
              <div className="text-[11px] text-slate-500">Monitor Active Tests</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href="/admin/reports"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Exam Reports</div>
              <div className="text-[11px] text-slate-500">Scores & Exports</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Student Submissions</h2>
            <p className="text-xs text-slate-500">Latest completed or in-progress examinations</p>
          </div>
          <Link
            href="/admin/reports"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            View Full Reports <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No examination submissions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Examination</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Anti-Cheating Flags</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((sub) => {
                  const isPassed = sub.isPassed;
                  const isPending = sub.status === "submitted";

                  return (
                    <tr key={sub.attemptId} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{sub.studentName}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {sub.studentId || sub.studentEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{sub.examTitle}</div>
                        <div className="text-xs text-slate-400 font-mono">{sub.examCode}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">
                          {sub.totalScore} / {sub.totalMarks}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {Math.round((sub.totalScore / (sub.totalMarks || 1)) * 100)}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isPending ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Pending Grading
                          </span>
                        ) : sub.status === "evaluated" ? (
                          isPassed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Passed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                              Failed
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {sub.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {sub.tabSwitchCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            {sub.tabSwitchCount} tab switch(es)
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Clean session
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/evaluations?attemptId=${sub.attemptId}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Review & Grade
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
