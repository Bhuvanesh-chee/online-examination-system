"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentNavbar from "@/components/student/StudentNavbar";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLiveExam = pathname.includes("/live");

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#6DBFEC]" />
        <p className="text-sm font-medium text-slate-400">Loading student session...</p>
      </div>
    );
  }

  if (!user || user.role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#A12D33]/10 text-[#A12D33] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Student Login Required</h2>
          <p className="text-sm text-slate-600 mb-6">
            Please sign in with an approved student account to access your examination portal
            and test history.
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

  if (isLiveExam) {
    return <div className="min-h-screen bg-slate-900 text-slate-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}

      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <StudentNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
