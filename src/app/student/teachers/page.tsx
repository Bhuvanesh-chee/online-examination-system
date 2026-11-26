"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, UserCheck } from "lucide-react";

interface AssignedTeacher {
  id: number;
  name: string;
  email: string;
  department: string | null;
}

export default function StudentTeachersPage() {
  const [teachers, setTeachers] = useState<AssignedTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/student/teachers", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(data.error || "Failed to load teachers");
        setTeachers(data.teachers ?? []);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load teachers");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#A12D33]/10 text-[#A12D33] flex items-center justify-center">
          <UserCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Teachers</h1>
          <p className="text-sm text-slate-500">Faculty allocated to you by the administrator.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading assigned teachers...
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No teacher has been allocated to you yet. Please contact the administrator.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#A12D33] to-[#7d1f24] text-white flex items-center justify-center font-bold">
                  {teacher.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{teacher.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {teacher.department || "Faculty"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-[#A12D33]" />
                <span className="truncate">{teacher.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
