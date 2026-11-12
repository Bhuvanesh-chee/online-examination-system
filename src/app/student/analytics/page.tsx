"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Target,
  BarChart2,
  Loader2,
  BookOpen,
} from "lucide-react";

interface SubjectMetric {
  subject: string;
  attempts: number;
  averagePercentage: number;
}

interface ScoreTimelineItem {
  examTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  date: string;
}

export default function StudentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [passedCount, setPassedCount] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [subjectMetrics, setSubjectMetrics] = useState<SubjectMetric[]>([]);
  const [timeline, setTimeline] = useState<ScoreTimelineItem[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await portalFetch("/api/student/analytics");
      if (res.ok) {
        const data = await res.json();
        setTotalAttempts(data.totalAttempts || 0);
        setPassedCount(data.passedCount || 0);
        setAccuracy(data.accuracyPercentage || 0);
        setSubjectMetrics(data.subjectAnalytics || []);
        setTimeline(data.scoreTimeline || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm">Calculating performance metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          Academic Performance Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Holistic evaluation of your subject proficiencies, accuracy benchmarks, and score trends
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tests Taken</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{totalAttempts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total examinations</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pass Ratio</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{passRate}%</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {passedCount} of {totalAttempts} passed
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">MCQ Accuracy</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600">{accuracy}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Correct answer rate</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Competency</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {passRate >= 80 ? "Exemplary" : passRate >= 60 ? "Proficient" : "Progressing"}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">Academic grade tier</div>
        </div>
      </div>

      {/* Subject-Wise Mastery Bars */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          Subject Proficiency & Mastery
        </h2>

        {subjectMetrics.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Complete examinations to generate subject proficiency bars.
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {subjectMetrics.map((sm) => (
              <div key={sm.subject} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{sm.subject} ({sm.attempts} test{sm.attempts > 1 ? "s" : ""})</span>
                  <span className="font-bold text-blue-600">{sm.averagePercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, sm.averagePercentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-purple-600" />
          Score Progression Timeline
        </h2>

        {timeline.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No historical examinations recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {timeline.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.examTitle}</div>
                  <div className="text-xs text-slate-500">
                    Subject: {item.subject} • Date: {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">
                      {item.score} / {item.totalMarks} pts
                    </span>
                    <span className="block text-[11px] font-semibold text-blue-600">
                      {item.percentage}%
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      item.percentage >= 50
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {item.percentage >= 50 ? "PASS" : "FAIL"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
