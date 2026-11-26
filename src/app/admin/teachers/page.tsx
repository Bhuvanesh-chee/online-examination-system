"use client";

import { portalFetch } from "@/lib/browser-session";
import { useEffect, useState } from "react";
import {
  BookOpen,
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

interface TeacherAccount {
  id: number;
  name: string;
  email: string;
  department: string | null;
  phone: string | null;
  isActive: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedAt: string | null;
  allocatedStudents: number;
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetTeacher, setTargetTeacher] = useState<TeacherAccount | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDept, setNewDept] = useState("Computer Science and Engineering");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetPwd, setResetPwd] = useState("");

  const fetchTeachers = async () => {
    try {
      const res = await portalFetch("/api/admin/teachers");
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await portalFetch("/api/admin/teachers");
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (active) setTeachers(data.teachers || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const runAction = async (body: Record<string, unknown>, failure: string) => {
    try {
      const res = await portalFetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchTeachers();
        return true;
      }
      const d = await res.json();
      alert(d.error || failure);
      return false;
    } catch {
      alert(failure);
      return false;
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await runAction(
      {
        action: "create-teacher",
        name: newName,
        email: newEmail,
        department: newDept,
        newPassword,
      },
      "Failed to create teacher"
    );
    setSaving(false);
    if (ok) {
      setShowAddModal(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeacher) return;
    setSaving(true);
    const ok = await runAction(
      { action: "reset-password", teacherId: targetTeacher.id, newPassword: resetPwd },
      "Failed to reset password"
    );
    setSaving(false);
    if (ok) {
      setShowPasswordModal(false);
      setResetPwd("");
      alert(`Password for ${targetTeacher.name} successfully updated.`);
    }
  };

  const filtered = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#A12D33]" />
            Teacher Account Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, approve and manage faculty accounts
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A12D33] hover:bg-[#7d1f24] text-white text-xs font-semibold shadow transition"
        >
          <PlusCircle className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#A12D33]"
          />
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          {filtered.length} teacher account(s)
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#A12D33]" />
            <span className="text-sm">Loading directory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No teacher accounts yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Teacher Info</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Allocated Students</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{t.name}</div>
                      <div className="text-[11px] text-slate-400">{t.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {t.department || "CSE"}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                      {t.allocatedStudents}
                    </td>
                    <td className="px-6 py-4">
                      {t.approvalStatus === "pending" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Pending Approval
                        </span>
                      ) : t.approvalStatus === "rejected" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Rejected
                        </span>
                      ) : t.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                          <XCircle className="w-3.5 h-3.5 text-slate-500" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {t.approvalStatus === "pending" && (
                          <>
                            <button
                              onClick={() => runAction({ action: "approve", teacherId: t.id }, "Failed to approve teacher")}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => runAction({ action: "reject", teacherId: t.id }, "Failed to reject teacher")}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setTargetTeacher(t);
                            setShowPasswordModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-[#A12D33] hover:bg-slate-100 rounded-lg transition"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            runAction(
                              { action: "toggle-status", teacherId: t.id, isActive: !t.isActive },
                              "Failed to toggle status"
                            )
                          }
                          className={`p-1.5 rounded-lg transition ${
                            t.isActive
                              ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={t.isActive ? "Deactivate Account" : "Activate Account"}
                        >
                          {t.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Teacher</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              New teacher accounts start as pending and must be approved before they can sign in.
            </p>

            <form onSubmit={handleCreateTeacher} className="space-y-3">
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
                  className="px-5 py-2 text-xs bg-[#A12D33] text-white rounded-lg font-semibold hover:bg-[#7d1f24]"
                >
                  {saving ? "Saving..." : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && targetTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Reset Password: {targetTeacher.name}
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
                  className="px-4 py-1.5 text-xs bg-[#A12D33] text-white rounded-lg font-semibold hover:bg-[#7d1f24]"
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
