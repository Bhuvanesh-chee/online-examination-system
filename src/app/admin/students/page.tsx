"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState } from "react";
import {
  Users,
  PlusCircle,
  Search,
  KeyRound,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  UserCheck,
  UserX,
} from "lucide-react";

interface StudentAccount {
  id: number;
  name: string;
  email: string;
  studentId: string | null;
  department: string | null;
  phone: string | null;
  isActive: boolean;
  totalAttempts: number;
  averageScore: number;
  passedCount: number;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetStudent, setTargetStudent] = useState<StudentAccount | null>(null);

  // New student form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newDept, setNewDept] = useState("B.Tech Computer Science and Engineering");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset password form
  const [resetPwd, setResetPwd] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await portalFetch("/api/admin/students");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (studentId: number, currentStatus: boolean) => {
    try {
      const res = await portalFetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-status",
          studentId,
          isActive: !currentStatus,
        }),
      });
      if (res.ok) {
        setStudents(
          students.map((s) => (s.id === studentId ? { ...s, isActive: !currentStatus } : s))
        );
      }
    } catch {
      alert("Failed to toggle status");
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await portalFetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-student",
          name: newName,
          email: newEmail,
          customStudentId: newStudentId,
          department: newDept,
          newPassword,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewName("");
        setNewEmail("");
        setNewStudentId("");
        setNewPassword("");
        fetchStudents();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create student");
      }
    } catch {
      alert("Error contacting server");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent) return;
    setSaving(true);
    try {
      const res = await portalFetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          studentId: targetStudent.id,
          newPassword: resetPwd,
        }),
      });
      if (res.ok) {
        setShowPasswordModal(false);
        setResetPwd("");
        alert(`Password for ${targetStudent.name} successfully updated.`);
      } else {
        const d = await res.json();
        alert(d.error || "Failed to reset password");
      }
    } catch {
      alert("Error resetting password");
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Student Account Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student registrations, academic IDs, and credential resets
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition"
        >
          <PlusCircle className="w-4 h-4" /> Enroll New Student
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Showing {filtered.length} registered student(s)
        </span>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-sm">Loading directory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No students registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student Info</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Exams Taken</th>
                  <th className="px-6 py-3">Average Score</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-xs text-blue-600 font-mono">
                        Roll: {s.studentId || "N/A"}
                      </div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{s.department || "CSE"}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                      {s.totalAttempts} attempt(s) ({s.passedCount} passed)
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{s.averageScore} pts</span>
                    </td>
                    <td className="px-6 py-4">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setTargetStudent(s);
                            setShowPasswordModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s.id, s.isActive)}
                          className={`p-1.5 rounded-lg transition ${
                            s.isActive
                              ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={s.isActive ? "Deactivate Account" : "Activate Account"}
                        >
                          {s.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Enroll Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Roll / Student ID</label>
                <input
                  type="text"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder="2500030116"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  {saving ? "Saving..." : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && targetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Reset Password: {targetStudent.name}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPwd}
                  onChange={(e) => setResetPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
