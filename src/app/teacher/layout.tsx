"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import TeacherNavbar from "@/components/teacher/TeacherNavbar";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#6DBFEC]" />
        <p className="text-sm font-medium text-slate-400">Loading teacher session...</p>
      </div>
    );
  }

  if (!user || user.role !== "teacher") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#A12D33]/10 text-[#A12D33] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Teacher Login Required</h2>
          <p className="text-sm text-slate-600 mb-6">
            Please sign in with an approved teacher account to view your allocated students.
          </p>
          <Link
            href="/login"
            className="block w-full py-2.5 px-4 bg-[#A12D33] hover:bg-[#7d1f24] text-white rounded-lg text-sm font-semibold transition shadow"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}

      <TeacherSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <TeacherNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
