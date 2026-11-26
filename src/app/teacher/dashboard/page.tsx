"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Users, UserCheck, Activity, Award, ArrowRight } from "lucide-react";

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
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<AllocatedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/teacher/students", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(data.error || "Failed to load students");
        setStudents(data.students ?? []);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load students");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeCount = students.filter((s) => s.isActive && s.approvalStatus === "approved").length;
  const totalAttempts = students.reduce((sum, s) => sum + s.totalAttempts, 0);
  const averageScore =
    students.length > 0
      ? Math.round(
          (students.reduce((sum, s) => sum + s.averageScore, 0) / students.length) * 10
        ) / 10
      : 0;

  const stats = [
    { label: "Allocated Students", value: students.length, icon: Users },
    { label: "Active Students", value: activeCount, icon: UserCheck },
    { label: "Total Attempts", value: totalAttempts, icon: Activity },
    { label: "Avg. Score", value: averageScore, icon: Award },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#A12D33] to-[#7d1f24] text-white p-6 sm:p-8 shadow-lg">
        <p className="text-xs uppercase tracking-widest text-[#f3d6d8] font-semibold">
          Teacher Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
          Welcome, {user?.name || "Teacher"}
        </h1>
        <p className="text-sm text-[#f3d6d8] mt-2 max-w-2xl">
          View the students allocated to you by the administrator and monitor their
          examination activity.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#A12D33]/10 text-[#A12D33] flex items-center justify-center mb-3">
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {loading ? "—" : value}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">My Students</h2>
          <Link
            href="/teacher/students"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#A12D33] hover:underline"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading allocated students...
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No students have been allocated to you yet. Please contact the administrator.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Roll No</th>
                  <th className="px-5 py-3 font-semibold">Attempts</th>
                  <th className="px-5 py-3 font-semibold">Avg. Score</th>
                  <th className="px-5 py-3 font-semibold">Passed</th>
                </tr>
              </thead>
              <tbody>
                {students.slice(0, 8).map((student) => (
                  <tr key={student.allocationId} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600">
                      {student.rollNo || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{student.totalAttempts}</td>
                    <td className="px-5 py-3 text-slate-700">{student.averageScore}</td>
                    <td className="px-5 py-3 text-slate-700">{student.passedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
