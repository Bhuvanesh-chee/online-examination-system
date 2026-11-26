"use client";

import { portalFetch } from "@/lib/browser-session";
import { useEffect, useState } from "react";
import { GitBranch, Loader2, PlusCircle, Trash2, UserCheck } from "lucide-react";

interface TeacherOption {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  approvalStatus: string;
}

interface StudentOption {
  id: number;
  name: string;
  email: string;
  studentId: string | null;
  isActive: boolean;
  approvalStatus: string;
}

interface Allocation {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentRoll: string | null;
  createdAt: string;
}

export default function AdminAllocationsPage() {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [teacherId, setTeacherId] = useState("");
  const [studentId, setStudentId] = useState("");

  const loadAll = async () => {
    try {
      const [teachersRes, studentsRes, allocationsRes] = await Promise.all([
        portalFetch("/api/admin/teachers"),
        portalFetch("/api/admin/students"),
        portalFetch("/api/admin/allocations"),
      ]);
      const teachersData = teachersRes.ok ? await teachersRes.json() : { teachers: [] };
      const studentsData = studentsRes.ok ? await studentsRes.json() : { students: [] };
      const allocationsData = allocationsRes.ok ? await allocationsRes.json() : { allocations: [] };
      setTeachers(teachersData.teachers || []);
      setStudents(studentsData.students || []);
      setAllocations(allocationsData.allocations || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load allocation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [teachersRes, studentsRes, allocationsRes] = await Promise.all([
          portalFetch("/api/admin/teachers"),
          portalFetch("/api/admin/students"),
          portalFetch("/api/admin/allocations"),
        ]);
        const teachersData = teachersRes.ok ? await teachersRes.json() : { teachers: [] };
        const studentsData = studentsRes.ok ? await studentsRes.json() : { students: [] };
        const allocationsData = allocationsRes.ok ? await allocationsRes.json() : { allocations: [] };
        if (!active) return;
        setTeachers(teachersData.teachers || []);
        setStudents(studentsData.students || []);
        setAllocations(allocationsData.allocations || []);
      } catch (err) {
        console.error(err);
        if (active) setError("Failed to load allocation data.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const eligibleTeachers = teachers.filter(
    (t) => t.approvalStatus === "approved" && t.isActive
  );
  const eligibleStudents = students.filter(
    (s) => s.approvalStatus === "approved" && s.isActive
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teacherId || !studentId) {
      setError("Select both a teacher and a student.");
      return;
    }
    setSaving(true);
    try {
      const res = await portalFetch("/api/admin/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: Number(teacherId), studentId: Number(studentId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create allocation.");
        return;
      }
      setTeacherId("");
      setStudentId("");
      await loadAll();
    } catch {
      setError("Failed to create allocation.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this teacher-student allocation?")) return;
    try {
      const res = await portalFetch(`/api/admin/allocations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAllocations((prev) => prev.filter((a) => a.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove allocation.");
      }
    } catch {
      alert("Failed to remove allocation.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-[#A12D33]" />
          Teacher–Student Allocations
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Assign approved students to approved teachers. Teachers only see their allocated students.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#A12D33]"
            >
              <option value="">Select an approved teacher</option>
              {eligibleTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#A12D33]"
            >
              <option value="">Select an approved student</option>
              {eligibleStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.studentId ? `(${s.studentId})` : `(${s.email})`}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#A12D33] hover:bg-[#7d1f24] disabled:opacity-70 text-white text-xs font-semibold shadow transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            {saving ? "Assigning..." : "Assign Student"}
          </button>
        </form>
        {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
        {eligibleTeachers.length === 0 && (
          <p className="mt-3 text-xs text-amber-700">
            No approved teachers available. Approve a teacher account first.
          </p>
        )}
        {eligibleStudents.length === 0 && (
          <p className="mt-1 text-xs text-amber-700">
            No approved students available. Approve a student account first.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#A12D33]" />
            Current Allocations
          </h2>
          <span className="text-xs text-slate-500">{allocations.length} allocation(s)</span>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center items-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#A12D33]" />
            <span className="text-sm">Loading allocations...</span>
          </div>
        ) : allocations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No allocations yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Teacher</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Assigned</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{a.teacherName}</div>
                      <div className="text-[11px] text-slate-400">{a.teacherEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{a.studentName}</div>
                      <div className="text-[11px] text-slate-400">
                        {a.studentRoll ? `Roll: ${a.studentRoll}` : a.studentEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Remove allocation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
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
